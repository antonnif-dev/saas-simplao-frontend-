"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import SiteLayout from "./SiteLayout";
import Image from "next/image";

export default function DashboardPage() {
  const { site } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [verticalId, setVerticalId] = useState<string | null>(null);

  const [userData, setUserData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ pacientes: 0 });
  const [proximaConsulta, setProximaConsulta] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login`);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // Lógica para Psicólogo (Admin)
          if (data.role === "admin") {
            const qPacientes = query(collection(db, "tenants", site, "pacientes"), where("tenantId", "==", site));
            const snapPacientes = await getDocs(qPacientes);
            setStats({ pacientes: snapPacientes.size });
          }

          // Lógica para Paciente (Cliente) - BUSCA CONSULTA AGENDADA
          else {
            // CORREÇÃO AQUI: Agora buscamos pelo UID, igual na Agenda
            const qConsultas = query(
              collection(db, "tenants", site, "consultas"),
              where("tenantId", "==", site),
              where("pacienteUid", "==", user.uid),
              where("status", "==", "Agendada")
            );
            const snapConsultas = await getDocs(qConsultas);

            if (!snapConsultas.empty) {
              // Ordena manualmente pela data mais próxima se houver mais de uma
              const lista = snapConsultas.docs.map(d => d.data());
              // Converte string de data para objeto Date e ordena
              const ordenada = lista.sort((a, b) => {
                const dataA = new Date(`${a.data}T${a.horario}`);
                const dataB = new Date(`${b.data}T${b.horario}`);
                return dataA.getTime() - dataB.getTime();
              });

              // Pega a primeira que seja futura (opcional, mas boa prática) ou apenas a primeira da lista
              setProximaConsulta(ordenada[0]);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading, site, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- INTERFACE DO PSICÓLOGO (ADMIN) ---
  if (userData?.role === "admin") {
    return (
      <SiteLayout>
        <div className="space-y-8">
          <header>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Olá, Dr(a). {userData.nomeCompleto || "Psicólogo"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Bem-vindo à gestão da clínica {site}.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100 text-white">
              <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">Pacientes Ativos</span>
              <div className="text-4xl font-black mt-2">{stats.pacientes}</div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Ações Rápidas</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push(`/pacientes`)}
                className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
              >
                Gerir Pacientes
              </button>
              <button
                onClick={() => router.push(`/agenda`)}
                className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Ver Agenda
              </button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // --- INTERFACE DO PACIENTE (CLIENTE) ---
  return (
    <SiteLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          {/* Lógica: Se existir photoURL, exibe a Imagem. Senão, exibe a Inicial. */}
          {userData?.photoURL ? (
            <div className="mx-auto mb-4 h-20 w-20 relative">
              <Image
                src={userData.photoURL}
                alt="Foto de Perfil"
                width={80}
                height={80}
                className="h-20 w-20 rounded-3xl object-cover border-4 border-blue-50 shadow-md mx-auto"
              />
            </div>
          ) : (
            <div className="h-20 w-20 bg-blue-100 text-blue-600 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4 font-black border-4 border-white shadow-sm">
              {userData?.nomeCompleto?.charAt(0)}
            </div>
          )}

          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Olá, {userData?.nomeCompleto?.split(' ')[0]} {/* Exibe só o primeiro nome */}
          </h1>
          <p className="text-slate-500 font-medium mt-2">Este é o seu espaço de cuidado.</p>
        </header>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <h3 className="font-bold text-slate-700 mb-2 text-xl">Sua Próxima Sessão</h3>

          {proximaConsulta ? (
            <div className="py-8 bg-blue-50 rounded-2xl mb-6 border border-blue-100">
              <div className="text-3xl font-black text-blue-600">
                {new Date(proximaConsulta.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </div>
              <div className="text-lg font-bold text-slate-700 mt-1">
                às {proximaConsulta.horario}
              </div>
              <div className="inline-block mt-3 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg">
                Confirmada
              </div>
            </div>
          ) : (
            <div className="py-12 text-slate-400 italic bg-slate-50 rounded-2xl mb-6">
              Não há sessões agendadas no momento.
            </div>
          )}

          <button
            onClick={() => router.push(`/agenda`)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            Ver Minha Agenda
          </button>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => router.push('/documentos')}
            className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer"
          >
            <span className="block text-2xl mb-2">📄</span>
            <span className="font-bold text-slate-600 text-sm tracking-tight">Documentos</span>
          </div>
          <div
            onClick={() => router.push('/financeiro')}
            className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer"
          >
            <span className="block text-2xl mb-2">💰</span>
            <span className="font-bold text-slate-600 text-sm tracking-tight">Financeiro</span>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}