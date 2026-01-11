import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, firestore } from '@/services/firebase';
import FieldEditor from '../../../components/FieldEditor';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export default function UsuariosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const currentUserEmail = auth.currentUser?.email; 
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const numColumns = isDesktop ? (width > 1200 ? 3 : 2) : 1;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'email' | 'password'>('name');

  useEffect(() => {
    const q = query(collection(firestore, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: User[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...(docSnap.data() as User) });
      });
      setUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = users.filter((u) => 
      `${u.name || ''} ${u.email}`.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const confirmDelete = (user: User) => {
    if (user.email === currentUserEmail) {
      if (Platform.OS === 'web') alert('No puedes eliminar tu propia cuenta.');
      else Alert.alert('Acción no permitida', 'No puedes eliminar tu propia cuenta.');
      return;
    }

    const message = `¿Estás seguro de eliminar a ${user.email}?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        deleteDoc(doc(firestore, 'users', user.id));
      }
    } else {
      Alert.alert('Eliminar Usuario', message, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteDoc(doc(firestore, 'users', user.id)) },
      ]);
    }
  };

  const toggleRole = async (user: User) => {
    if (user.email === currentUserEmail) {
      if (Platform.OS === 'web') alert('No puedes cambiar tu propio rol.');
      else Alert.alert('Acción no permitida', 'No puedes cambiar tu propio rol.');
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'ASCENDER a ADMINISTRADOR' : 'DEGRADAR a USUARIO';
    const message = `¿Deseas ${actionText} a ${user.name || user.email}?\n\n${
      newRole === 'admin' 
      ? 'Esto le otorgará permisos para gestionar la base de datos y usuarios.' 
      : 'Esto restringirá sus permisos a las funciones básicas.'
    }`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        try {
          await updateDoc(doc(firestore, 'users', user.id), { role: newRole });
        } catch (e) {
          alert('Error: No se pudo actualizar el rol.');
        }
      }
    } else {
      Alert.alert(
        'Confirmar Cambio de Rol',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Confirmar', 
            style: newRole === 'user' ? 'destructive' : 'default',
            onPress: async () => {
              try {
                await updateDoc(doc(firestore, 'users', user.id), { role: newRole });
              } catch (e) {
                Alert.alert('Error', 'No se pudo actualizar el rol.');
              }
            } 
          }
        ]
      );
    }
  };

  const openEditor = (user: User, field: 'name' | 'email' | 'password') => {
    setEditingUser(user);
    setEditingField(field);
    setModalVisible(true);
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const initials = (item.name || item.email).substring(0, 2).toUpperCase();
    const isMe = item.email === currentUserEmail;

    return (
      <View style={[
        styles.userCard, 
        { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: isDark ? '#333' : '#E0E0E0' },
        isDesktop && styles.userCardDesktop
      ]}>
        <View style={styles.cardContent}>
          <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? '#1976D2' : '#6750A4' }]}>
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          </View>

          <View style={styles.userMainInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText type="defaultSemiBold" style={styles.userName}>{item.name || 'Sin nombre'}</ThemedText>
              {isMe && (
                <View style={styles.meBadge}>
                  <ThemedText style={styles.meBadgeText}>TÚ</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
            <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#E3F2FD' : '#F3E5F5' }]}>
              <ThemedText style={[styles.roleText, { color: item.role === 'admin' ? '#1976D2' : '#6750A4' }]}>
                {item.role.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.actionColumn}>
          <Pressable onPress={() => openEditor(item, 'name')} style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#1976D2" />
          </Pressable>
          
          {!isMe && (
            <>
              <Pressable onPress={() => toggleRole(item)} style={styles.actionButton}>
                <Ionicons 
                  name={item.role === 'admin' ? "shield-checkmark" : "shield-outline"} 
                  size={22} 
                  color={item.role === 'admin' ? "#4CAF50" : "#1976D2"} 
                />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={22} color="#FF5252" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View>
          <ThemedText type="title">Gestión de Usuarios</ThemedText>
          <ThemedText style={styles.subtitle}>{filteredUsers.length} usuarios registrados</ThemedText>
        </View>
        <Ionicons name="people-outline" size={32} color="#1976D2" />
      </View>

      <View style={[
        styles.searchContainer, 
        { backgroundColor: isDark ? '#222' : '#F0F0F0' },
        isDesktop && styles.searchContainerDesktop
      ]}>
        <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchBar, { color: isDark ? '#FFF' : '#000' }]}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={item => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: 100 },
            isDesktop && styles.listContentDesktop
          ]}
        />
      )}

      <Pressable 
        style={[styles.fab, { bottom: insets.bottom + 20 }, isDesktop && styles.fabDesktop]} 
        onPress={() => router.push('/usuarios/create')} 
      >
        <Ionicons name="person-add" size={26} color="white" />
        {isDesktop && <ThemedText style={styles.fabLabel}>Nuevo Usuario</ThemedText>}
      </Pressable>

      {editingUser && (
        <FieldEditor
          visible={modalVisible}
          fieldName={editingField}
          currentValue={editingField === 'name' ? editingUser.name || '' : editingUser.email}
          onClose={() => setModalVisible(false)}
          onSave={async (value) => {
            const userRef = doc(firestore, 'users', editingUser.id);
            if (editingField === 'name') await updateDoc(userRef, { name: value });
            else if (editingField === 'email') await updateDoc(userRef, { email: value });
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  headerDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 16 },
  subtitle: { fontSize: 13, opacity: 0.5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, borderRadius: 12, marginBottom: 16, height: 48 },
  searchContainerDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  searchBar: { flex: 1, height: '100%', fontSize: 15 },
  listContent: { paddingHorizontal: 16 },
  listContentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  userCard: {
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
  userCardDesktop: { flex: 1, margin: 8, minWidth: 350 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  userMainInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 13, opacity: 0.6, marginBottom: 4 },
  meBadge: { backgroundColor: 'rgba(46, 125, 50, 0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 8 },
  meBadgeText: { color: '#2E7D32', fontSize: 10, fontWeight: 'bold' },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: 'bold' },
  actionColumn: { 
    justifyContent: 'space-around', 
    marginLeft: 12, 
    paddingLeft: 12, 
    borderLeftWidth: 1, 
    borderLeftColor: 'rgba(0,0,0,0.05)' 
  },
  actionButton: { padding: 8 },
  fab: { position: 'absolute', right: 20, backgroundColor: '#1976D2', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 10 },
  fabDesktop: { flexDirection: 'row', width: 'auto', paddingHorizontal: 20, borderRadius: 15, height: 55 },
  fabLabel: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 }
});