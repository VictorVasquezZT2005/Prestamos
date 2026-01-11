import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, firestore } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface UserData {
  name?: string;
  email: string;
  role?: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  // Detección de PC
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      } catch (e: any) {
        console.log('Error fetching user data:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e: any) {
      console.error(e);
    }
  };

  const userInitials = userData?.name
    ? userData.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)
    : userData?.email?.substring(0, 2).toUpperCase() || 'U';

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: isDesktop ? 40 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}>
        
        {/* Header de Bienvenida */}
        <View style={[styles.welcomeSection, isDesktop && styles.welcomeSectionDesktop]}>
          <View style={[styles.avatar, { backgroundColor: '#1976D2' }]}>
            <ThemedText style={styles.avatarText}>{userInitials}</ThemedText>
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={styles.welcomeText}>
              Hola, {userData?.name || 'Usuario'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{userData?.email}</ThemedText>
          </View>
          
          {/* Botón Cerrar Sesión en PC con estilo de Android */}
          {isDesktop && (
            <Pressable 
              style={({ pressed }) => [styles.logoutButtonPC, pressed && { opacity: 0.8 }]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <ThemedText style={styles.logoutTextPC}>Cerrar Sesión</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Card de Rol */}
        <View style={[styles.profileCard, { 
          backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
          borderColor: isDark ? '#333' : '#E0E0E0',
          width: isDesktop ? '30%' : '100%'
        }]}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#1976D2" />
            <ThemedText style={styles.infoText}>Rol: </ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: userData?.role === 'admin' ? '#E3F2FD' : '#F3E5F5' }]}>
              <ThemedText style={[styles.roleText, { color: userData?.role === 'admin' ? '#1976D2' : '#6750A4' }]}>
                {userData?.role?.toUpperCase() || 'USER'}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Panel de Control</ThemedText>

        {/* CONTENEDOR DE ACCESOS (Grid en PC, Lista en Móvil) */}
        <View style={isDesktop ? styles.menuGridDesktop : styles.menuListMobile}>
          
          {/* Botón Ver Préstamos */}
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem, 
              isDesktop && styles.menuItemDesktop,
              { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: isDark ? '#333' : '#E0E0E0' }, 
              pressed && { opacity: 0.7 }
            ]}
            onPress={() => router.push('/(tabs)/prestamos')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="receipt" size={24} color="#1976D2" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">Vales de Préstamo</ThemedText>
              <ThemedText style={styles.menuDesc}>Gestionar y crear nuevos vales</ThemedText>
            </View>
            {!isDesktop && <Ionicons name="chevron-forward" size={20} color="#888" />}
          </Pressable>

          {/* Botón Gestión de Usuarios (Solo Admins) */}
          {userData?.role === 'admin' && (
            <Pressable 
              style={({ pressed }) => [
                styles.menuItem, 
                isDesktop && styles.menuItemDesktop,
                { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: isDark ? '#333' : '#E0E0E0' }, 
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => router.push('/usuarios')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="people" size={24} color="#6750A4" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">Gestión de Usuarios</ThemedText>
                <ThemedText style={styles.menuDesc}>Administrar accesos y roles</ThemedText>
              </View>
              {!isDesktop && <Ionicons name="chevron-forward" size={20} color="#888" />}
            </Pressable>
          )}
        </View>

        {/* Botón Cerrar Sesión (Solo móvil al final) */}
        {!isDesktop && (
          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#FFF" />
            <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
          </Pressable>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  desktopContent: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40 },
  
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
  },
  welcomeSectionDesktop: {
    marginBottom: 40,
    marginTop: 0,
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
    padding: 24,
    borderRadius: 20,
    justifyContent: 'space-between', // Para empujar el botón de logout a la derecha
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 13, opacity: 0.5, marginTop: 2 },
  
  profileCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, marginLeft: 8 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 5,
  },
  roleText: { fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, marginBottom: 15, marginLeft: 5 },
  
  // Grid para PC
  menuGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  menuListMobile: {
    flexDirection: 'column',
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  menuItemDesktop: {
    width: '48%', 
    marginBottom: 0,
    padding: 24,
  },
  
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuDesc: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  
  // Botón Logout General (Android/iOS)
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#B00020',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 10,
    elevation: 3,
  },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  // Botón Logout PC (Igual estilo que Android pero más compacto y arriba)
  logoutButtonPC: {
    flexDirection: 'row',
    backgroundColor: '#B00020',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutTextPC: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});