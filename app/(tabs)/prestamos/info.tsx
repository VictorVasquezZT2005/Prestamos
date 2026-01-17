import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { firestore } from '@/services/firebase';

export default function InfoValeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [vale, setVale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isDesktop = width > 768;

  useEffect(() => {
    const fetchVale = async () => {
      if (!id) return;
      try {
        const docRef = doc(firestore, 'prestamos', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVale(docSnap.data());
        } else {
          Alert.alert('Error', 'El vale no existe');
          router.replace('/prestamos');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVale();
  }, [id]);

  const handleDownloadPDF = async () => {
    const renderValeSection = (tipo: string) => `
      <div class="section-container">
        <div class="watermark">${tipo}</div>
        <div class="header">
          <div class="title">FORMULARIO DE PRÉSTAMO DE PRODUCTOS</div>
          <div style="font-size: 16px; font-weight: bold; margin-top: 4px;">Vale #${vale?.numeroFormulario}</div>
          <div style="font-size: 11px; color: #666;">Fecha: ${vale?.createdAt ? new Date(vale.createdAt).toLocaleDateString() : 'N/A'}</div>
        </div>

        <table class="info-table">
          <tr>
            <td style="width: 50%;">
              <span class="label">Código Hosp.</span><span class="value">${vale?.codigo || 'N/A'}</span>
              <div style="margin-top: 8px;"></div>
              <span class="label">Requisición</span><span class="value">${vale?.requisicion || 'N/A'}</span>
              <div style="margin-top: 8px;"></div>
              <span class="label">Origen ➔ Destino</span><span class="value">${vale?.areaOrigen} ➔ ${vale?.areaDestino}</span>
            </td>
            <td style="width: 50%; border-left: 1px solid #eee; padding-left: 20px;">
              <span class="label">Paciente</span><span class="value">${vale?.nombrePaciente || 'N/A'}</span>
              <div style="margin-top: 8px;"></div>
              <span class="label">Habitación</span><span class="value">${vale?.habitacion || 'N/A'}</span>
              <div style="margin-top: 8px;"></div>
              <span class="label">Solicitado por</span><span class="value">${vale?.solicitadoPor || 'N/A'}</span>
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left;">DESCRIPCIÓN DE PRODUCTOS</th>
              <th style="width: 60px; text-align: center;">CANT.</th>
              <th style="width: 60px; text-align: center;">U.M.</th>
              <th style="width: 140px; text-align: center;">FIRMA RECIBIDO</th>
            </tr>
          </thead>
          <tbody>
            ${vale?.insumos?.map((item: any) => `
              <tr>
                <td style="font-weight: bold;">${item.descripcion}</td>
                <td style="text-align: center;">${item.cantidad}</td>
                <td style="text-align: center;">${item.unidadMedida}</td>
                <td style="height: 30px;"> </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="sig-table">
          <tr>
            <td style="padding-top: 50px;">
              <div class="sig-line"></div>
              <div class="name-placeholder">ENTREGADO POR: ${vale?.nombreEntrega || ''}</div>
            </td>
            <td style="padding-top: 50px;">
              <div class="sig-line"></div>
              <div class="name-placeholder">RECIBIDO POR: ${vale?.nombreRecibe || ''}</div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vale #${vale?.numeroFormulario}</title>
          <style>
            @page { size: letter; margin: 0; }
            body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 0; background-color: white; }
            .main-page { width: 8.5in; height: 11in; display: flex; flex-direction: column; margin: 0 auto; }
            .section-container { height: 5.5in; padding: 0.5in; box-sizing: border-box; position: relative; overflow: hidden; }
            .divider { border-top: 1.5px dashed #999; width: 100%; position: relative; }
            .header { text-align: center; margin-bottom: 12px; border-bottom: 2.5px solid #1976D2; padding-bottom: 8px; }
            .title { font-size: 17px; color: #1976D2; font-weight: bold; letter-spacing: 0.5px; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #eee; padding: 10px; border-radius: 5px; }
            .label { font-size: 9px; color: #333; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 1px; }
            .value { font-size: 11px; font-weight: bold; color: #000; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .items-table th { background-color: #f2f2f2; font-size: 9px; padding: 5px; border: 1px solid #ccc; text-transform: uppercase; }
            .items-table td { font-size: 10px; padding: 5px; border: 1px solid #ccc; color: #333; }
            .sig-table { width: 100%; margin-top: 20px; }
            .sig-table td { width: 50%; text-align: center; vertical-align: top; }
            .name-placeholder { font-size: 10px; font-weight: bold; color: #333; margin-top: 5px; text-transform: uppercase; }
            .sig-line { border-top: 1.2px solid #000; width: 80%; margin: 0 auto; }
            .watermark { 
              position: absolute; top: 15px; right: 15px; font-size: 18px; font-weight: 900; 
              color: rgba(0,0,0,0.35); border: 3px solid rgba(0,0,0,0.35); 
              padding: 5px 15px; border-radius: 4px; z-index: 10; text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="main-page">
            ${renderValeSection('ORIGINAL')}
            <div class="divider"></div>
            ${renderValeSection('COPIA')}
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        // Solución específica para Chrome Android y Navegadores Web
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Detectar si es móvil
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
          // En móviles abrimos en pestaña nueva para que Chrome no imprima la pantalla de atrás
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            newWindow.onload = () => {
              newWindow.print();
            };
          } else {
            Alert.alert('Ventana bloqueada', 'Por favor permite las ventanas emergentes para imprimir.');
          }
        } else {
          // En Desktop usamos el iframe invisible (funciona bien en Firefox/Chrome PC)
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
          
          const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();
            
            iframe.onload = () => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
              }, 1000);
            };
          }
        }
      } else {
        // App Nativa
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Vale_#${vale?.numeroFormulario}`,
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (error) {
      console.error('Error generando documento:', error);
      Alert.alert('Error', 'No se pudo generar el documento.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.mainWrapper, isDesktop && styles.desktopContainer]}>
        
        <View style={styles.headerApp}>
          <Pressable onPress={() => router.replace('/prestamos')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">Vale #{vale?.numeroFormulario}</ThemedText>
            <ThemedText style={styles.dateText}>
              {vale?.createdAt ? new Date(vale.createdAt).toLocaleDateString() : ''}
            </ThemedText>
          </View>
          <Pressable onPress={handleDownloadPDF} style={styles.downloadButton}>
            <Ionicons name="download-outline" size={24} color="#1976D2" />
            {isDesktop && <ThemedText style={{color: '#1976D2', marginLeft: 8, fontWeight: 'bold'}}>Descargar PDF</ThemedText>}
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={isDesktop ? styles.desktopRow : null}>
            
            <View style={isDesktop ? styles.desktopColumn : null}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Información General</ThemedText>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' }]}>
                <View style={styles.row}>
                  <InfoBlock label="Código" value={vale?.codigo} icon="barcode-outline" />
                  <InfoBlock label="Requisición" value={vale?.requisicion} icon="document-text-outline" />
                </View>
                <View style={styles.dividerApp} />
                <InfoBlock label="Paciente" value={vale?.nombrePaciente} icon="person-outline" />
                <InfoBlock label="Habitación" value={vale?.habitacion} icon="bed-outline" />
              </View>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Ruta y Solicitud</ThemedText>
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' }]}>
                <View style={styles.row}>
                  <InfoBlock label="Origen" value={vale?.areaOrigen} icon="location-outline" />
                  <Ionicons name="arrow-forward" size={16} color="#1976D2" style={{ marginTop: 25 }} />
                  <InfoBlock label="Destino" value={vale?.areaDestino} icon="flag-outline" />
                </View>
                <InfoBlock label="Solicitado por" value={vale?.solicitadoPor} icon="person-add-outline" />
              </View>
            </View>

            <View style={isDesktop ? [styles.desktopColumn, { marginLeft: 20 }] : null}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Insumos</ThemedText>
              <View style={isDesktop ? styles.insumosGridPC : null}>
                {vale?.insumos?.map((item: any, index: number) => (
                  <View key={index} style={[styles.insumoRow, { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                    <View style={styles.insumoMain}>
                      <ThemedText type="defaultSemiBold">{item.descripcion}</ThemedText>
                      <ThemedText style={styles.insumoDetail}>
                        <ThemedText style={{ fontWeight: 'bold' }}>Cant:</ThemedText> {item.cantidad} | <ThemedText style={{ fontWeight: 'bold' }}>U.M:</ThemedText> {item.unidadMedida}
                      </ThemedText>
                    </View>
                    <View style={styles.itemBadge}>
                       <ThemedText style={styles.itemBadgeText}>Item #{index + 1}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Responsables</ThemedText>
              <View style={[styles.firmaContainer, isDesktop && styles.firmaContainerPC]}>
                <View style={styles.firmaBox}>
                  <View style={[styles.firmaLineApp, { borderBottomColor: isDark ? '#FFF' : '#000' }]} />
                  <ThemedText style={styles.nombreFirma}>ENTREGADO POR: {vale?.nombreEntrega}</ThemedText>
                </View>
                <View style={styles.firmaBox}>
                  <View style={[styles.firmaLineApp, { borderBottomColor: isDark ? '#FFF' : '#000' }]} />
                  <ThemedText style={styles.nombreFirma}>RECIBIDO POR: {vale?.nombreRecibe}</ThemedText>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
}

function InfoBlock({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <View style={styles.infoBlock}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <View style={styles.infoValueRow}>
        <Ionicons name={icon} size={16} color="#1976D2" style={{ marginRight: 5 }} />
        <ThemedText type="defaultSemiBold">{value || 'N/A'}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainWrapper: { flex: 1, width: '100%' },
  desktopContainer: {
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  desktopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  desktopColumn: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerApp: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  backButton: { marginRight: 15 },
  downloadButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8, 
    backgroundColor: '#E3F2FD', 
    borderRadius: 10,
    paddingHorizontal: 15 
  },
  dateText: { fontSize: 12, opacity: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, color: '#1976D2', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  infoCard: { padding: 16, borderRadius: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  infoBlock: { flex: 1, marginBottom: 8 },
  infoLabel: { fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center' },
  dividerApp: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 4 },
  insumoRow: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, alignItems: 'center' },
  insumoMain: { flex: 1 },
  insumoDetail: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  itemBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemBadgeText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  firmaContainer: { marginTop: 10, gap: 25 },
  firmaContainerPC: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginTop: 20 },
  firmaBox: { alignItems: 'center', flex: 1 },
  nombreFirma: { fontSize: 11, fontWeight: 'bold', color: '#666', marginTop: 10, textTransform: 'uppercase', textAlign: 'center' },
  firmaLineApp: { width: '90%', borderBottomWidth: 1, height: 45 },
  insumosGridPC: { maxHeight: 500 }
});