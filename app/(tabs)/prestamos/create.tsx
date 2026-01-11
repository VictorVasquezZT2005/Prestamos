import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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

interface Insumo {
  descripcion: string;
  cantidad: string;
  unidadMedida: string;
}

export default function CreatePrestamoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [loading, setLoading] = useState(false);
  const [isSamePerson, setIsSamePerson] = useState(false);
  
  const [insumos, setInsumos] = useState<Insumo[]>([
    { descripcion: '', cantidad: '', unidadMedida: '' }
  ]);

  const [form, setForm] = useState({
    codigo: '',
    requisicion: '',
    areaOrigen: '',
    areaDestino: '',
    solicitadoPor: '',
    habitacion: '',
    nombrePaciente: '',
    nombreEntrega: '',
    nombreRecibe: '',
  });

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setForm(prev => ({ ...prev, nombreEntrega: userData.name || user.email }));
          } else {
            setForm(prev => ({ ...prev, nombreEntrega: user.email || 'Usuario' }));
          }
        } catch (e) {
          console.log("Error obteniendo nombre:", e);
        }
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    if (isSamePerson) {
      setForm(prev => ({ ...prev, nombreRecibe: prev.solicitadoPor }));
    }
  }, [isSamePerson, form.solicitadoPor]);

  const addInsumo = () => {
    setInsumos([...insumos, { descripcion: '', cantidad: '', unidadMedida: '' }]);
  };

  const removeInsumo = (index: number) => {
    if (insumos.length > 1) {
      const newInsumos = insumos.filter((_, i) => i !== index);
      setInsumos(newInsumos);
    }
  };

  const updateInsumo = (index: number, field: keyof Insumo, value: string) => {
    const newInsumos = [...insumos];
    newInsumos[index] = { ...newInsumos[index], [field]: value };
    setInsumos(newInsumos);
  };

  const getNextNumeroFormulario = async () => {
    const q = query(collection(firestore, 'prestamos'), orderBy('numeroFormulario', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastValue = snapshot.docs[0].data().numeroFormulario;
      const num = parseInt(lastValue) + 1;
      return num.toString().padStart(5, '0');
    }
    return '00001';
  };

  const handleCreate = async () => {
    if (!form.codigo || !form.nombrePaciente || insumos[0].descripcion === '') {
      const errorMsg = 'Complete el código, paciente y al menos un insumo.';
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('Error', errorMsg);
      return;
    }

    setLoading(true);
    try {
      const numeroFormulario = await getNextNumeroFormulario();
      await addDoc(collection(firestore, 'prestamos'), {
        ...form,
        insumos,
        numeroFormulario,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid
      });

      const successMsg = `Vale #${numeroFormulario} registrado con éxito`;

      if (Platform.OS === 'web') {
        alert(successMsg);
        router.replace('/prestamos');
      } else {
        Alert.alert('Éxito', successMsg, [
          { text: 'OK', onPress: () => router.replace('/prestamos') }
        ]);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') alert('Error: ' + e.message);
      else Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStyledInput = (
    label: string, 
    value: string, 
    onChange: (t: string) => void, 
    icon: any, 
    placeholder: string, 
    keyboardType: any = 'default',
    editable: boolean = true
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[
        styles.inputContainer, 
        { backgroundColor: isDark ? '#222' : '#F0F0F0' },
        !editable && { opacity: 0.6, backgroundColor: isDark ? '#0F0F0F' : '#E8E8E8' }
      ]}>
        <Ionicons name={icon} size={20} color="#1976D2" style={styles.icon} />
        <TextInput
          style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          editable={editable}
        />
        {!editable && <Ionicons name="lock-closed" size={16} color="#888" />}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: isDesktop ? 20 : insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={isDesktop ? styles.desktopWrapper : { flex: 1 }}>
          
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.replace('/prestamos')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
              </Pressable>
              <View>
                <ThemedText type="title">Nuevo Vale</ThemedText>
                <ThemedText style={styles.subtitle}>Registro de préstamo de insumos</ThemedText>
              </View>
            </View>
            <Ionicons name="add-circle-outline" size={28} color="#1976D2" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={isDesktop ? styles.gridRow : null}>
              <View style={isDesktop ? styles.gridCol : null}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Identificación</ThemedText>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    {renderStyledInput('Código', form.codigo, (t) => setForm({...form, codigo: t}), 'barcode-outline', 'HOSP001')}
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    {renderStyledInput('Requisición', form.requisicion, (t) => setForm({...form, requisicion: t}), 'document-text-outline', 'No. Req')}
                  </View>
                </View>
                {renderStyledInput('Nombre del Paciente', form.nombrePaciente, (t) => setForm({...form, nombrePaciente: t}), 'person-outline', 'Nombre completo')}
                {renderStyledInput('Habitación', form.habitacion, (t) => setForm({...form, habitacion: t}), 'bed-outline', 'Ej. 302')}
              </View>

              {isDesktop && <View style={{ width: 30 }} />}

              <View style={isDesktop ? styles.gridCol : null}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Ruta y Solicitud</ThemedText>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    {renderStyledInput('Área Origen', form.areaOrigen, (t) => setForm({...form, areaOrigen: t}), 'location-outline', 'Origen')}
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    {renderStyledInput('Área Destino', form.areaDestino, (t) => setForm({...form, areaDestino: t}), 'flag-outline', 'Destino')}
                  </View>
                </View>
                {renderStyledInput('Solicitado por', form.solicitadoPor, (t) => setForm({...form, solicitadoPor: t}), 'person-add-outline', 'Quien solicita')}
              </View>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 15 }]}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Insumos Solicitados</ThemedText>
              <Pressable onPress={addInsumo} style={styles.addButton}>
                <Ionicons name="add-circle" size={22} color="#1976D2" />
                <ThemedText style={{color: '#1976D2', fontWeight: 'bold', marginLeft: 5}}>Añadir</ThemedText>
              </Pressable>
            </View>

            <View style={isDesktop ? styles.insumosGrid : null}>
                {insumos.map((item, index) => (
                    <View key={index} style={[styles.insumoCard, { backgroundColor: isDark ? '#1E1E1E' : '#F9F9F9', borderColor: isDark ? '#333' : '#CCC' }, isDesktop && styles.insumoCardDesktop]}>
                        <View style={styles.insumoHeader}>
                            <ThemedText style={styles.insumoCount}>ITEM #{index + 1}</ThemedText>
                            {insumos.length > 1 && (
                                <Pressable onPress={() => removeInsumo(index)}>
                                    <Ionicons name="trash-outline" size={18} color="#FF5252" />
                                </Pressable>
                            )}
                        </View>
                        {renderStyledInput('Descripción', item.descripcion, (t) => updateInsumo(index, 'descripcion', t), 'cube-outline', 'Descripción')}
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>{renderStyledInput('Cantidad', item.cantidad, (t) => updateInsumo(index, 'cantidad', t), 'reorder-four-outline', '0', 'numeric')}</View>
                            <View style={{ width: 10 }} />
                            <View style={{ flex: 1 }}>{renderStyledInput('U. Medida', item.unidadMedida, (t) => updateInsumo(index, 'unidadMedida', t), 'pricetag-outline', 'Und')}</View>
                        </View>
                    </View>
                ))}
            </View>

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { marginTop: 10 }]}>Firmas de Responsabilidad</ThemedText>
            
            <View style={isDesktop ? styles.gridRow : null}>
                <View style={isDesktop ? styles.gridCol : styles.firmaBox}>
                   {renderStyledInput('Entregado por', form.nombreEntrega, () => {}, 'hand-right-outline', 'Cargando...', 'default', false)}
                </View>
                {isDesktop && <View style={{ width: 30 }} />}
                <View style={isDesktop ? styles.gridCol : styles.firmaBox}>
                    <Pressable style={styles.checkboxRow} onPress={() => setIsSamePerson(!isSamePerson)}>
                        <Ionicons name={isSamePerson ? "checkbox" : "square-outline"} size={20} color="#1976D2" />
                        <ThemedText style={styles.checkboxText}>¿Recibe quien solicita?</ThemedText>
                    </Pressable>
                    {renderStyledInput('Recibido por', form.nombreRecibe, (t) => setForm({...form, nombreRecibe: t}), 'checkmark-circle-outline', 'Nombre de quien recibe', 'default', !isSamePerson)}
                </View>
            </View>

            <Pressable style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }, isDesktop && styles.submitButtonDesktop]} onPress={handleCreate} disabled={loading}>
              <ThemedText style={styles.submitText}>{loading ? 'Guardando...' : 'Confirmar Registro'}</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopWrapper: { maxWidth: 1000, alignSelf: 'center', width: '100%', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  headerDesktop: { paddingHorizontal: 0 },
  backButton: { marginRight: 15 },
  subtitle: { fontSize: 13, opacity: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, marginBottom: 12, color: '#1976D2', fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 118, 210, 0.05)', padding: 8, borderRadius: 10 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, opacity: 0.7 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  row: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start' },
  gridCol: { flex: 1 },
  insumosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insumoCard: { padding: 15, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderStyle: 'dashed' },
  insumoCardDesktop: { width: '48.5%', marginBottom: 10 },
  insumoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  insumoCount: { fontSize: 10, fontWeight: 'bold', opacity: 0.5 },
  firmaBox: { marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingLeft: 5 },
  checkboxText: { fontSize: 12, marginLeft: 8, opacity: 0.8 },
  submitButton: { backgroundColor: '#1976D2', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 3 },
  submitButtonDesktop: { width: 300, alignSelf: 'center' },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});