import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, firestore } from '@/services/firebase';

export default function CreateUsuarioScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Detección de PC
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.name) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;
      await setDoc(doc(firestore, 'users', uid), {
        name: form.name,
        email: form.email.toLowerCase(),
        role: form.role,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Éxito', 'Usuario creado correctamente', [
        { text: 'OK', onPress: () => router.replace('/usuarios') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, key: keyof typeof form, icon: any, placeholder: string, secure: boolean = false) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' }]}>
        <Ionicons name={icon} size={20} color="#1976D2" style={styles.icon} />
        <TextInput
          style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
          autoCapitalize={key === 'email' || key === 'password' ? 'none' : 'words'}
          secureTextEntry={secure}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Contenedor central para PC */}
        <View style={isDesktop ? styles.desktopWrapper : { flex: 1 }}>
            
            <View style={styles.header}>
            <Pressable onPress={() => router.replace('/usuarios')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
            <View>
                <ThemedText type="title">Nuevo Usuario</ThemedText>
                <ThemedText style={styles.subtitle}>Crea una cuenta de acceso</ThemedText>
            </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={isDesktop ? styles.gridRow : null}>
                <View style={isDesktop ? styles.gridCol : null}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Datos Personales</ThemedText>
                    {renderInput('Nombre Completo', 'name', 'person-outline', 'Ej. Juan Pérez')}
                    {renderInput('Correo Electrónico', 'email', 'mail-outline', 'ejemplo@correo.com')}
                </View>

                {isDesktop && <View style={{ width: 30 }} />}

                <View style={isDesktop ? styles.gridCol : null}>
                    <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, !isDesktop && { marginTop: 10 }]}>Seguridad</ThemedText>
                    {renderInput('Contraseña', 'password', 'lock-closed-outline', 'Mínimo 6 caracteres', true)}
                    {renderInput('Confirmar Contraseña', 'confirmPassword', 'shield-checkmark-outline', 'Repite la contraseña', true)}
                </View>
            </View>

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { marginTop: 10 }]}>Nivel de Acceso</ThemedText>
            <View style={[styles.roleSelector, isDesktop && { maxWidth: 500 }]}>
                <Pressable style={[styles.roleOption, form.role === 'user' && styles.roleActive]} onPress={() => setForm({...form, role: 'user'})}>
                <Ionicons name="person" size={18} color={form.role === 'user' ? '#FFF' : '#1976D2'} />
                <ThemedText style={[styles.roleText, form.role === 'user' && { color: '#FFF' }]}>Usuario</ThemedText>
                </Pressable>
                
                <Pressable style={[styles.roleOption, form.role === 'admin' && styles.roleActiveAdmin]} onPress={() => setForm({...form, role: 'admin'})}>
                <Ionicons name="shield-half" size={18} color={form.role === 'admin' ? '#FFF' : '#1976D2'} />
                <ThemedText style={[styles.roleText, form.role === 'admin' && { color: '#FFF' }]}>Admin</ThemedText>
                </Pressable>
            </View>

            <Pressable style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }, isDesktop && styles.submitButtonDesktop]} onPress={handleCreate} disabled={loading}>
                <ThemedText style={styles.submitText}>{loading ? 'Creando...' : 'Registrar Usuario'}</ThemedText>
            </Pressable>
            </ScrollView>
        </View>

      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopWrapper: { maxWidth: 900, alignSelf: 'center', width: '100%', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
  subtitle: { fontSize: 13, opacity: 0.5 },
  backButton: { marginRight: 15 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, marginBottom: 12, color: '#1976D2', fontWeight: 'bold' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, opacity: 0.7 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  gridRow: { flexDirection: 'row' },
  gridCol: { flex: 1 },
  roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1976D2', gap: 8 },
  roleActive: { backgroundColor: '#1976D2' },
  roleActiveAdmin: { backgroundColor: '#0D47A1', borderColor: '#0D47A1' },
  roleText: { fontSize: 14, fontWeight: 'bold', color: '#1976D2' },
  submitButton: { backgroundColor: '#1976D2', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 3 },
  submitButtonDesktop: { maxWidth: 300, alignSelf: 'center', width: '100%' },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});