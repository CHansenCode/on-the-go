import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import SwipeableCard from '../../components/SwipeableCard';
import { Card, initialCards, languageOneLabel, languageTwoLabel } from '../../data/flashcards';

// Which language is shown as the prompt for a freshly-drawn card. Picked
// once per card draw so both directions get practiced.
function randomSide(): 'one' | 'two' {
  return Math.random() < 0.5 ? 'one' : 'two';
}

export default function LearningScreen() {
  // In-memory only — this resets on every reload. There's no db yet, and
  // no logic yet for how often a card comes up or when it gets archived;
  // for now every card is equally likely, in a fixed order.
  const [cards, setCards] = useState<Card[]>(initialCards);
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
              lastCompleted: correct ? new Date().toISOString() : c.lastCompleted,
            }
          : c
      )
    );
    advance();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
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

      <Text style={styles.progress}>
        {card.name} · completed {card.timesCompleted}×
      </Text>

      {revealed && (
        <View style={styles.buttonRow}>
          <Pressable style={[styles.button, styles.incorrectButton]} onPress={() => handleSwipe('left')}>
            <Text style={styles.buttonText}>✗ Incorrect</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.correctButton]} onPress={() => handleSwipe('right')}>
            <Text style={styles.buttonText}>✓ Correct</Text>
          </Pressable>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardArea: {
    width: '100%',
    alignItems: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#999',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  incorrectButton: {
    backgroundColor: '#fde2e2',
  },
  correctButton: {
    backgroundColor: '#ddf3e4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
