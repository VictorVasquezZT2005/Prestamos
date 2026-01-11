import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { login } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#fff' : '#000';
  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const borderColor = isDark ? '#333' : '#E0E0E0';

  const onLogin = async () => {
    if (!email || !password) {
      alert('Por favor, completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const screenWidth = Math.min(Dimensions.get('window').width, 400);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { width: screenWidth }]}>
            
            {/* Logo o Icono Central */}
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="medical" size={40} color="white" />
              </View>
              <ThemedText type="title" style={styles.title}>Vales de Préstamo</ThemedText>
              {/* Nombre actualizado aquí */}
              <ThemedText style={styles.subtitle}>Hospital Profamilia</ThemedText>
            </View>

            <View style={styles.form}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Correo Electrónico</ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                <Ionicons name="mail-outline" size={20} color="#1976D2" style={styles.inputIcon} />
                <TextInput
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { color: textColor }]}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <ThemedText type="defaultSemiBold" style={styles.label}>Contraseña</ThemedText>
              <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#1976D2" style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { color: textColor }]}
                  returnKeyType="go"
                  onSubmitEditing={onLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#888" 
                  />
                </Pressable>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  { opacity: loading || pressed ? 0.8 : 1 }
                ]}
                onPress={onLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
                )}
              </Pressable>
            </View>
            
            <ThemedText style={styles.footerText}>© 2026 Hospital Profamilia</ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18, // Ligeramente más grande para que el nombre del hospital resalte
    opacity: 0.7,
    fontWeight: '600',
    color: '#1976D2', // Azul para combinar con el logo
    marginTop: 4,
  },
  form: {
    width: '100%',
    gap: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: -5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  button: {
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: '#1976D2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 50,
    fontSize: 12,
    opacity: 0.4,
  }
});