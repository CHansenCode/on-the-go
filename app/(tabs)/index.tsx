import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import FlashcardSession from '../../components/FlashcardSession';
import ScreenHeader from '../../components/ScreenHeader';
import { initialCards, languageOneLabel, languageTwoLabel, listGroups } from '../../data/flashcards';
import { useTheme } from '../../lib/theme';

const COUNT_STEP = 10;
const DEFAULT_COUNT = 50;

type Selection = { group: string; count: number } | null;

export default function LearningScreen() {
  const [group, setGroup] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  if (selection) {
    const deck = initialCards.filter((c) => c.group === selection.group).slice(0, selection.count);
    return (
      <FlashcardSession
        key={`${selection.group}-${selection.count}`}
        cards={deck}
        languageOneLabel={languageOneLabel}
        languageTwoLabel={languageTwoLabel}
        onExit={() => {
          setSelection(null);
          setGroup(null);
        }}
      />
    );
  }

  if (group) {
    return (
      <CountStep
        group={group}
        onBack={() => setGroup(null)}
        onStart={(count) => setSelection({ group, count })}
      />
    );
  }

  return <CategoryStep onSelect={setGroup} />;
}

function CategoryStep({ onSelect }: { onSelect: (group: string) => void }) {
  const { colors } = useTheme();
  // select group from dummydata group by group
  const groups = listGroups(initialCards);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Learning" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Choose a category</Text>
        <View style={styles.optionList}>
          {groups.map((g) => (
            <Pressable
              key={g}
              style={[styles.optionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onSelect(g)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function CountStep({
  group,
  onBack,
  onStart,
}: {
  group: string;
  onBack: () => void;
  onStart: (count: number) => void;
}) {
  const { colors } = useTheme();
  const available = initialCards.filter((c) => c.group === group).length;
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
