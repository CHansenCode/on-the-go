import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Directory } from 'expo-file-system';

import { createFolder, listFolders } from '../../../lib/poems';

export default function PoemsFolderListScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.newFolderRow}>
        <TextInput
          style={styles.input}
          placeholder="New folder name"
          value={newFolderName}
          onChangeText={setNewFolderName}
          onSubmitEditing={handleCreateFolder}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleCreateFolder}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(folder) => folder.uri}
        contentContainerStyle={folders.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>No folders yet — create one above.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.folderRow}
            onPress={() => router.push(`/poems/${encodeURIComponent(item.name)}`)}
          >
            <Text style={styles.folderName}>📁 {item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  newFolderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  folderRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  folderName: { fontSize: 18, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});
