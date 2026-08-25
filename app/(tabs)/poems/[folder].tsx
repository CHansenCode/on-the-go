import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';

import { getFolder, listRecordings, saveRecording, type Recording } from '../../../lib/poems';

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
  const { folder: folderParam } = useLocalSearchParams<{ folder: string }>();
  const folderName = decodeURIComponent(folderParam ?? '');
  const folder = getFolder(folderName);

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: folderName }} />

      <FlatList
        style={styles.list}
        data={recordings}
        keyExtractor={(item) => item.file.uri}
        contentContainerStyle={recordings.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<Text style={styles.emptyText}>No poems recorded here yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.recordingRow}>
            <Text style={styles.recordingName}>🎙️ {item.name}</Text>
            <Text style={styles.recordingDate}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
      />

      <View style={styles.recordArea}>
        {recorderState.isRecording && (
          <Text style={styles.timer}>{formatDuration(recorderState.durationMillis)}</Text>
        )}
        <Pressable
          style={[styles.recordButton, recorderState.isRecording && styles.recordButtonActive]}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>{recorderState.isRecording ? '■' : '●'}</Text>
        </Pressable>
      </View>

      <Modal visible={pendingUri !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name this poem</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Ode to Tuesday"
              autoFocus
              onSubmitEditing={confirmSave}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={discardRecording}>
                <Text style={styles.modalButtonText}>Discard</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={confirmSave}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
  recordingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordingName: { fontSize: 16, fontWeight: '600' },
  recordingDate: { fontSize: 13, color: '#999' },
  recordArea: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  timer: { fontSize: 16, fontVariant: ['tabular-nums'], color: '#555' },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e5484d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#b3261e',
  },
  recordButtonText: { color: '#fff', fontSize: 28 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalButtonPrimary: { backgroundColor: '#2f6fed' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#555' },
  modalButtonTextPrimary: { color: '#fff' },
});
