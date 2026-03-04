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

  // 🔹 AUTH STATE
  useEffect(() => {
    console.log("====================================");
    console.log("[AUTH-1] Registrando onAuthStateChanged");

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("[AUTH-2] onAuthStateChanged disparou");
      console.log("[AUTH-3] firebaseUser:", firebaseUser?.uid || null);

      setUser(firebaseUser);
      setLoading(false);

      console.log("[AUTH-4] loading definido como false");
    });

    return () => {
      console.log("[AUTH-5] unsubscribe auth listener");
      unsubscribe();
    };
  }, []);

  // 🔹 VALIDAÇÃO DE TENANT
  useEffect(() => {
    console.log("====================================");
    console.log("[AUTH-6] useEffect validação disparado");
    console.log("[AUTH-7] pathname:", pathname);
    console.log("[AUTH-8] user:", user?.uid || null);
    console.log("[AUTH-9] loading:", loading);

    if (!user) {
      console.log("[AUTH-10] Abortando validação: user é null");
      return;
    }

    const validateTenant = async () => {
      console.log("[AUTH-11] Iniciando validateTenant");

      const segments = pathname.split("/");
      console.log("[AUTH-12] segments:", segments);

      const tenantId = segments[2];
      console.log("[AUTH-13] tenantId extraído:", tenantId);

      if (!tenantId) {
        console.log("[AUTH-14] Nenhum tenantId encontrado → saindo");
        return;
      }

      try {
        console.log(
          "[AUTH-15] Buscando no Firestore:",
          `tenants/${tenantId}/users/${user.uid}`
        );

        const userRef = doc(db, "tenants", tenantId, "users", user.uid);
        const userSnap = await getDoc(userRef);

        console.log("[AUTH-16] userSnap.exists():", userSnap.exists());

        if (!userSnap.exists()) {
          console.log("[AUTH-17] Usuário NÃO encontrado no tenant");
          console.log("[AUTH-18] Executando signOut");
          await signOut(auth);

          console.log("[AUTH-19] Redirecionando para login");
          router.replace(`/sites/${tenantId}/login`);
          return;
        }

        const userData = userSnap.data();
        console.log("[AUTH-20] userData:", userData);
        console.log("[AUTH-21] userData.tenantId:", userData?.tenantId);

        if (userData?.tenantId !== tenantId) {
          console.log("[AUTH-22] tenantId divergente");
          console.log("[AUTH-23] Executando signOut");
          await signOut(auth);

          console.log("[AUTH-24] Redirecionando para login");
          router.replace(`/sites/${tenantId}/login`);
        }

        console.log("[AUTH-25] Validação concluída com sucesso");
      } catch (err) {
        console.error("[AUTH-26] Erro ao validar tenantId:", err);

        console.log("[AUTH-27] Executando signOut (catch)");
        await signOut(auth);

        console.log("[AUTH-28] Redirecionando para login (catch)");
        router.replace(`/sites/${tenantId}/login`);
      }
    };

    validateTenant();
  }, [user, pathname, router, loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);