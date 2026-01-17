import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, firestore } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
        } catch (error) {
          console.error("Error al obtener rol:", error);
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Función para renderizar los items del Sidebar de PC
  const SidebarItem = ({ name, label, icon, adminOnly = false }: any) => {
    if (adminOnly && role !== 'admin') return null;
    
    // Mejoramos la detección de ruta activa para carpetas
    // Si estamos en /prestamos/bitacora, el botón /prestamos debe seguir activo
    const isActive = pathname === name || (name !== '/' && pathname.startsWith(name));
    const activeColor = '#1976D2';
    const inactiveColor = isDark ? '#888' : '#666';

    return (
      <Pressable 
        onPress={() => router.push(name)}
        style={[styles.sidebarItem, isActive && { backgroundColor: isDark ? '#1E1E1E' : '#E3F2FD' }]}
      >
        <Ionicons 
          name={isActive ? icon : `${icon}-outline` as any} 
          size={22} 
          color={isActive ? activeColor : inactiveColor} 
        />
        <ThemedText style={[styles.sidebarLabel, { color: isActive ? activeColor : inactiveColor }]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', backgroundColor: isDark ? '#000' : '#F8F9FA' }}>
      
      {/* SIDEBAR PARA PC */}
      {isDesktop && (
        <View style={[styles.sidebar, { backgroundColor: isDark ? '#121212' : '#FFF', borderRightColor: isDark ? '#333' : '#EEE' }]}>
          <View style={styles.logoContainer}>
            <Ionicons name="cube" size={28} color="#1976D2" />
            <ThemedText type="defaultSemiBold" style={{ color: '#1976D2', fontSize: 18, marginLeft: 10 }}>SISTEMA</ThemedText>
          </View>
          
          <SidebarItem name="/" label="Inicio" icon="home" />
          <SidebarItem name="/prestamos" label="Vales de Préstamo" icon="ticket" />
          <SidebarItem name="/usuarios" label="Gestión Usuarios" icon="people" adminOnly />
        </View>
      )}

      {/* CONTENIDO PRINCIPAL (TABS) */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1976D2',
            tabBarInactiveTintColor: isDark ? '#888' : '#666',
            
            tabBarStyle: {
              display: isDesktop ? 'none' : 'flex',
              backgroundColor: isDark ? '#121212' : '#FFFFFF',
              borderTopColor: isDark ? '#333' : '#E0E0E0',
              height: Platform.OS === 'ios' ? 88 : 65,
              paddingBottom: Platform.OS === 'ios' ? 30 : 10,
              elevation: 10,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          {/* DASHBOARD PRINCIPAL */}
          <Tabs.Screen 
            name="index" 
            options={{ 
              title: 'Inicio', 
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} /> 
            }} 
          />

          {/* GRUPO PRESTAMOS - Usamos el index dentro de la carpeta */}
          <Tabs.Screen 
            name="prestamos/index" 
            options={{ 
              title: 'Vales', 
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "ticket" : "ticket-outline"} size={24} color={color} /> 
            }} 
          />
          
          {/* Rutas ocultas de préstamos para que mantengan el Layout */}
          <Tabs.Screen name="prestamos/bitacora" options={{ href: null }} />
          <Tabs.Screen name="prestamos/create" options={{ href: null }} />
          <Tabs.Screen name="prestamos/info" options={{ href: null }} />
          <Tabs.Screen name="prestamos/update" options={{ href: null }} />

          {/* GRUPO USUARIOS */}
          <Tabs.Screen 
            name="usuarios/index" 
            options={{ 
              title: 'Usuarios', 
              href: role === 'admin' ? '/usuarios' : null,
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} /> 
            }} 
          />
          <Tabs.Screen name="usuarios/create" options={{ href: null }} />
          <Tabs.Screen 
            name="perfil" 
            options={{ 
              title: 'Perfil', 
              tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color} /> 
            }} 
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  sidebarLabel: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: '600',
  },
});