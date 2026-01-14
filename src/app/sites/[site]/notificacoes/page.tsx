"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export default function NotificacoesPage() {
  const { site } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = async () => {
    if (!site) return;
    try {
      setLoading(true);
      // Busca notificações específicas deste tenant, ordenadas pelas mais recentes
      const q = query(
        collection(db, "tenants", site as string, "notificacoes"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setNotificacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error: any) {
      console.error("Erro ao carregar notificações:", error.message);
      // Lembre-se de criar o índice composto no Firebase se o console solicitar
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      const docRef = doc(db, "tenants", site as string, "notificacoes", id);
      await updateDoc(docRef, { lida: true });
      // Atualiza o estado local para refletir a mudança visualmente
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user && site) {
      fetchNotificacoes();
    } else if (!user) {
      router.push("/login");
    }
  }, [authLoading, user, site]);

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Alertas</h2>
            <p className="text-slate-500 font-medium">Fique por dentro das atualizações da sua unidade.</p>
          </div>
          <button
            onClick={fetchNotificacoes}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            title="Atualizar"
          >
            🔄
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 font-medium">
              Sincronizando alertas...
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs">Tudo limpo por aqui</p>
              <p className="text-slate-500 mt-2">Você não possui notificações pendentes no momento.</p>
            </div>
          ) : (
            notificacoes.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.lida && marcarComoLida(notif.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer group relative ${notif.lida
                    ? 'bg-white border-slate-100 opacity-70'
                    : 'bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md'
                  }`}
              >
                {!notif.lida && (
                  <span className="absolute top-6 right-6 h-2 w-2 bg-blue-600 rounded-full"></span>
                )}

                <div className="flex items-start gap-4">
                  <div className={`text-xl p-3 rounded-xl ${notif.prioridade === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                    {notif.prioridade === 'warning' ? '⚠️' : 'ℹ️'}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold ${notif.lida ? 'text-slate-700' : 'text-blue-900'}`}>
                        {notif.titulo}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {notif.createdAt?.seconds
                          ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString()
                          : 'Recentemente'}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.lida ? 'text-slate-500' : 'text-blue-800'}`}>
                      {notif.mensagem}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SiteLayout>
  );
}