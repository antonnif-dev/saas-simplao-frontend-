"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, deleteDoc, serverTimestamp, orderBy
} from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { maskCurrency, parseCurrencyToNumber } from "@/lib/utils";
import { getDoc } from "firebase/firestore";

export default function FinanceiroPage() {
  const { site } = useParams();
  const { user } = useAuth();

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayValor, setDisplayValor] = useState("");
  const [valorExibicao, setValorExibicao] = useState("");
  const [role, setRole] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCurrency(e.target.value);
    setValorExibicao(masked); // O que o usuário vê (R$ 150,00)

    const numeric = parseCurrencyToNumber(masked);
    setFormData({ ...formData, valor: numeric.toString() }); // O que o banco salva (150)
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = maskCurrency(rawValue);
    setDisplayValor(masked);

    // Converte "R$ 150,50" para o número 150.50 antes de guardar no estado do form
    const numericValue = Number(masked.replace(/\D/g, "")) / 100;
    setFormData({ ...formData, valor: numericValue.toString() });
  };

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "receita", // receita ou despesa
    data: new Date().toISOString().split('T')[0],
    categoria: "Sessão",
    pacienteId: "",
    pacienteNome: "",
    status: "pendente"
  });

  const [pacientes, setPacientes] = useState<any[]>([]);

  const fetchFinanceiro = async () => {
    if (!site) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "tenants", site, "financeiro"),
        orderBy("data", "desc")
      );
      const snap = await getDocs(q);
      setTransacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacientes = async () => {
    if (!site) return;

    const q = query(
      collection(db, "tenants", site, "pacientes"),
      where("tenantId", "==", site)
    );

    const snap = await getDocs(q);
    setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    async function loadData() {
      if (!site || !user?.uid) return;
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setRole(userSnap.data().role);
      }
      fetchFinanceiro();
      fetchPacientes();
    }
    loadData();
  }, [site, user]);

  const handleConfirmarPagamento = async (id: string) => {
    try {
      await updateDoc(doc(db, "tenants", site, "financeiro", id), {
        status: "confirmado",
        updatedAt: serverTimestamp()
      });
      fetchFinanceiro(); // Atualiza a lista visualmente
    } catch (error) {
      alert("Erro ao confirmar pagamento.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(
          doc(db, "tenants", site, "financeiro", editingId),
          {
            ...payload,
            updatedAt: serverTimestamp()
          }
        );
      } else {
        await addDoc(collection(db, "tenants", site, "financeiro"), {
          ...payload,
          tenantId: site,
          userId: user?.uid,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        descricao: "",
        valor: "",
        tipo: "receita",
        data: new Date().toISOString().split('T')[0],
        categoria: "Sessão",
        pacienteId: "",
        pacienteNome: "",
        status: "pendente"
      });
      fetchFinanceiro();
    } catch (error) {
      alert("Erro ao processar transação.");
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({
      descricao: t.descricao,
      valor: t.valor.toString(),
      tipo: t.tipo,
      data: t.data,
      categoria: t.categoria,
      pacienteId: t.pacienteId || "",
      pacienteNome: t.pacienteNome || "",
      status: t.status || "pendente"
    });
    // Opcional: Atualiza o display do valor formatado no modal ao abrir
    const formatado = formatCurrency(t.valor);
    setDisplayValor(formatado);

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Confirmar exclusão desta transação?")) {
      await deleteDoc(doc(db, "tenants", site, "financeiro", id));
      fetchFinanceiro();
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão Financeira</h2>
            <p className="text-slate-500 font-medium">Controle de receitas, despesas e fluxo de caixa.</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 hover:scale-105 transition-all"
          >
            + Novo Lançamento
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                {role === 'admin' && (
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                )}

                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Valor</th>
                {role === 'admin' && (
                  <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-400">A carregar...</td></tr>
              ) : (
                transacoes.map((t) => (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${t.status === 'pendente' ? 'opacity-40 grayscale' : ''}`}>
                    <td className="p-4 text-sm font-medium text-slate-500">
                      {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{t.descricao}</p>
                      <p className="text-[10px] uppercase font-black text-slate-300">{t.categoria}</p>
                    </td>
                    {role === 'admin' && (
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${t.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.tipo}
                        </span>
                      </td>
                    )}
                    <td className={`px-6 py-4 text-sm font-semibold ${role === 'admin'
                      ? (t.tipo === 'receita' ? 'text-green-600' : 'text-red-600') // Admin vê as cores originais
                      : 'text-red-600' // Paciente vê SEMPRE vermelho
                      }`}>
                      {/* Se NÃO for admin, adiciona o sinal de menos na frente */}
                      {role !== 'admin' && "- "}
                      {formatCurrency(t.valor)}
                    </td>
                    {role === 'admin' && (
                      <td className="p-4 text-right space-x-2">
                        {t.tipo === 'receita' && t.status === 'pendente' && (
                          <button
                            onClick={() => handleConfirmarPagamento(t.id)}
                            className="text-[10px] font-black uppercase bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                          >
                            Confirmar
                          </button>
                        )}
                        <button onClick={() => handleEdit(t)} className="hover:bg-slate-100 p-2 rounded-lg transition">✏️</button>
                        <button onClick={() => handleDelete(t.id)} className="hover:bg-red-50 p-2 rounded-lg transition">🗑️</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Financeiro */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">{editingId ? "Editar Lançamento" : "Novo Lançamento"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'receita' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.tipo === 'receita' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}>Receita</button>
                  <button type="button" onClick={() => setFormData({ ...formData, tipo: 'despesa' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.tipo === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>Despesa</button>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Descrição</label>
                  <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase">Vincular Paciente (Opcional)</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 font-bold text-slate-700"
                    value={formData.pacienteId}
                    onChange={e => {
                      const p = pacientes.find(item => item.id === e.target.value);
                      setFormData({ ...formData, pacienteId: e.target.value, pacienteNome: p?.nome || "" });
                    }}
                  >
                    <option value="">Nenhum (Lançamento Avulso)</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">Valor (R$)</label>
                    <input
                      type="text"
                      required
                      placeholder="R$ 0,00"
                      className="w-full p-4 pl-12 border border-slate-200 rounded-2xl font-bold"
                      value={displayValor}
                      onChange={handleValorChange}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase">Data</label>
                    <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 text-slate-500 font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black">Confirmar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}