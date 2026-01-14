"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, deleteDoc, serverTimestamp, orderBy
} from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export default function ProntuariosPage() {
  const { site } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [registros, setRegistros] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para o Modal de Nova Evolução
  const [showModal, setShowModal] = useState(false);
  const [newEvolucao, setNewEvolucao] = useState({
    pacienteNome: "",
    texto: ""
  });

  const [pacientes, setPacientes] = useState<any[]>([]);

  const fetchPacientes = async () => {
    if (!site) return;
    try {
      const q = query(collection(db, "tenants", site, "pacientes"), where("tenantId", "==", site));
      const snap = await getDocs(q);
      setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Erro ao carregar lista de pacientes:", error);
    }
  };

  const loadProntuarios = async () => {
    if (!site) return;
    try {
      setDataLoading(true);
      const q = query(
        collection(db, "tenants", site, "prontuarios"),
        where("tenantId", "==", site),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setRegistros(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      console.error("Erro ao carregar prontuários:", error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveEvolucao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !user) return;

    try {
      const payload = {
        ...newEvolucao,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        // MODO EDIÇÃO
        await updateDoc(doc(db, "tenants", site, "prontuarios", editingId), payload);
      } else {
        // MODO CRIAÇÃO
        await addDoc(collection(db, "tenants", site, "prontuarios"), {
          ...payload,
          tenantId: site,
          psicologoId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      setShowModal(false);
      setEditingId(null);
      setNewEvolucao({ pacienteNome: "", texto: "" });
      loadProntuarios();
    } catch (error: any) {
      alert("Erro ao processar operação.");
    }
  };

  // Função para abrir modal em modo edição
  const handleEditClick = (reg: any) => {
    setEditingId(reg.id);
    setNewEvolucao({
      pacienteNome: reg.pacienteNome,
      texto: reg.texto
    });
    setShowModal(true);
  };

  // Função para Excluir
  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este registro de prontuário? Esta ação é irreversível.")) {
      try {
        await deleteDoc(doc(db, "tenants", site, "prontuarios", id));
        loadProntuarios();
      } catch (error) {
        alert("Erro ao excluir registro.");
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user && site) {
      loadProntuarios();
      fetchPacientes();
    } else if (!user) {
      router.push(`/login`);
    }
  }, [authLoading, user, site]);

  return (
    <SiteLayout>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-800">Prontuários e Evoluções</h2>
          <button
            onClick={() => {
              setEditingId(null);
              setNewEvolucao({ pacienteNome: "", texto: "" });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95"
          >
            + Nova Evolução
          </button>
        </div>

        <div className="space-y-6">
          {authLoading || dataLoading ? (
            <div className="py-20 text-center text-slate-500 animate-pulse font-medium">
              Sincronizando prontuários...
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 italic font-medium">Nenhum registro encontrado para esta unidade.</p>
            </div>
          ) : (
            registros.map((reg) => (
              <div key={reg.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Paciente</span>
                    <span className="font-bold text-slate-800 text-lg">{reg.pacienteNome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-3 py-1 bg-slate-200 text-slate-600 rounded-full">
                      {reg.createdAt?.seconds
                        ? new Date(reg.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                        : "Salvando..."}
                    </span>
                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(reg)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Evolução"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(reg.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Registro"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{reg.texto}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE NOVA EVOLUÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">
              {editingId ? "Editar Evolução" : "Nova Evolução de Prontuário"}
            </h3>
            <form onSubmit={handleSaveEvolucao} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Paciente</label>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Paciente</label>
                  <select
                    required
                    className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white font-medium text-slate-700"
                    value={newEvolucao.pacienteNome}
                    onChange={e => setNewEvolucao({ ...newEvolucao, pacienteNome: e.target.value })}
                  >
                    <option value="">Selecione um paciente cadastrado</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Texto da Evolução</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Descreva o atendimento, técnicas utilizadas e observações..."
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  value={newEvolucao.texto}
                  onChange={e => setNewEvolucao({ ...newEvolucao, texto: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  {editingId ? "Salvar Alterações" : "Salvar Evolução"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}