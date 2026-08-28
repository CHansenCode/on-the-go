import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import FlashcardSession, { type SessionCard } from '../../components/FlashcardSession';
import ScreenHeader from '../../components/ScreenHeader';
import { CURRENT_DECK, fetchDeckCards } from '../../lib/learningApi';
import { syncRecordings } from '../../lib/wordRecordings';
import { useTheme } from '../../lib/theme';

const COUNT_STEP = 10;
const DEFAULT_COUNT = 50;

// Only one deck exists today (see CURRENT_DECK) — shown as a single-item
// list so this screen doesn't need reshaping once a "list decks" endpoint
// exists and there's more than one to choose from.
const GROUPS = [CURRENT_DECK.name];

type Phase =
  | { kind: 'category' }
  | { kind: 'count'; available: number }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'session'; cards: SessionCard[] };

export default function LearningScreen() {
  const [phase, setPhase] = useState<Phase>({ kind: 'category' });

  const loadCount = async () => {
    setPhase({ kind: 'loading' });
    try {
      const all = await fetchDeckCards(CURRENT_DECK.id);
      setPhase({ kind: 'count', available: all.length });
    } catch (err) {
      setPhase({ kind: 'error', message: (err as Error).message });
    }
  };

  const start = async (count: number) => {
    setPhase({ kind: 'loading' });
    try {
      const sampled = await fetchDeckCards(CURRENT_DECK.id, count);
      await syncRecordings(sampled);
      setPhase({ kind: 'session', cards: sampled.map((c) => ({ ...c, timesCompleted: 0 })) });
    } catch (err) {
      setPhase({ kind: 'error', message: (err as Error).message });
    }
  };

  if (phase.kind === 'session') {
    return (
      <FlashcardSession
        key={phase.cards.map((c) => c.id).join(',')}
        cards={phase.cards}
        languageOneLabel={CURRENT_DECK.languageOneLabel}
        languageTwoLabel={CURRENT_DECK.languageTwoLabel}
        onExit={() => setPhase({ kind: 'category' })}
      />
    );
  }

  if (phase.kind === 'loading') {
    return <LoadingStep />;
  }

  if (phase.kind === 'error') {
    return <ErrorStep message={phase.message} onRetry={() => setPhase({ kind: 'category' })} />;
  }

  if (phase.kind === 'count') {
    return (
      <CountStep
        group={CURRENT_DECK.name}
        available={phase.available}
        onBack={() => setPhase({ kind: 'category' })}
        onStart={start}
      />
    );
  }

  return <CategoryStep onSelect={loadCount} />;
}

function CategoryStep({ onSelect }: { onSelect: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Choose a category</Text>
        <View style={styles.optionList}>
          {GROUPS.map((g) => (
            <Pressable
              key={g}
              style={[styles.optionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onSelect}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function LoadingStep() {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    </View>
  );
}

function ErrorStep({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Couldn't load the deck</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{message}</Text>
        <Pressable style={[styles.startButton, { backgroundColor: colors.accent }]} onPress={onRetry}>
          <Text style={[styles.startButtonText, { color: colors.onAccent }]}>Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CountStep({
  group,
  available,
  onBack,
  onStart,
}: {
  group: string;
  available: number;
  onBack: () => void;
  onStart: (count: number) => void;
}) {
  const { colors } = useTheme();
  const min = Math.min(COUNT_STEP, available);
  const max = available;
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const [count, setCount] = useState(() => clamp(DEFAULT_COUNT));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" onBack={onBack} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>How many words?</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{group}</Text>

        <View style={styles.counterRow}>
          <Pressable
            style={[styles.counterButton, { borderColor: colors.border }]}
            onPress={() => setCount((c) => clamp(c - COUNT_STEP))}
            disabled={count <= min}
          >
            <Text style={[styles.counterButtonText, { color: count <= min ? colors.textMuted : colors.text }]}>
              −10
            </Text>
          </Pressable>

          <Text style={[styles.countValue, { color: colors.text }]}>{count}</Text>

          <Pressable
            style={[styles.counterButton, { borderColor: colors.border }]}
            onPress={() => setCount((c) => clamp(c + COUNT_STEP))}
            disabled={count >= max}
          >
            <Text style={[styles.counterButtonText, { color: count >= max ? colors.textMuted : colors.text }]}>
              +10
            </Text>
          </Pressable>
        </View>

        <Pressable style={[styles.startButton, { backgroundColor: colors.accent }]} onPress={() => onStart(count)}>
          <Text style={[styles.startButtonText, { color: colors.onAccent }]}>Start</Text>
        </Pressable>
      </View>
    </View>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
  },
  optionList: {
    width: '100%',
    gap: 12,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  counterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countValue: {
    fontSize: 36,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
