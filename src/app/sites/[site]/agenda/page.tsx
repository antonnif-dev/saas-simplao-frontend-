"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, deleteDoc, serverTimestamp, orderBy, getDoc
} from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export default function AgendaPage() {
  const { site } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // Estado para o papel
  const [userName, setUserName] = useState<string>("");

  const [listaPacientes, setListaPacientes] = useState<any[]>([]);

  // Busca os pacientes cadastrados para popular o seletor
  const fetchPacientesParaSeletor = async () => {
    if (!site) return;
    try {
      const q = query(collection(db, "tenants", site, "pacientes"), where("tenantId", "==", site));
      const snap = await getDocs(q);

      // O spread ...d.data() já garante que o userUid venha junto, se existir na coleção pacientes
      setListaPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  };

  // Atualize o useEffect para disparar a busca
  useEffect(() => {
    if (!authLoading && user) {
      fetchConsultas();
      fetchPacientesParaSeletor(); // Adicionado aqui
    }
  }, [site, user, authLoading]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    pacienteNome: "",
    data: "",
    horario: "",
    status: "Agendada" // Padrão
  });

  const fetchConsultas = async () => {
    if (!site || !user) return;
    try {
      setLoading(true);

      const userSnap = await getDoc(doc(db, "users", user.uid));
      let userRole = "paciente";

      if (userSnap.exists()) {
        userRole = userSnap.data().role || "paciente";
        setRole(userRole);
        setUserName(userSnap.data().nomeCompleto || "");
      }

      let q;
      if (userRole === "admin") {
        // Admin vê tudo
        q = query(
          collection(db, "tenants", site, "consultas"),
          where("tenantId", "==", site),
          orderBy("data", "asc")
        );
      } else {
        // MUDANÇA PRINCIPAL: Paciente busca pelo SEU ID, não pelo nome.
        // Isso garante que mesmo mudando o nome no perfil, o histórico permanece.
        q = query(
          collection(db, "tenants", site, "consultas"),
          where("tenantId", "==", site),
          where("pacienteUid", "==", user.uid), // Busca pelo ID
          orderBy("data", "asc")
        );
      }

      const snap = await getDocs(q);
      setConsultas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error: any) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchConsultas();
    }
  }, [site, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Busca o objeto completo do paciente na lista para pegar o UID
      const pacienteEncontrado = listaPacientes.find(p => p.nome === formData.pacienteNome);

      const payload = {
        ...formData,
        pacienteEmail: pacienteEncontrado?.email || "",
        // MUDANÇA PRINCIPAL: Salvamos o ID do usuário (vinculado ao Auth) na consulta
        pacienteUid: pacienteEncontrado?.userUid || "",
        tenantId: site,
        userId: user?.uid, // ID de quem criou (Admin)
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(
          doc(db, "tenants", site, "consultas", editingId),
          payload
        );
      } else {
        await addDoc(collection(db, "tenants", site, "consultas"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ pacienteNome: "", data: "", horario: "", status: "Agendada" });
      fetchConsultas();
    } catch (error) {
      alert("Erro ao salvar agendamento.");
      console.error(error);
    }
  };

  const handleEdit = (consulta: any) => {
    setEditingId(consulta.id);
    setFormData({
      pacienteNome: consulta.pacienteNome,
      data: consulta.data,
      horario: consulta.horario,
      status: consulta.status || "Agendada"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este agendamento?")) {
      await deleteDoc(doc(db, "tenants", site, "consultas", id));
      fetchConsultas();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Realizada": return "bg-green-100 text-green-700";
      case "Faltou": return "bg-red-100 text-red-700";
      case "Cancelada": return "bg-slate-100 text-slate-500";
      default: return "bg-blue-100 text-blue-700"; // Agendada
    }
  };

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Clínica</h2>
            <p className="text-slate-500 font-medium">Gerencie seus horários e status de atendimento.</p>
          </div>
          {role === "admin" && (
            <button
              onClick={() => { setEditingId(null); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
            >
              + Novo Agendamento
            </button>
          )}
        </div>

        {/* Lista de Consultas */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center animate-pulse text-slate-400">Carregando...</td></tr>
              ) : consultas.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Nenhum horário marcado.</td></tr>
              ) : (
                consultas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-bold text-slate-700">{c.pacienteNome}</td>
                    <td className="p-4 text-sm text-slate-500 font-medium">
                      {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {c.horario}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(c.status)}`}>
                        {c.status || "Agendada"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {role === "admin" && ( // Apenas admin vê estes botões
                        <>
                          <button onClick={() => handleEdit(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition">✏️</button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de Cadastro/Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-6">
                {editingId ? "Editar Agendamento" : "Novo Agendamento"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                  <select
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.pacienteNome}
                    onChange={e => setFormData({ ...formData, pacienteNome: e.target.value })}
                  >
                    <option value="">Selecione um paciente...</option>
                    {listaPacientes.map(p => (
                      <option key={p.id} value={p.nome}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">Data</label>
                    <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1"
                      value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">Horário</label>
                    <input type="time" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1"
                      value={formData.horario} onChange={e => setFormData({ ...formData, horario: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Status da Sessão</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 font-bold text-slate-700"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Agendada">Agendada</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Faltou">Faltou</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition">Descartar</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-100">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}