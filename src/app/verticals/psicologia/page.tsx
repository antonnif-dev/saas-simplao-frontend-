"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

export default function TratamentoPage() {
  const { site } = useParams();

  const [tratamentos, setTratamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);

  const [form, setForm] = useState({
    pacienteId: "",
    abordagem: "",
    frequencia: "",
    intervencoes: "",
    planoInicial: "",
    planoExecutado: "",
    ajustes: "",
  });

  async function carregarPacientes() {
    const snap = await getDocs(
      collection(db, "tenants", site as string, "pacientes")
    );
    setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function carregarTratamentos() {
    const snap = await getDocs(collection(db, "tenants", site, "tratamentos"));
    setTratamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function criarTratamento() {
    await addDoc(collection(db, "tenants", site, "tratamentos"), {
      tenantId: site,
      pacienteId: form.pacienteId,
      abordagem: form.abordagem,
      frequencia: form.frequencia,
      intervencoes: form.intervencoes,
      planoInicial: form.planoInicial,
      planoExecutado: form.planoExecutado,
      ajustes: form.ajustes,
      status: "planejado",
      createdAt: serverTimestamp(),
    });

    setForm({
      pacienteId: "",
      abordagem: "",
      frequencia: "",
      intervencoes: "",
      planoInicial: "",
      planoExecutado: "",
      ajustes: "",
    });

    carregarTratamentos();
  }

  async function vincularPaciente(tratamentoId: string, pacienteId: string) {
    await updateDoc(doc(db, "tenants", site, "tratamentos", tratamentoId), {
      pacienteId,
    });
  }

  async function adicionarEtapa(tratamentoId: string) {
    await addDoc(
      collection(db, "tenants", site, "tratamentos", tratamentoId, "etapas"),
      {
        titulo: "Nova etapa",
        status: "pendente",
        observacao: "",
        createdAt: Timestamp.now(),
      }
    );
  }

  async function concluirEtapa(tratamentoId: string, etapaId: string) {
    await updateDoc(
      doc(db, "tenants", site, "tratamentos", tratamentoId, "etapas", etapaId),
      { status: "concluida" }
    );
  }

  useEffect(() => {
    if (site) {
      carregarPacientes();
      carregarTratamentos();
    }
  }, [site]);

  return (
    <div className="space-y-10 max-w-3xl">
      <h1 className="text-2xl font-bold">Tratamento</h1>

      {/* FORMULÁRIO */}
      <div className="space-y-4 border p-4 rounded">
        {/* PACIENTE */}
        <select
          className="w-full border p-2"
          value={form.pacienteId}
          onChange={e =>
            setForm({ ...form, pacienteId: e.target.value })
          }
        >
          <option value="">Selecione o paciente</option>
          {pacientes.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <input
          placeholder="Abordagem (TCC, Psicanálise...)"
          className="w-full border p-2"
          value={form.abordagem}
          onChange={e =>
            setForm({ ...form, abordagem: e.target.value })
          }
        />

        <input
          placeholder="Frequência planejada"
          className="w-full border p-2"
          value={form.frequencia}
          onChange={e =>
            setForm({ ...form, frequencia: e.target.value })
          }
        />

        <textarea
          placeholder="Intervenções previstas"
          className="w-full border p-2"
          value={form.intervencoes}
          onChange={e =>
            setForm({ ...form, intervencoes: e.target.value })
          }
        />

        <textarea
          placeholder="Plano inicial"
          className="w-full border p-2"
          value={form.planoInicial}
          onChange={e =>
            setForm({ ...form, planoInicial: e.target.value })
          }
        />

        <textarea
          placeholder="Plano executado"
          className="w-full border p-2"
          value={form.planoExecutado}
          onChange={e =>
            setForm({ ...form, planoExecutado: e.target.value })
          }
        />

        <textarea
          placeholder="Ajustes ao longo do tempo"
          className="w-full border p-2"
          value={form.ajustes}
          onChange={e =>
            setForm({ ...form, ajustes: e.target.value })
          }
        />

        <button
          onClick={criarTratamento}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Salvar Tratamento
        </button>
      </div>

      {/* LISTAGEM */}
      {tratamentos.map(t => (
        <TratamentoCard
          key={t.id}
          tratamento={t}
          pacientes={pacientes}
          onAddEtapa={adicionarEtapa}
          onConcluirEtapa={concluirEtapa}
          onVincularPaciente={vincularPaciente}
        />
      ))}
    </div>
  );

  function TratamentoCard({
    tratamento,
    pacientes,
    onAddEtapa,
    onConcluirEtapa,
    onVincularPaciente,
  }: any) {
    const [etapas, setEtapas] = useState<any[]>([]);

    async function carregarEtapas() {
      const snap = await getDocs(
        collection(db, "tenants", site, "tratamentos", tratamento.id, "etapas")
      );
      setEtapas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    useEffect(() => {
      carregarEtapas();
    }, []);

    return (
      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">{tratamento.abordagem}</h2>

        {/* PACIENTE */}
        <select
          className="w-full border p-1"
          value={tratamento.pacienteId || ""}
          onChange={e =>
            onVincularPaciente(tratamento.id, e.target.value)
          }
        >
          <option value="">Paciente não definido</option>
          {pacientes.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <p>Frequência: {tratamento.frequencia}</p>

        <button
          onClick={() => onAddEtapa(tratamento.id)}
          className="text-sm underline"
        >
          + Nova etapa
        </button>

        <div className="space-y-2">
          {etapas.map(e => (
            <div
              key={e.id}
              className="flex justify-between border p-2 rounded"
            >
              <span>{e.titulo}</span>
              {e.status === "pendente" && (
                <button
                  onClick={() =>
                    onConcluirEtapa(tratamento.id, e.id)
                  }
                  className="text-xs"
                >
                  Concluir
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
