"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import Link from "next/link";

export default function CadastroPage() {
  const { site } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: ""
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Verifica se existe convite válido
      const q = query(
        collection(db, "tenants", site, "pacientes"),
        where("email", "==", formData.email),
        where("hasAccess", "==", true)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Este e-mail não foi autorizado pela clínica.");
        setLoading(false);
        return;
      }

      const pacienteDoc = snap.docs[0];
      const pacienteData = pacienteDoc.data();

      // 2️⃣ Cria usuário no Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      const newUser = userCredential.user;

      // 3️⃣ Cria perfil do usuário
      await setDoc(doc(db, "users", newUser.uid), {
        nomeCompleto: formData.nome,
        email: formData.email,
        tenantId: site,
        role: "paciente",
        createdAt: serverTimestamp(),
        status: "ativo"
      });

      // 4️⃣ Vincula Auth ↔ Paciente
      await updateDoc(pacienteDoc.ref, {
        nome: formData.nome,
        userUid: newUser.uid,
        status: "ativo",
        updatedAt: serverTimestamp()
      });

      router.push("/");

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      alert("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Criar Conta</h2>
        <p className="text-slate-500 mb-8 font-medium">Cadastre-se para acessar a plataforma da unidade <span className="uppercase text-blue-600 font-bold">{site}</span></p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Nome Completo</label>
            <input
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase ml-1">E-mail</label>
            <input
              type="email"
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Senha</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setFormData({ ...formData, senha: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Finalizar Cadastro"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Já tem uma conta? <Link href="/login" className="text-blue-600 font-bold">Entrar</Link>
        </p>
      </div>
    </div>
  );
}