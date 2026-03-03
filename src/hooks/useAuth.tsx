"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const segments = pathname.split("/");
      const tenantId = segments[2];

      if (!tenantId) {
        setUser(firebaseUser);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "tenants", tenantId, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn("Usuário não encontrado no tenant atual.");
          await signOut(auth);
          router.push(`/sites/${tenantId}/login`);
          return;
        }

        const userData = userSnap.data();
        if (userData?.tenantId !== tenantId) {
          console.warn("Usuário pertence a outro tenant.");
          await signOut(auth);
          router.push(`/sites/${tenantId}/login`);
          return;
        }

        setUser(firebaseUser);
      } catch (err) {
        console.error("Erro ao validar tenantId:", err);
        await signOut(auth);
        router.push(`/sites/${tenantId}/login`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);