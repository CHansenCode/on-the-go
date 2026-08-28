import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';

import { MicIcon, PauseIcon, PlayIcon, StopIcon } from './icons';
import { useTheme } from '../lib/theme';
import type { ApiCard } from '../lib/learningApi';
import { uploadRecording } from '../lib/learningApi';
import { getSession } from '../lib/auth';
import { cacheJustUploadedRecording, getLocalRecordingUri } from '../lib/wordRecordings';
import ScreenHeader from './ScreenHeader';
import SwipeableCard from './SwipeableCard';

// A recording gets cut off automatically at this length — matches
// main-frame's hard limit (ADR-002 in that repo) exactly, so an upload
// from here never gets rejected for being too long.
const MAX_RECORDING_MS = 10_000;

export type SessionCard = ApiCard & {
  // Client-side only, resets on every reload — there's no db-backed
  // review log yet (main-frame's decks_attempts table exists per its own
  // ADR-002, but nothing writes to it yet). See that repo's ADR-000.
  timesCompleted: number;
};

// Which language is shown as the prompt for a freshly-drawn card. Picked
// once per card draw so both directions get practiced.
function randomSide(): 'one' | 'two' {
  return Math.random() < 0.5 ? 'one' : 'two';
}

type Props = {
  cards: SessionCard[];
  languageOneLabel: string;
  languageTwoLabel: string;
  onExit: () => void;
};

export default function FlashcardSession({ cards: initial, languageOneLabel, languageTwoLabel, onExit }: Props) {
  const { colors } = useTheme();

  // In-memory only — this resets on every reload. There's no db yet, and
  // no logic yet for how often a card comes up or when it gets archived;
  // for now every card in the deck is equally likely, in a fixed order.
  const [cards, setCards] = useState<SessionCard[]>(initial);
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<'one' | 'two'>(randomSide());
  const [revealed, setRevealed] = useState(false);

  const card = cards[index % cards.length];

  const { prompt, answer } = useMemo(() => {
    if (side === 'one') {
      return { prompt: card.languageOne, answer: card.languageTwo };
    }
    return { prompt: card.languageTwo, answer: card.languageOne };
  }, [card, side]);

  const advance = () => {
    setIndex((i) => i + 1);
    setSide(randomSide());
    setRevealed(false);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const correct = direction === 'right';
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              timesCompleted: correct ? c.timesCompleted + 1 : c.timesCompleted,
            }
          : c
      )
    );
    advance();
  };

  // --- Word audio: one shared recorder + one shared player for the whole
  // session, same pattern as the Poems tab's folder screen — never more
  // than one thing recording or playing at a time.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  const [recordingWord, setRecordingWord] = useState<string | null>(null);
  const [uploadingWord, setUploadingWord] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  // Bumped after a successful upload to force a re-check of
  // getLocalRecordingUri — that's a plain filesystem read, not React
  // state, so nothing else would tell this component the file now exists.
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (playerStatus.didJustFinish) setPlayingWord(null);
  }, [playerStatus.didJustFinish]);

  const stopAndUpload = async () => {
    const word = recordingWord;
    if (!word) return;
    await recorder.stop();
    setRecordingWord(null);
    const uri = recorder.uri;
    if (!uri) return;

    setUploadingWord(word);
    try {
      const audioBase64 = await new File(uri).base64();
      const recordedBy = getSession()?.displayName;
      const { recordedAt } = await uploadRecording(word, audioBase64, recordedBy);
      await cacheJustUploadedRecording(word, uri, recordedAt);
      setLocalVersion((v) => v + 1);
    } catch (err) {
      Alert.alert('Could not save recording', (err as Error).message);
    } finally {
      setUploadingWord(null);
    }
  };

  // Auto-stop at the same limit main-frame enforces, so this never hits
  // that rejection in normal use — see MAX_RECORDING_MS above.
  useEffect(() => {
    if (recorderState.isRecording && recorderState.durationMillis >= MAX_RECORDING_MS) {
      stopAndUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorderState.isRecording, recorderState.durationMillis]);

  const startRecording = async (word: string) => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    player.pause();
    setPlayingWord(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordingWord(word);
  };

  const togglePlay = (word: string) => {
    const uri = getLocalRecordingUri(word);
    if (!uri) return;
    const isThisOne = playingWord === word;
    if (isThisOne && playerStatus.playing) {
      player.pause();
      return;
    }
    if (!isThisOne) {
      player.replace(uri);
    }
    player.play();
    setPlayingWord(word);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" onBack={onExit} />
      <View style={styles.content}>
        <Text style={[styles.header, { color: colors.textMuted }]}>
          {side === 'one' ? languageOneLabel : languageTwoLabel} → {side === 'one' ? languageTwoLabel : languageOneLabel}
        </Text>

        <View style={styles.cardArea}>
          <SwipeableCard
            key={card.id}
            prompt={prompt}
            answer={answer}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onSwipe={handleSwipe}
          />
        </View>

        <View style={styles.audioRow}>
          <WordAudioControl
            word={prompt}
            state={audioStateFor(prompt, { recordingWord, uploadingWord, playingWord, playing: playerStatus.playing })}
            durationMillis={recorderState.durationMillis}
            localVersion={localVersion}
            onRecord={() => startRecording(prompt)}
            onStop={stopAndUpload}
            onPlay={() => togglePlay(prompt)}
          />
          {revealed && (
            <WordAudioControl
              word={answer}
              state={audioStateFor(answer, { recordingWord, uploadingWord, playingWord, playing: playerStatus.playing })}
              durationMillis={recorderState.durationMillis}
              localVersion={localVersion}
              onRecord={() => startRecording(answer)}
              onStop={stopAndUpload}
              onPlay={() => togglePlay(answer)}
            />
          )}
        </View>

        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {card.languageEng ? `${card.languageEng} · ` : ''}
          card {(index % cards.length) + 1} of {cards.length} · completed {card.timesCompleted}×
        </Text>
      </View>
    </View>
  );
}

