import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Directory } from 'expo-file-system';

import { AddIcon, FolderIcon } from '../../../components/icons';
import ScreenHeader from '../../../components/ScreenHeader';
import { createFolder, listFolders } from '../../../lib/poems';
import { useTheme } from '../../../lib/theme';

export default function PoemsFolderListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [folders, setFolders] = useState<Directory[]>([]);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const refresh = useCallback(() => {
    setFolders(listFolders());
  }, []);

  useFocusEffect(refresh);

  const openCreate = () => {
    setNewFolderName('');
    setCreating(true);
  };

  const cancelCreate = () => {
    setCreating(false);
    setNewFolderName('');
  };

  const confirmCreate = () => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name);
    setCreating(false);
    setNewFolderName('');
    refresh();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Poems"
        right={
          <Pressable onPress={openCreate} hitSlop={12}>
            <AddIcon size={24} color={colors.accent} />
          </Pressable>
        }
      />

      <FlatList
        style={styles.list}
        data={folders}
        keyExtractor={(folder) => folder.uri}
        contentContainerStyle={folders.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No folders yet — tap + above to create one.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.folderRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push(`/poems/${encodeURIComponent(item.name)}`)}
          >
            <FolderIcon size={22} color={colors.accent} />
            <Text style={[styles.folderName, { color: colors.text }]}>{item.name}</Text>
          </Pressable>
        )}
      />

      <Modal visible={creating} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New folder</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g. Us"
              placeholderTextColor={colors.textMuted}
              autoFocus
              onSubmitEditing={confirmCreate}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={cancelCreate}>
                <Text style={[styles.modalButtonText, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={confirmCreate}
              >
                <Text style={[styles.modalButtonText, { color: colors.onAccent }]}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flex: 1, paddingHorizontal: 16 },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  folderName: { fontSize: 18, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
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
