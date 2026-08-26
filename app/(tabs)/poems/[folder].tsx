import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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

import { MicIcon, PauseIcon, PlayIcon, ShareIcon, StopIcon, TrashIcon } from '../../../components/icons';
import ScreenHeader from '../../../components/ScreenHeader';
import {
  deleteRecording,
  getFolder,
  listRecordings,
  markRecordingShared,
  markRecordingUnshared,
  saveRecording,
  type Recording,
} from '../../../lib/poems';
import { shareRecording, unshareRecording } from '../../../lib/server';
import { useTheme } from '../../../lib/theme';

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(date: Date | null) {
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function FolderScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { folder: folderParam } = useLocalSearchParams<{ folder: string }>();
  const folderName = decodeURIComponent(folderParam ?? '');
  const folder = getFolder(folderName);

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sharingUris, setSharingUris] = useState<Set<string>>(new Set());
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  // One shared player for the whole list — tapping a row loads that
  // recording into it and plays; tapping the one already playing pauses it.
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [playingUri, setPlayingUri] = useState<string | null>(null);

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      setPlayingUri(null);
    }
  }, [playerStatus.didJustFinish]);

  const togglePlay = (recording: Recording) => {
    const isThisOne = playingUri === recording.file.uri;
    if (isThisOne && playerStatus.playing) {
      player.pause();
      return;
    }
    if (!isThisOne) {
      player.replace(recording.file.uri);
    }
    player.play();
    setPlayingUri(recording.file.uri);
  };

  const refresh = useCallback(() => {
    setRecordings(listRecordings(folder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderName]);

  useFocusEffect(refresh);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  const startRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return;
    player.pause();
    setPlayingUri(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    if (recorder.uri) {
      setNameInput('');
      setPendingUri(recorder.uri);
    }
  };

  const confirmSave = async () => {
    if (!pendingUri) return;
    await saveRecording(folder, nameInput || 'Untitled', pendingUri);
    setPendingUri(null);
    setNameInput('');
    refresh();
  };

  const discardRecording = () => {
    if (pendingUri) {
      new File(pendingUri).delete();
    }
    setPendingUri(null);
    setNameInput('');
  };

  const replaceRecording = (updated: Recording) => {
    setRecordings((prev) => prev.map((r) => (r.file.uri === updated.file.uri ? updated : r)));
  };

  const handleToggleShare = async (recording: Recording) => {
    const uri = recording.file.uri;
    setSharingUris((prev) => new Set(prev).add(uri));
    try {
      if (recording.shared) {
        if (recording.remoteId) {
          await unshareRecording(recording.remoteId);
        }
        replaceRecording(markRecordingUnshared(recording));
      } else {
        const base64 = await recording.file.base64();
        const remoteId = await shareRecording({
          name: recording.name,
          directory: [folderName],
          soundFileBase64: base64,
        });
        replaceRecording(markRecordingShared(recording, remoteId));
      }
    } catch (err) {
      Alert.alert(recording.shared ? 'Could not unshare' : 'Could not share', (err as Error).message);
    } finally {
      setSharingUris((prev) => {
        const next = new Set(prev);
        next.delete(uri);
        return next;
      });
    }
  };

  const handleDeleteRecording = (recording: Recording) => {
    Alert.alert(`Delete "${recording.name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (recording.shared && recording.remoteId) {
            // Best effort — the local delete proceeds either way.
            unshareRecording(recording.remoteId).catch(() => {});
          }
          if (playingUri === recording.file.uri) {
            player.pause();
            setPlayingUri(null);
          }
          deleteRecording(recording);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={folderName} onBack={() => router.back()} />

      <FlatList
        style={styles.list}
        data={recordings}
        keyExtractor={(item) => item.file.uri}
        contentContainerStyle={recordings.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No poems recorded here yet.</Text>
        }
        renderItem={({ item }) => {
          const isPlaying = playingUri === item.file.uri && playerStatus.playing;
          const isBusy = sharingUris.has(item.file.uri);
          return (
            <View style={[styles.recordingRow, { borderBottomColor: colors.border }]}>
              <Pressable style={styles.recordingMain} onPress={() => togglePlay(item)}>
                {isPlaying ? (
                  <PauseIcon size={22} color={colors.accent} />
                ) : (
                  <PlayIcon size={22} color={colors.accent} />
                )}
                <Text
                  style={[styles.recordingName, { color: item.shared ? colors.accent : colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.recordingDate, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
              </Pressable>

              <Pressable onPress={() => handleToggleShare(item)} disabled={isBusy} hitSlop={12}>
                <ShareIcon size={20} color={item.shared ? colors.accent : colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => handleDeleteRecording(item)} hitSlop={12}>
                <TrashIcon size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          );
        }}
      />

      <View style={[styles.recordArea, { borderTopColor: colors.border }]}>
        {recorderState.isRecording && (
          <Text style={[styles.timer, { color: colors.textMuted }]}>
            {formatDuration(recorderState.durationMillis)}
          </Text>
        )}
        <Pressable
          style={[
            styles.recordButton,
            { backgroundColor: recorderState.isRecording ? colors.text : colors.accent },
          ]}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
        >
          {recorderState.isRecording ? (
            <StopIcon size={26} color={colors.background} />
          ) : (
            <MicIcon size={26} color={colors.onAccent} />
          )}
        </Pressable>
      </View>

      <Modal visible={pendingUri !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Name this poem</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Ode to Tuesday"
              placeholderTextColor={colors.textMuted}
              autoFocus
              onSubmitEditing={confirmSave}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={discardRecording}>
                <Text style={[styles.modalButtonText, { color: colors.textMuted }]}>Discard</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={confirmSave}
              >
                <Text style={[styles.modalButtonText, { color: colors.onAccent }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15 },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  recordingMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingName: { flex: 1, fontSize: 16, fontWeight: '600' },
  recordingDate: { fontSize: 13 },
  recordArea: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    gap: 8,
  },
  timer: { fontSize: 16, fontVariant: ['tabular-nums'] },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalButtonText: { fontSize: 15, fontWeight: '600' },
});