type AudioState = 'recording' | 'uploading' | 'playing' | 'has-recording' | 'no-recording';

function audioStateFor(
  word: string,
  args: { recordingWord: string | null; uploadingWord: string | null; playingWord: string | null; playing: boolean }
): AudioState {
  if (args.recordingWord === word) return 'recording';
  if (args.uploadingWord === word) return 'uploading';
  if (args.playingWord === word && args.playing) return 'playing';
  // Resolved by the caller checking the filesystem — see WordAudioControl.
  return 'no-recording';
}

function WordAudioControl({
  word,
  state,
  durationMillis,
  localVersion,
  onRecord,
  onStop,
  onPlay,
}: {
  word: string;
  state: AudioState;
  durationMillis: number;
  localVersion: number;
  onRecord: () => void;
  onStop: () => void;
  onPlay: () => void;
}) {
  const { colors } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hasLocal = useMemo(() => getLocalRecordingUri(word) !== null, [word, localVersion]);

  if (state === 'uploading') {
    return (
      <View style={styles.audioButton}>
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    );
  }

  if (state === 'recording') {
    return (
      <Pressable style={[styles.audioButton, styles.audioButtonRow]} onPress={onStop} hitSlop={12}>
        <StopIcon size={16} color={colors.text} />
        <Text style={[styles.audioTimer, { color: colors.textMuted }]}>{Math.floor(durationMillis / 1000)}s</Text>
      </Pressable>
    );
  }

  if (hasLocal) {
    return (
      <Pressable style={styles.audioButton} onPress={onPlay} hitSlop={12}>
        {state === 'playing' ? <PauseIcon size={18} color={colors.accent} /> : <PlayIcon size={18} color={colors.accent} />}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.audioButton} onPress={onRecord} hitSlop={12}>
      <MicIcon size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardArea: {
    width: '100%',
    alignItems: 'center',
  },
  audioRow: {
    flexDirection: 'row',
    gap: 24,
  },
  audioButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonRow: {
    flexDirection: 'row',
    gap: 6,
    width: 'auto',
    paddingHorizontal: 8,
  },
  audioTimer: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  progress: {
    fontSize: 14,
  },
});
