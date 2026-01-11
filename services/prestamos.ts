import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function crearPrestamo(data: {
  cliente: string;
  monto: number;
  fecha: string;
}) {
  await addDoc(collection(db, 'prestamos'), data);
}

export async function obtenerPrestamos() {
  const snapshot = await getDocs(collection(db, 'prestamos'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
