"use client";

import React, { useState, useEffect } from 'react';
//import { auth, db } from "@/lib/firebase";
//import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
//import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function LoginPage() {
  //const [email, setEmail] = useState('');
  //const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /*
    useEffect(() => {
      // Remova a referência a 'site' aqui dentro
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          console.log("Usuário detectado na raiz.");
        }
      });
      return () => unsubscribe();
    }, []);
  */
  /* Somente localhost:3000 funcionando
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const tenantId = userDoc.data().tenantId;
        // Redireciona para o subdomínio
        window.location.href = `http://${tenantId}.localhost:3000`;
      }
    } catch (error) {
      alert("Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };
*/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const tenantId = userDoc.data().tenantId;

        const { protocol, hostname, port } = window.location;

        const isLocal = hostname.includes("localhost");
        document.cookie = `tenant=${tenantId}; Path=/; SameSite=Lax${isLocal ? "" : "; Secure"}`;

        if (isLocal) {
          window.location.href = `${protocol}//${tenantId}.localhost:${port}`;
          return;
        }

        window.location.href = `${protocol}//${hostname}/sites/${tenantId}`;
        return;
      }
    } catch (error) {
      alert("Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">

        {/* LOGO E TÍTULO */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <span className="text-white font-bold text-2xl">Ψ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">PsiSaaS</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Gestão inteligente para consultórios
          </p>
        </div>



        {/* FORMULÁRIO */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/*
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-1"
                placeholder="exemplo@dominio.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </div>
          */}
          <div className="space-y-4 mt-8">

            <Link
              href="/sites/clinica-teste/login"
              className="block w-full text-center py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition"
            >
              Entrar na Clínica de Psicologia (Demo)
            </Link>

            <Link
              href="/sites/advocacia-teste/login"
              className="block w-full text-center py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition"
            >
              Entrar na Advocacia (Demo)
            </Link>

            <Link
              href="/sites/personal-teste/login"
              className="block w-full text-center py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition"
            >
              Entrar no Personal Trainer (Demo)
            </Link>

          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-slate-400">
            Ambiente Seguro com Criptografia de Ponta
          </p>
        </div>
      </div>
    </div>
  );
}