"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import SiteLayout from "../../SiteLayout"; // Ajustar o caminho conforme a estrutura de pastas

export default function FinanceiroPacientePage() {
    const { site } = useParams();
    const { user } = useAuth();

    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Formatação de Moeda fidedigna
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const fetchFinanceiroPaciente = async () => {
        if (!site || !user?.uid) return;

        try {
            setLoading(true);
            // Consulta filtrada rigorosamente pelo Paciente e pela Clínica (Tenant)
            const q = query(
                collection(db, "tenants", site, "financeiro"),
                where("tenantId", "==", site),
                where("pacienteId", "==", user.uid),
                orderBy("data", "desc")
            );

            const snap = await getDocs(q);
            const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransacoes(dados);
        } catch (error) {
            console.error("Erro ao carregar dados financeiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceiroPaciente();
    }, [site, user]);

    return (
        <SiteLayout>
            <div className="max-w-4xl mx-auto p-6">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">O Meu Histórico Financeiro</h1>
                    <p className="text-gray-600">Consulte aqui as suas sessões e o estado dos pagamentos.</p>
                </header>

                {loading ? (
                    <div className="flex justify-center p-10">
                        <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></span>
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição / Categoria</th>
                                    <th className="px-6 py-4">Valor</th>
                                    <th className="px-6 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transacoes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            Nenhum registo financeiro encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    transacoes.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {new Date(t.data).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{t.descricao}</div>
                                                <div className="text-xs text-gray-500">{t.categoria}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-red-600">
                                                - {formatCurrency(t.valor)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${t.status === 'confirmado'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {t.status === 'confirmado' ? 'Pago' : 'Aguardando Pagamento'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="mt-6 text-xs text-gray-400 text-right">
                    Informação atualizada em tempo real via sistema centralizado.
                </footer>
            </div>
        </SiteLayout>
    );
}