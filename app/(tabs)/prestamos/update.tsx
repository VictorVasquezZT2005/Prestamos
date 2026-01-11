import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { firestore } from '@/services/firebase';

interface Insumo {
  descripcion: string;
  cantidad: string;
  unidadMedida: string;
}

export default function UpdatePrestamoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isSamePerson, setIsSamePerson] = useState(false);
  
  const [insumos, setInsumos] = useState<Insumo[]>([]);
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
    numeroFormulario: '',
  });

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(firestore, 'prestamos', id as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            codigo: data.codigo || '',
            requisicion: data.requisicion || '',
            areaOrigen: data.areaOrigen || '',
            areaDestino: data.areaDestino || '',
            solicitadoPor: data.solicitadoPor || '',
            habitacion: data.habitacion || '',
            nombrePaciente: data.nombrePaciente || '',
            nombreEntrega: data.nombreEntrega || '',
            nombreRecibe: data.nombreRecibe || '',
            numeroFormulario: data.numeroFormulario || '',
          });
          setInsumos(data.insumos || []);
          if (data.solicitadoPor === data.nombreRecibe) setIsSamePerson(true);
        }
      } catch (e) {
        if (Platform.OS === 'web') alert("No se pudo cargar la información");
        else Alert.alert("Error", "No se pudo cargar la información");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (isSamePerson) {
      setForm(prev => ({ ...prev, nombreRecibe: prev.solicitadoPor }));
    }
  }, [isSamePerson, form.solicitadoPor]);

  const addInsumo = () => setInsumos([...insumos, { descripcion: '', cantidad: '', unidadMedida: '' }]);

  const removeInsumo = (index: number) => {
    if (insumos.length > 1) setInsumos(insumos.filter((_, i) => i !== index));
  };

  const updateInsumo = (index: number, field: keyof Insumo, value: string) => {
    const newInsumos = [...insumos];
    newInsumos[index] = { ...newInsumos[index], [field]: value };
    setInsumos(newInsumos);
  };

  const handleUpdate = async () => {
    if (!form.codigo || !form.nombrePaciente || insumos.length === 0) {
      const errorMsg = 'Complete el código, paciente y al menos un insumo.';
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('Error', errorMsg);
      return;
    }

    setUpdating(true);
    try {
      const docRef = doc(firestore, 'prestamos', id as string);
      await updateDoc(docRef, {
        ...form,
        insumos,
        updatedAt: new Date().toISOString(),
      });

      const successMsg = 'Vale actualizado correctamente';
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
      setUpdating(false);
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

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
      </ThemedView>
    );
  }

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
                <ThemedText type="title">Editar Vale</ThemedText>
                <ThemedText style={styles.subtitle}>Folio #{form.numeroFormulario}</ThemedText>
              </View>
            </View>
            <Ionicons name="create-outline" size={28} color="#1976D2" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={isDesktop ? styles.gridRow : null}>
              {/* Bloque Identificación */}
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

              {/* Bloque Ruta */}
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

            {/* Bloque Insumos */}
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

            <Pressable 
              style={[styles.submitButton, { opacity: updating ? 0.7 : 1 }, isDesktop && styles.submitButtonDesktop]} 
              onPress={handleUpdate} 
              disabled={updating}
            >
              <ThemedText style={styles.submitText}>{updating ? 'Guardando cambios...' : 'Guardar Cambios'}</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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