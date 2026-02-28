import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { firestore } from "@/services/firebase";

interface Insumo {
  descripcion: string;
  cantidad: string;
  unidadMedida: string;
}

export default function UpdatePrestamoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isSamePerson, setIsSamePerson] = useState(false);

  // --- ESTADOS PARA SUGERENCIAS (IGUAL QUE CREATE) ---
  const [catalogoInsumos, setCatalogoInsumos] = useState<string[]>([]);
  const [catalogoUnidades, setCatalogoUnidades] = useState<string[]>([]);
  const [catalogoSolicitantes, setCatalogoSolicitantes] = useState<string[]>(
    [],
  );
  const [showSuggestions, setShowSuggestions] = useState<{
    index: number | null;
    field: string;
  } | null>(null);

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [form, setForm] = useState({
    codigo: "",
    requisicion: "",
    areaOrigen: "",
    areaDestino: "",
    solicitadoPor: "",
    habitacion: "",
    nombrePaciente: "",
    nombreEntrega: "",
    nombreRecibe: "",
    numeroFormulario: "",
  });

  // Cargar Catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const insumosSnap = await getDocs(
          collection(firestore, "catalogo_insumos"),
        );
        const unidadesSnap = await getDocs(
          collection(firestore, "catalogo_unidades"),
        );
        const solicitantesSnap = await getDocs(
          collection(firestore, "catalogo_solicitantes"),
        );

        setCatalogoInsumos(insumosSnap.docs.map((d) => d.id));
        setCatalogoUnidades(unidadesSnap.docs.map((d) => d.id));
        setCatalogoSolicitantes(solicitantesSnap.docs.map((d) => d.id));
      } catch (e) {
        console.log("Error cargando catálogos:", e);
      }
    };
    fetchCatalogos();
  }, []);

  // Cargar Documento Original
  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(firestore, "prestamos", id as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            codigo: data.codigo || "",
            requisicion: data.requisicion || "",
            areaOrigen: data.areaOrigen || "",
            areaDestino: data.areaDestino || "",
            solicitadoPor: data.solicitadoPor || "",
            habitacion: data.habitacion || "",
            nombrePaciente: data.nombrePaciente || "",
            nombreEntrega: data.nombreEntrega || "",
            nombreRecibe: data.nombreRecibe || "",
            numeroFormulario: data.numeroFormulario || "",
          });
          setInsumos(data.insumos || []);
          if (
            data.solicitadoPor === data.nombreRecibe &&
            data.solicitadoPor !== ""
          ) {
            setIsSamePerson(true);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (isSamePerson) {
      setForm((prev) => ({ ...prev, nombreRecibe: prev.solicitadoPor }));
    }
  }, [isSamePerson, form.solicitadoPor]);

  const addInsumo = () =>
    setInsumos([
      ...insumos,
      { descripcion: "", cantidad: "", unidadMedida: "" },
    ]);

  const removeInsumo = (index: number) => {
    if (insumos.length > 1) setInsumos(insumos.filter((_, i) => i !== index));
  };

  const updateInsumo = (index: number, field: keyof Insumo, value: string) => {
    const newInsumos = [...insumos];
    const finalValue =
      field === "descripcion" || field === "unidadMedida"
        ? value.toUpperCase()
        : value;
    newInsumos[index] = { ...newInsumos[index], [field]: finalValue };
    setInsumos(newInsumos);

    if (
      value.length > 0 &&
      (field === "descripcion" || field === "unidadMedida")
    ) {
      setShowSuggestions({ index, field });
    } else {
      setShowSuggestions(null);
    }
  };

  const selectSuggestion = (
    index: number | null,
    field: string,
    value: string,
  ) => {
    if (field === "solicitadoPor") {
      setForm({ ...form, solicitadoPor: value });
    } else if (index !== null) {
      const newInsumos = [...insumos];
      newInsumos[index] = {
        ...newInsumos[index],
        [field as keyof Insumo]: value,
      };
      setInsumos(newInsumos);
    }
    setShowSuggestions(null);
  };

  const actualizarCatalogos = async () => {
    try {
      if (form.solicitadoPor.trim()) {
        await setDoc(
          doc(firestore, "catalogo_solicitantes", form.solicitadoPor.trim()),
          { nombre: form.solicitadoPor.trim(), ultimaVez: serverTimestamp() },
          { merge: true },
        );
      }
      for (const item of insumos) {
        if (item.descripcion.trim()) {
          await setDoc(
            doc(firestore, "catalogo_insumos", item.descripcion.trim()),
            { nombre: item.descripcion.trim(), ultimaVez: serverTimestamp() },
            { merge: true },
          );
        }
        if (item.unidadMedida.trim()) {
          await setDoc(
            doc(firestore, "catalogo_unidades", item.unidadMedida.trim()),
            { nombre: item.unidadMedida.trim() },
            { merge: true },
          );
        }
      }
    } catch (error) {
      console.error("Error catálogos:", error);
    }
  };

  const handleUpdate = async () => {
    if (!form.codigo || !form.nombrePaciente || insumos.length === 0) {
      const errorMsg = "Complete el código, paciente y al menos un insumo.";
      if (Platform.OS === "web") alert(errorMsg);
      else Alert.alert("Error", errorMsg);
      return;
    }

    setUpdating(true);
    try {
      const docRef = doc(firestore, "prestamos", id as string);
      await updateDoc(docRef, {
        ...form,
        insumos,
        updatedAt: new Date().toISOString(),
      });

      await actualizarCatalogos();

      const successMsg = "Vale actualizado correctamente";
      if (Platform.OS === "web") {
        alert(successMsg);
        router.replace("/prestamos");
      } else {
        Alert.alert("Éxito", successMsg, [
          { text: "OK", onPress: () => router.replace("/prestamos") },
        ]);
      }
    } catch (e: any) {
      if (Platform.OS === "web") alert("Error: " + e.message);
      else Alert.alert("Error", e.message);
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
    keyboardType: any = "default",
    editable: boolean = true,
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? "#222" : "#F0F0F0" },
          !editable && {
            opacity: 0.6,
            backgroundColor: isDark ? "#0F0F0F" : "#E8E8E8",
          },
        ]}
      >
        <Ionicons name={icon} size={20} color="#1976D2" style={styles.icon} />
        <TextInput
          style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={(t) => onChange(t.toUpperCase())}
          keyboardType={keyboardType}
          editable={editable}
          onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
        />
        {!editable && <Ionicons name="lock-closed" size={16} color="#888" />}
      </View>
    </View>
  );

  const renderDropdown = (index: number | null, field: string) => {
    if (showSuggestions?.index !== index || showSuggestions?.field !== field)
      return null;

    let queryText = "";
    let data: string[] = [];

    if (field === "solicitadoPor") {
      queryText = form.solicitadoPor.toUpperCase();
      data = catalogoSolicitantes;
    } else if (index !== null) {
      queryText = insumos[index][field as keyof Insumo].toUpperCase();
      data = field === "descripcion" ? catalogoInsumos : catalogoUnidades;
    }

    const filtered = data
      .filter((item) => item.includes(queryText) && item !== queryText)
      .slice(0, 5);

    if (filtered.length === 0) return null;

    return (
      <View
        style={[styles.dropdown, { backgroundColor: isDark ? "#333" : "#FFF" }]}
      >
        {filtered.map((item, i) => (
          <Pressable
            key={i}
            style={styles.dropdownItem}
            onPress={() => selectSuggestion(index, field, item)}
          >
            <ThemedText style={styles.dropdownText}>{item}</ThemedText>
          </Pressable>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { paddingTop: isDesktop ? 20 : insets.top }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={isDesktop ? styles.desktopWrapper : { flex: 1 }}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                onPress={() => router.replace("/prestamos")}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={isDark ? "#FFF" : "#000"}
                />
              </Pressable>
              <View>
                <ThemedText type="title">Editar Vale</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Folio #{form.numeroFormulario}
                </ThemedText>
              </View>
            </View>
            {updating && <ActivityIndicator size="small" color="#1976D2" />}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={isDesktop ? styles.gridRow : null}>
              <View style={isDesktop ? styles.gridCol : null}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Identificación
                </ThemedText>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    {renderStyledInput(
                      "Código",
                      form.codigo,
                      (t) => setForm({ ...form, codigo: t }),
                      "barcode-outline",
                      "HOSP001",
                    )}
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    {renderStyledInput(
                      "Requisición",
                      form.requisicion,
                      (t) => setForm({ ...form, requisicion: t }),
                      "document-text-outline",
                      "No. Req",
                    )}
                  </View>
                </View>
                {renderStyledInput(
                  "Nombre del Paciente",
                  form.nombrePaciente,
                  (t) => setForm({ ...form, nombrePaciente: t }),
                  "person-outline",
                  "Nombre completo",
                )}
                {renderStyledInput(
                  "Habitación",
                  form.habitacion,
                  (t) => setForm({ ...form, habitacion: t }),
                  "bed-outline",
                  "Ej. 302",
                )}
              </View>

              {isDesktop && <View style={{ width: 30 }} />}

              <View style={isDesktop ? styles.gridCol : null}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Ruta y Solicitud
                </ThemedText>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    {renderStyledInput(
                      "Área Origen",
                      form.areaOrigen,
                      (t) => setForm({ ...form, areaOrigen: t }),
                      "location-outline",
                      "Origen",
                    )}
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    {renderStyledInput(
                      "Área Destino",
                      form.areaDestino,
                      (t) => setForm({ ...form, areaDestino: t }),
                      "flag-outline",
                      "Destino",
                    )}
                  </View>
                </View>
                <View style={{ zIndex: 3000 }}>
                  {renderStyledInput(
                    "Solicitado por",
                    form.solicitadoPor,
                    (t) => {
                      setForm({ ...form, solicitadoPor: t });
                      if (t.length > 0)
                        setShowSuggestions({
                          index: null,
                          field: "solicitadoPor",
                        });
                      else setShowSuggestions(null);
                    },
                    "person-add-outline",
                    "Quien solicita",
                  )}
                  {renderDropdown(null, "solicitadoPor")}
                </View>
              </View>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 15 }]}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Insumos Solicitados
              </ThemedText>
              <Pressable onPress={addInsumo} style={styles.addButton}>
                <Ionicons name="add-circle" size={22} color="#1976D2" />
                <ThemedText
                  style={{
                    color: "#1976D2",
                    fontWeight: "bold",
                    marginLeft: 5,
                  }}
                >
                  Añadir
                </ThemedText>
              </Pressable>
            </View>

            <View style={isDesktop ? styles.insumosGrid : null}>
              {insumos.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.insumoCard,
                    {
                      backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9",
                      borderColor: isDark ? "#333" : "#CCC",
                    },
                    isDesktop && styles.insumoCardDesktop,
                  ]}
                >
                  <View style={styles.insumoHeader}>
                    <ThemedText style={styles.insumoCount}>
                      ITEM #{index + 1}
                    </ThemedText>
                    {insumos.length > 1 && (
                      <Pressable onPress={() => removeInsumo(index)}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#FF5252"
                        />
                      </Pressable>
                    )}
                  </View>
                  <View style={{ zIndex: 2000 }}>
                    {renderStyledInput(
                      "Descripción",
                      item.descripcion,
                      (t) => updateInsumo(index, "descripcion", t),
                      "cube-outline",
                      "Descripción",
                    )}
                    {renderDropdown(index, "descripcion")}
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      {renderStyledInput(
                        "Cantidad",
                        item.cantidad,
                        (t) => updateInsumo(index, "cantidad", t),
                        "reorder-four-outline",
                        "0",
                        "numeric",
                      )}
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ flex: 1, zIndex: 1000 }}>
                      {renderStyledInput(
                        "U. Medida",
                        item.unidadMedida,
                        (t) => updateInsumo(index, "unidadMedida", t),
                        "pricetag-outline",
                        "Und",
                      )}
                      {renderDropdown(index, "unidadMedida")}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <ThemedText
              type="defaultSemiBold"
              style={[styles.sectionTitle, { marginTop: 10 }]}
            >
              Firmas de Responsabilidad
            </ThemedText>
            <View style={isDesktop ? styles.gridRow : null}>
              <View style={isDesktop ? styles.gridCol : styles.firmaBox}>
                {renderStyledInput(
                  "Entregado por",
                  form.nombreEntrega,
                  () => {},
                  "hand-right-outline",
                  "Cargando...",
                  "default",
                  false,
                )}
              </View>
              {isDesktop && <View style={{ width: 30 }} />}
              <View style={isDesktop ? styles.gridCol : styles.firmaBox}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setIsSamePerson(!isSamePerson)}
                >
                  <Ionicons
                    name={isSamePerson ? "checkbox" : "square-outline"}
                    size={20}
                    color="#1976D2"
                  />
                  <ThemedText style={styles.checkboxText}>
                    ¿Recibe quien solicita?
                  </ThemedText>
                </Pressable>
                {renderStyledInput(
                  "Recibido por",
                  form.nombreRecibe,
                  (t) => setForm({ ...form, nombreRecibe: t }),
                  "checkmark-circle-outline",
                  "Nombre de quien recibe",
                  "default",
                  !isSamePerson,
                )}
              </View>
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { opacity: updating ? 0.7 : 1 },
                isDesktop && styles.submitButtonDesktop,
              ]}
              onPress={handleUpdate}
              disabled={updating}
            >
              <ThemedText style={styles.submitText}>
                {updating ? "Guardando cambios..." : "Guardar Cambios"}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  desktopWrapper: {
    maxWidth: 1000,
    alignSelf: "center",
    width: "100%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  headerDesktop: { paddingHorizontal: 0 },
  backButton: { marginRight: 15 },
  subtitle: { fontSize: 13, opacity: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: "#1976D2",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(25, 118, 210, 0.05)",
    padding: 8,
    borderRadius: 10,
  },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, opacity: 0.7 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  row: { flexDirection: "row" },
  gridRow: { flexDirection: "row", alignItems: "flex-start" },
  gridCol: { flex: 1 },
  insumosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  insumoCard: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  insumoCardDesktop: { width: "48.5%", marginBottom: 10 },
  insumoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  insumoCount: { fontSize: 10, fontWeight: "bold", opacity: 0.5 },
  dropdown: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: "#1976D2",
    zIndex: 9999,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CCC",
  },
  dropdownText: { fontSize: 14 },
  firmaBox: { marginBottom: 10 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingLeft: 5,
  },
  checkboxText: { fontSize: 12, marginLeft: 8, opacity: 0.8 },
  submitButton: {
    backgroundColor: "#1976D2",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  submitButtonDesktop: { width: 300, alignSelf: "center" },
  submitText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
