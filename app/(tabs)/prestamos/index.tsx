import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, firestore } from '@/services/firebase';

interface Prestamo {
  id?: string;
  numeroFormulario: string;
  nombrePaciente: string;
  codigo: string;
  areaOrigen: string;
  areaDestino: string;
}

export default function ListaValesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const numColumns = isDesktop ? (width > 1200 ? 3 : 2) : 1;

  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [filteredPrestamos, setFilteredPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === 'admin');
          }
        } catch (e) {
          console.error("Error verificando rol:", e);
        }
      }
    };

    checkAdminStatus();

    const q = query(collection(firestore, 'prestamos'), orderBy('numeroFormulario', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Prestamo[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...(docSnap.data() as Prestamo) });
      });
      setPrestamos(data);
      setFilteredPrestamos(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // CORRECCIÓN AQUÍ: Función compatible con PC y Móvil
  const confirmDelete = (id: string, numero: string) => {
    const mensaje = `¿Estás seguro de eliminar el vale #${numero}?`;

    if (Platform.OS === 'web') {
      // Lógica para Navegador de PC
      const confirmado = window.confirm(mensaje);
      if (confirmado) {
        ejecutarEliminacion(id);
      }
    } else {
      // Lógica para Aplicación Móvil
      Alert.alert(
        "Eliminar Vale",
        mensaje,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Eliminar", 
            style: "destructive", 
            onPress: () => ejecutarEliminacion(id)
          }
        ]
      );
    }
  };

  // Función auxiliar para no repetir código de Firebase
  const ejecutarEliminacion = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'prestamos', id));
      if (Platform.OS === 'web') alert("Registro eliminado con éxito");
    } catch (e) {
      const errorMsg = "No se pudo eliminar el registro";
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert("Error", errorMsg);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = prestamos.filter((item) => 
      `${item.nombrePaciente} ${item.codigo} ${item.numeroFormulario}`.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredPrestamos(filtered);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View>
          <ThemedText type="title">Vales de Préstamo</ThemedText>
          <ThemedText style={styles.subtitle}>{filteredPrestamos.length} registros encontrados</ThemedText>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isDesktop && isAdmin && (
            <Pressable 
              onPress={() => router.push('/prestamos/bitacora')} 
              style={styles.desktopActionBtn}
            >
              <Ionicons name="bar-chart-outline" size={26} color="#1976D2" />
              <ThemedText style={styles.btnLabelDesktop}>Bitácora</ThemedText>
            </Pressable>
          )}
          <View style={[isDesktop && styles.desktopActionBtn]}>
            <Ionicons name="receipt-outline" size={28} color="#1976D2" />
          </View>
        </View>
      </View>
      
      <View style={[
        styles.searchContainer, 
        { backgroundColor: isDark ? '#222' : '#F0F0F0' },
        isDesktop && styles.searchContainerDesktop
      ]}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchBar, { color: isDark ? '#FFF' : '#000' }]}
          placeholder="Buscar por paciente, código o folio..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredPrestamos}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: 100 },
            isDesktop && styles.listContentDesktop
          ]}
          renderItem={({ item }) => (
            <View style={[
              styles.card, 
              { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: isDark ? '#333' : '#E0E0E0' },
              isDesktop && styles.cardDesktop
            ]}>
              <Pressable 
                onPress={() => router.push({ pathname: "/prestamos/info", params: { id: item.id } })}
                style={{ flex: 1 }}
              >
                <View style={styles.cardHeader}>
                   <ThemedText type="defaultSemiBold" style={styles.formNumber}>Folio #{item.numeroFormulario}</ThemedText>
                   <View style={[styles.codeBadge, { backgroundColor: isDark ? '#0D47A1' : '#E3F2FD' }]}>
                      <ThemedText style={styles.codeText}>{item.codigo}</ThemedText>
                   </View>
                </View>
                <ThemedText type="subtitle" style={styles.patientName} numberOfLines={1}>{item.nombrePaciente}</ThemedText>
                <View style={styles.routeRow}>
                  <Ionicons name="location-outline" size={14} color="#1976D2" />
                  <ThemedText style={styles.routeText} numberOfLines={1}>{item.areaOrigen} ➔ {item.areaDestino}</ThemedText>
                </View>
              </Pressable>

              {isAdmin && (
                <View style={styles.actionColumn}>
                  <Pressable 
                    onPress={() => router.push({ pathname: "/prestamos/update", params: { id: item.id } })}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={22} color="#1976D2" />
                  </Pressable>
                  <Pressable 
                    onPress={() => confirmDelete(item.id!, item.numeroFormulario)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={22} color="#FF5252" />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}

      {!isDesktop && isAdmin && (
        <Pressable 
          style={[styles.fab, styles.fabLeft, { bottom: insets.bottom + 20, backgroundColor: isDark ? '#333' : '#FFF' }]} 
          onPress={() => router.push('/prestamos/bitacora')}
        >
          <Ionicons name="bar-chart-outline" size={26} color="#1976D2" />
        </Pressable>
      )}

      <Pressable 
        style={[styles.fab, { bottom: insets.bottom + 20 }, isDesktop && styles.fabDesktop]} 
        onPress={() => router.push('/prestamos/create')}
      >
        <Ionicons name="add" size={30} color="white" />
        {isDesktop && <ThemedText style={styles.fabLabel}>Nuevo Vale</ThemedText>}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  headerDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 16 },
  desktopActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 118, 210, 0.05)', padding: 10, borderRadius: 12, marginRight: 15 },
  btnLabelDesktop: { marginLeft: 8, color: '#1976D2', fontWeight: 'bold' },
  subtitle: { fontSize: 13, opacity: 0.5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, borderRadius: 12, marginBottom: 16, height: 48 },
  searchContainerDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  searchBar: { flex: 1, height: '100%', fontSize: 15 },
  listContent: { paddingHorizontal: 16 },
  listContentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  card: { 
    flexDirection: 'row',
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardDesktop: {
    flex: 1,
    margin: 8, 
    minWidth: 350,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  formNumber: { color: '#1976D2', fontSize: 14, fontWeight: 'bold' },
  codeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  codeText: { color: '#1976D2', fontSize: 11, fontWeight: 'bold' },
  patientName: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeText: { fontSize: 12, opacity: 0.7 },
  actionColumn: { justifyContent: 'space-around', marginLeft: 12, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' },
  actionButton: { padding: 8 },
  fab: { 
    position: 'absolute', 
    right: 20, 
    backgroundColor: '#1976D2', 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabLeft: {
    right: 'auto',
    left: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  fabDesktop: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 20,
    borderRadius: 15,
    height: 55,
  },
  fabLabel: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});