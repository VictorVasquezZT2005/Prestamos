import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error('Usuario sin rol asignado');
  }

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    role: snap.data().role as 'admin' | 'user',
  };
}
