import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { firestore } from '@/services/firebase';

export default function BitacoraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const numColumns = isDesktop ? (width > 1200 ? 3 : 2) : 1;

  const [loading, setLoading] = useState(true);
  const [todosLosVales, setTodosLosVales] = useState<any[]>([]);
  
  const [mesSel, setMesSel] = useState<number | null>(null);
  const [anioSel, setAnioSel] = useState<number | null>(null);
  const [usuarioSel, setUsuarioSel] = useState('Todos');

  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  useEffect(() => {
    fetchBitacora();
  }, []);

  const fetchBitacora = async () => {
    try {
      const q = query(collection(firestore, 'prestamos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodosLosVales(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const opcionesFiltros = useMemo(() => {
    const añosExistentes = new Set<number>();
    const mesesPorAnio: Record<number, Set<number>> = {};
    const usuariosExistentes = new Set<string>(['Todos']);

    todosLosVales.forEach(vale => {
      if (!vale.createdAt) return;
      const fecha = new Date(vale.createdAt);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      añosExistentes.add(año);
      if (!mesesPorAnio[año]) mesesPorAnio[año] = new Set();
      mesesPorAnio[año].add(mes);
      if (vale.nombreEntrega) usuariosExistentes.add(vale.nombreEntrega);
    });

    const listaAnios = Array.from(añosExistentes).sort((a, b) => b - a);
    if (anioSel === null && listaAnios.length > 0) setAnioSel(listaAnios[0]);

    const mesesDisponibles = anioSel !== null ? Array.from(mesesPorAnio[anioSel] || []).sort((a, b) => a - b) : [];
    if (mesSel === null && mesesDisponibles.length > 0) setMesSel(mesesDisponibles[mesesDisponibles.length - 1]);

    return { años: listaAnios, mesesDisponibles, usuarios: Array.from(usuariosExistentes) };
  }, [todosLosVales, anioSel, mesSel]);

  const valesFiltrados = useMemo(() => {
    return todosLosVales.filter(vale => {
      if (!vale.createdAt) return false;
      const fecha = new Date(vale.createdAt);
      return fecha.getFullYear() === anioSel && fecha.getMonth() === mesSel && 
             (usuarioSel === 'Todos' || vale.nombreEntrega === usuarioSel);
    });
  }, [todosLosVales, mesSel, anioSel, usuarioSel]);

  const dynamicStyles = {
    cardBg: isDark ? '#1E1E1E' : '#FFF',
    filterBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F0F4F8',
    btnBg: isDark ? '#333' : '#FFF',
    borderColor: isDark ? '#333' : '#E0E0E0',
    textMain: isDark ? '#FFF' : '#000'
  };

  const renderHeader = () => (
    <View style={isDesktop ? styles.desktopWrapper : null}>
      {/* Filtros */}
      <View style={[styles.filtersCard, { backgroundColor: dynamicStyles.filterBg, borderColor: dynamicStyles.borderColor }, isDesktop && styles.filtersCardDesktop]}>
        <View style={isDesktop ? styles.rowFiltersDesktop : null}>
          <View style={isDesktop ? { flex: 1 } : { marginBottom: 12 }}>
            <ThemedText style={styles.filterLabel}>Año</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {opcionesFiltros.años.map(a => (
                <Pressable key={a} onPress={() => { setAnioSel(a); setMesSel(null); }} style={[styles.miniBtn, { backgroundColor: dynamicStyles.btnBg, borderColor: dynamicStyles.borderColor }, anioSel === a && styles.miniBtnActive]}>
                  <ThemedText style={[styles.miniBtnText, anioSel === a && { color: '#FFF' }]}>{a}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={isDesktop ? { flex: 2, marginLeft: 15 } : { marginBottom: 12 }}>
            <ThemedText style={styles.filterLabel}>Mes</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {opcionesFiltros.mesesDisponibles.map(m => (
                <Pressable key={m} onPress={() => setMesSel(m)} style={[styles.miniBtn, { backgroundColor: dynamicStyles.btnBg, borderColor: dynamicStyles.borderColor }, mesSel === m && styles.miniBtnActive]}>
                  <ThemedText style={[styles.miniBtnText, mesSel === m && { color: '#FFF' }]}>{mesesNombres[m]}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <ThemedText style={styles.filterLabel}>Filtrar por Usuario</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {opcionesFiltros.usuarios.map(u => (
              <Pressable key={u} onPress={() => setUsuarioSel(u)} style={[styles.userFilterBtn, { backgroundColor: dynamicStyles.btnBg, borderColor: dynamicStyles.borderColor }, usuarioSel === u && styles.userFilterBtnActive]}>
                <ThemedText style={[styles.miniBtnText, usuarioSel === u && { color: '#FFF' }]}>{u}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        <View style={[styles.statCard, { backgroundColor: '#1976D2' }]}>
          <ThemedText style={styles.statNumber}>{valesFiltrados.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Vales</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#388E3C' }]}>
          <ThemedText style={styles.statNumber}>
            {valesFiltrados.reduce((acc, v) => acc + (v.insumos?.length || 0), 0)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Insumos</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header fuera de la FlatList para que sea idéntico a ListaVales */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.replace('/prestamos')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={dynamicStyles.textMain} />
          </Pressable>
          <View>
            <ThemedText type="title">Bitácora Maestro</ThemedText>
            <ThemedText style={styles.subtitle}>{valesFiltrados.length} registros en este periodo</ThemedText>
          </View>
        </View>
        <Ionicons name="bar-chart-outline" size={28} color="#1976D2" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={valesFiltrados}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
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
                      <ThemedText style={styles.codeText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'S/F'}</ThemedText>
                   </View>
                </View>
                <ThemedText type="subtitle" style={styles.patientName} numberOfLines={1}>📦 {item.nombrePaciente}</ThemedText>
                <View style={styles.routeRow}>
                  <Ionicons name="location-outline" size={14} color="#1976D2" />
                  <ThemedText style={styles.routeText} numberOfLines={1}>{item.areaOrigen} ➔ {item.areaDestino}</ThemedText>
                </View>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <ThemedText style={{ opacity: 0.5 }}>No hay registros en este periodo.</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopWrapper: { maxWidth: 1000, alignSelf: 'center', width: '100%' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginVertical: 15 
  },
  headerDesktop: { 
    maxWidth: 1000, 
    alignSelf: 'center', 
    width: '100%', 
    paddingHorizontal: 0 
  },
  subtitle: { fontSize: 13, opacity: 0.5 },
  backButton: { marginRight: 15 },
  
  filtersCard: { marginHorizontal: 20, padding: 16, borderRadius: 18, marginBottom: 16, borderWidth: 1, elevation: 2 },
  filtersCardDesktop: { marginHorizontal: 0 },
  filterLabel: { fontSize: 10, fontWeight: 'bold', opacity: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  rowFiltersDesktop: { flexDirection: 'row' },
  
  miniBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  miniBtnActive: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  miniBtnText: { fontSize: 12, fontWeight: '600' },
  
  userFilterBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginRight: 8, borderWidth: 1 },
  userFilterBtnActive: { backgroundColor: '#388E3C', borderColor: '#388E3C' },
  
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statsRowDesktop: { paddingHorizontal: 0 },
  statCard: { flex: 1, padding: 15, borderRadius: 18, alignItems: 'center', elevation: 4 },
  statNumber: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#FFF', fontSize: 9, textTransform: 'uppercase', fontWeight: 'bold' },
  
  listContent: { paddingHorizontal: 16 },
  listContentDesktop: { maxWidth: 1000, alignSelf: 'center', width: '100%', paddingHorizontal: 0 },
  
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
    margin: 6, 
    minWidth: 280,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  formNumber: { color: '#1976D2', fontSize: 14, fontWeight: 'bold' },
  codeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  codeText: { color: '#1976D2', fontSize: 11, fontWeight: 'bold' },
  patientName: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeText: { fontSize: 12, opacity: 0.7 },
});