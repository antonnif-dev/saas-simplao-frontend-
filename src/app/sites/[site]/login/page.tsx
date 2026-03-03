"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link"; // Importado para navegação interna

export default function TenantLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicName, setClinicName] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [site, setSite] = useState<string | null>(null);

  const getTenantFromHost = async () => {
    const host = window.location.hostname;

    const q = query(
      collection(db, "tenants"),
      where("customDomain", "==", host)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs[0].id;
    }

    return null;
  };

  const router = useRouter();

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
  }, []);

  useEffect(() => {
    async function resolveTenant() {
      const resolvedSite = await getTenantFromHost();
      setSite(resolvedSite);
    }

    resolveTenant();
  }, []);

  useEffect(() => {
    if (!site) return;

    async function fetchClinicData() {
      try {
        const docRef = doc(db, "tenants", site);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setClinicName(data.name || data.nomeClinica || site);
        } else {
          setClinicName(site.replace(/-/g, " "));
        }
      } catch (error) {
        console.error("Erro ao buscar dados da clínica:", error);
      }
    }

    fetchClinicData();
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (!site) {
      alert("Tenant inválido.");
      return;
    }
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!site) {
        alert("Tenant inválido.");
        await auth.signOut();
        return;
      }
      console.log("SITE:", site);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("UID:", userCredential.user.uid);
      console.log("SITE:", site);
      const userRef = doc(db, "tenants", site, "users", userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        alert("Perfil de usuário não configurado.");
        await auth.signOut();
        return;
      }

      const userData = userDoc.data();
      const tenantId = userData.tenantId;

      if (site && tenantId !== site) {
        alert("Acesso negado: Este usuário não pertence a esta unidade.");
        await auth.signOut();
        return;
      }

      const isLocal = window.location.hostname.includes("localhost");
      document.cookie = `tenant=${tenantId}; Path=/; SameSite=Lax${isLocal ? "" : "; Secure"}`;

      window.location.href = `/sites/${tenantId}`;
    } catch (error) {
      alert("E-mail ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-10 bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200 mb-6">
              Ψ
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
              Portal de Acesso
            </h1>
            <p className="text-blue-600 font-bold uppercase tracking-widest text-sm">
              {clinicName || "Carregando unidade..."}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            <div className="relative">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-4 top[42px] text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-7-9-7a16.77 16.77 0 013.06-3.79M6.88 6.88A9.956 9.956 0 0112 5c5 0 9 7 9 7a16.77 16.77 0 01-4.11 4.88M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 6L3 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0s-4 7-9 7-9-7-9-7 4-7 9-7 9 7 9 7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black mt-8 hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {isLoading ? "Validando..." : "Entrar no Sistema"}
          </button>

          {/* BOTÃO DE CADASTRO ADICIONADO ABAIXO */}
          <div className="mt-6 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm mb-4">Ainda não tem uma conta?</p>
            <Link
              href={`/cadastro`}
              className="inline-block w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Criar Conta Grátis
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">
              Segurança Multi-Tenant Ativa
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}