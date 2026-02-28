import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth, firestore } from "@/services/firebase";

interface Insumo {
  descripcion: string;
  cantidad: string;
  unidadMedida: string;
}

export default function CreatePrestamoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;

  const [loading, setLoading] = useState(false);
  const [isSamePerson, setIsSamePerson] = useState(false);

  // --- ESTADOS PARA SUGERENCIAS ---
  const [catalogoInsumos, setCatalogoInsumos] = useState<string[]>([]);
  const [catalogoUnidades, setCatalogoUnidades] = useState<string[]>([]);
  const [catalogoSolicitantes, setCatalogoSolicitantes] = useState<string[]>(
    [],
  );
  const [showSuggestions, setShowSuggestions] = useState<{
    index: number | null;
    field: string;
  } | null>(null);

  const [insumos, setInsumos] = useState<Insumo[]>([
    { descripcion: "", cantidad: "", unidadMedida: "" },
  ]);

  const [form, setForm] = useState({
    codigo: "",
    requisicion: "",
    areaOrigen: "BOTIQUÍN",
    areaDestino: "",
    solicitadoPor: "",
    habitacion: "",
    nombrePaciente: "",
    nombreEntrega: "",
    nombreRecibe: "",
  });

  // Cargar catálogos al iniciar la pantalla
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

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setForm((prev) => ({
              ...prev,
              nombreEntrega: (userData.name || user.email).toUpperCase(),
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              nombreEntrega: (user.email || "USUARIO").toUpperCase(),
            }));
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
      setForm((prev) => ({ ...prev, nombreRecibe: prev.solicitadoPor }));
    }
  }, [isSamePerson, form.solicitadoPor]);

  const addInsumo = () => {
    setInsumos([
      ...insumos,
      { descripcion: "", cantidad: "", unidadMedida: "" },
    ]);
  };

  const removeInsumo = (index: number) => {
    if (insumos.length > 1) {
      const newInsumos = insumos.filter((_, i) => i !== index);
      setInsumos(newInsumos);
    }
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

  const getNextNumeroFormulario = async () => {
    const q = query(
      collection(firestore, "prestamos"),
      orderBy("numeroFormulario", "desc"),
      limit(1),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastValue = snapshot.docs[0].data().numeroFormulario;
      const num = parseInt(lastValue) + 1;
      return num.toString().padStart(5, "0");
    }
    return "00001";
  };

  const actualizarCatalogos = async () => {
    try {
      // Guardar solicitante
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

  const handleCreate = async () => {
    if (!form.codigo || !form.nombrePaciente || insumos[0].descripcion === "") {
      const errorMsg = "Complete el código, paciente y al menos un insumo.";
      if (Platform.OS === "web") alert(errorMsg);
      else Alert.alert("Error", errorMsg);
      return;
    }

    setLoading(true);
    try {
      const numeroFormulario = await getNextNumeroFormulario();

      await addDoc(collection(firestore, "prestamos"), {
        ...form,
        insumos,
        numeroFormulario,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid,
      });

      await actualizarCatalogos();

      const successMsg = `Vale #${numeroFormulario} registrado con éxito`;

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
      setLoading(false);
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
            backgroundColor: isDark ? "#121212" : "#E8E8E8",
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
          onBlur={() => {
            setTimeout(() => setShowSuggestions(null), 200);
          }}
        />
        {!editable && <Ionicons name="lock-closed" size={14} color="#888" />}
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
                <ThemedText type="title">Nuevo Vale</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Registro de préstamo
                </ThemedText>
              </View>
            </View>
            {loading && <ActivityIndicator size="small" color="#1976D2" />}
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
                      "REQ",
                    )}
                  </View>
                </View>
                {renderStyledInput(
                  "Nombre del Paciente",
                  form.nombrePaciente,
                  (t) => setForm({ ...form, nombrePaciente: t }),
                  "person-outline",
                  "PACIENTE",
                )}
                {renderStyledInput(
                  "Habitación",
                  form.habitacion,
                  (t) => setForm({ ...form, habitacion: t }),
                  "bed-outline",
                  "NÚMERO",
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
                      () => {},
                      "location-outline",
                      "BOTIQUÍN",
                      "default",
                      false,
                    )}
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    {renderStyledInput(
                      "Área Destino",
                      form.areaDestino,
                      (t) => setForm({ ...form, areaDestino: t }),
                      "flag-outline",
                      "DESTINO",
                    )}
                  </View>
                </View>

                {/* CAMPO SOLICITADO POR CON DESPLEGABLE */}
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
                    "QUIEN SOLICITA",
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
                <Ionicons name="add-circle" size={20} color="#1976D2" />
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
                      "PRODUCTO",
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
                        "UND",
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
              Firmas
            </ThemedText>
            <View style={isDesktop ? styles.gridRow : null}>
              <View style={isDesktop ? styles.gridCol : styles.firmaBox}>
                {renderStyledInput(
                  "Entregado por",
                  form.nombreEntrega,
                  () => {},
                  "hand-right-outline",
                  "SISTEMA",
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
                    ¿Recibe el mismo solicitante?
                  </ThemedText>
                </Pressable>
                {renderStyledInput(
                  "Recibido por",
                  form.nombreRecibe,
                  (t) => setForm({ ...form, nombreRecibe: t }),
                  "checkmark-circle-outline",
                  "NOMBRE",
                  "default",
                  !isSamePerson,
                )}
              </View>
            </View>

            <Pressable
              style={[
                styles.submitButton,
                { opacity: loading ? 0.7 : 1 },
                isDesktop && styles.submitButtonDesktop,
              ]}
              onPress={handleCreate}
              disabled={loading}
            >
              <ThemedText style={styles.submitText}>
                {loading ? "Guardando..." : "Confirmar Registro"}
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
