import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/theme';

const SWIPE_THRESHOLD = 120;
const ROTATION_RANGE = 12; // degrees, at max drag

type Props = {
  prompt: string;
  answer: string;
  revealed: boolean;
  onReveal: () => void;
  onSwipe: (direction: 'left' | 'right') => void;
};

export default function SwipeableCard({ prompt, answer, revealed, onReveal, onSwipe }: Props) {
  const { colors } = useTheme();
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          flyOut('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          flyOut('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const flyOut = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? 500 : -500;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      onSwipe(direction);
    });
  };

  const rotate = position.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: [`-${ROTATION_RANGE}deg`, '0deg', `${ROTATION_RANGE}deg`],
  });

  const incorrectOpacity = position.x.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const correctOpacity = position.x.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      {...(revealed ? panResponder.panHandlers : {})}
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        {
          transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
        },
      ]}
    >
      {/* Incorrect stays monochrome (primary) rather than a fourth color —
          correct is the only thing that gets the accent treatment. */}
      <Animated.View style={[styles.badge, { borderColor: colors.text, opacity: incorrectOpacity }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>INCORRECT</Text>
      </Animated.View>
      <Animated.View style={[styles.badge, styles.correctBadge, { borderColor: colors.accent, opacity: correctOpacity }]}>
        <Text style={[styles.badgeText, { color: colors.accent }]}>CORRECT</Text>
      </Animated.View>

      <View style={styles.content} onTouchEnd={revealed ? undefined : onReveal}>
        <Text style={[styles.prompt, { color: colors.text }]}>{prompt}</Text>
        {revealed ? (
          <Text style={[styles.answer, { color: colors.accent }]}>{answer}</Text>
        ) : (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Tap to reveal</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 420,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  answer: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: 24,
    left: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  correctBadge: {
    left: undefined,
    right: 24,
    transform: [{ rotate: '15deg' }],
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
