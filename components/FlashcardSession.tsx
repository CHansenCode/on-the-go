import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/theme';
import type { Card } from '../data/flashcards';
import ScreenHeader from './ScreenHeader';
import SwipeableCard from './SwipeableCard';

// Which language is shown as the prompt for a freshly-drawn card. Picked
// once per card draw so both directions get practiced.
function randomSide(): 'one' | 'two' {
  return Math.random() < 0.5 ? 'one' : 'two';
}

type Props = {
  cards: Card[];
  languageOneLabel: string;
  languageTwoLabel: string;
  onExit: () => void;
};

export default function FlashcardSession({ cards: initial, languageOneLabel, languageTwoLabel, onExit }: Props) {
  const { colors } = useTheme();

  // In-memory only — this resets on every reload. There's no db yet, and
  // no logic yet for how often a card comes up or when it gets archived;
  // for now every card in the deck is equally likely, in a fixed order.
  const [cards, setCards] = useState<Card[]>(initial);
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

        <Text style={[styles.progress, { color: colors.textMuted }]}>
          {card.name} · card {(index % cards.length) + 1} of {cards.length} · completed {card.timesCompleted}×
        </Text>
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
  progress: {
    fontSize: 14,
  },
});
