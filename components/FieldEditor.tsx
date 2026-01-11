import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View, useColorScheme } from 'react-native';

export default function FieldEditor({
  visible,
  onClose,
  onSave,
  fieldName,
  currentValue,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  fieldName: string;
  currentValue: string;
}) {
  const [value, setValue] = useState(currentValue);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Actualiza el valor si cambia currentValue
  useEffect(() => setValue(currentValue), [currentValue]);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#fff',
              borderColor: isDark ? '#444' : '#ccc',
            },
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{ marginBottom: 10, color: isDark ? '#fff' : '#000' }}
          >
            Cambiar {fieldName}
          </ThemedText>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={`Nuevo ${fieldName}`}
            placeholderTextColor={isDark ? '#aaa' : '#666'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderColor: isDark ? '#555' : '#888',
                color: isDark ? '#fff' : '#000',
              },
            ]}
            autoCapitalize="none"
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: isDark ? '#555' : '#E0E0E0' }]}
              onPress={onClose}
            >
              <ThemedText style={{ color: isDark ? '#fff' : '#000' }}>Cancelar</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: '#6750A4' }]}
              onPress={() => {
                onSave(value);
                onClose();
              }}
            >
              <ThemedText style={{ color: '#fff' }}>Guardar</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
});
