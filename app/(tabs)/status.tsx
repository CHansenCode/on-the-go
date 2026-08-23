import { StyleSheet, Text, View } from 'react-native';

export default function StatusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Status</Text>
      <Text style={styles.subtitle}>
        Nothing tracked here yet — tell Claude what you'd like this tab to
        show.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});
