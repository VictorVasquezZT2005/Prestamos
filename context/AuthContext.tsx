import { auth, db } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'admin' | 'user';

type AuthUser = {
  uid: string;
  email: string | null;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!snap.exists()) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: snap.data().role,
      });

      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
