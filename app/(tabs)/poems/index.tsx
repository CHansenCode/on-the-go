import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Directory } from 'expo-file-system';

import { createFolder, listFolders } from '../../../lib/poems';
import { useTheme } from '../../../lib/theme';

export default function PoemsFolderListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [folders, setFolders] = useState<Directory[]>([]);
  const [newFolderName, setNewFolderName] = useState('');

  const refresh = useCallback(() => {
    setFolders(listFolders());
  }, []);

  useFocusEffect(refresh);

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name);
    setNewFolderName('');
    refresh();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.newFolderRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="New folder name"
          placeholderTextColor={colors.textMuted}
          value={newFolderName}
          onChangeText={setNewFolderName}
          onSubmitEditing={handleCreateFolder}
          returnKeyType="done"
        />
        <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={handleCreateFolder}>
          <Ionicons name="add" size={24} color={colors.onAccent} />
        </Pressable>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(folder) => folder.uri}
        contentContainerStyle={folders.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No folders yet — create one above.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.folderRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/poems/${encodeURIComponent(item.name)}`)}
          >
            <Ionicons name="folder-outline" size={22} color={colors.accent} />
            <Text style={[styles.folderName, { color: colors.text }]}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  newFolderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  folderName: { fontSize: 18, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15 },
});
