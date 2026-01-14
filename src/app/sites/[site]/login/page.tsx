"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link"; // Importado para navegação interna

export default function TenantLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicName, setClinicName] = useState<string>("");

  const { site } = useParams();
  const router = useRouter();

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
  }, []);

  useEffect(() => {
    async function fetchClinicData() {
      if (!site) return;
      try {
        const docRef = doc(db, "tenants", site as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClinicName(data.name || data.nomeClinica || site.toString());
        } else {
          setClinicName(site.toString().replace(/-/g, ' '));
        }
      } catch (error) {
        console.error("Erro ao buscar dados da clínica:", error);
      }
    }
    fetchClinicData();
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        alert("Perfil de usuário não configurado.");
        await auth.signOut();
        return;
      }

      const userData = userDoc.data();
      if (userData.tenantId === site) {
        //window.location.href = "/";
        window.location.href = `/sites/${tenantId}`;
      } else {
        alert("Acesso negado: Este usuário não pertence a esta unidade.");
        await auth.signOut();
      }
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

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
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