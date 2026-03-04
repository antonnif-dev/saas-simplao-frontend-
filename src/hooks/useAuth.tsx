"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 2️⃣ Validação roda quando user ou pathname mudar
  useEffect(() => {
    if (!user) return;

    const validateTenant = async () => {
      const segments = pathname.split("/");
      const tenantId = segments[2];

      if (!tenantId) return;

      try {
        const userRef = doc(db, "tenants", tenantId, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await signOut(auth);
          router.replace(`/sites/${tenantId}/login`);
          return;
        }

        const userData = userSnap.data();
        if (userData?.tenantId !== tenantId) {
          await signOut(auth);
          router.replace(`/sites/${tenantId}/login`);
        }

      } catch (err) {
        console.error("Erro ao validar tenantId:", err);
        await signOut(auth);
        router.replace(`/sites/${tenantId}/login`);
      }
    };

    validateTenant();
  }, [user, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);