"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export default function PatientsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const { site } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [patients, setPatients] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [editName, setEditName] = useState("");

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("Documento");

  const [listaPacientes, setListaPacientes] = useState<any[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const currentPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatientId) {
      handleSubmit(e);
      return;
    }
    if (!newName || !newEmail || !site || !user) return;
    setIsCreating(true);
    try {
      await addDoc(collection(db, "tenants", site, "pacientes"), {
        nome: newName,
        email: newEmail,
        tenantId: site,
        criadoPor: user.uid,
        createdAt: serverTimestamp(),
        hasAccess: true
      });

      await addDoc(collection(db, "notificacoes"), {
        tenantId: site,
        titulo: "Novo Acesso Criado",
        mensagem: `O acesso para ${newName} (${newEmail}) foi preparado.`,
        prioridade: "success",
        lida: false,
        createdAt: serverTimestamp()
      });

      alert(`Paciente registrado! Instrua o paciente a se cadastrar com o e-mail: ${newEmail}`);
      setNewName("");
      setNewEmail("");
      setShowModal(false);
      fetchPacientes();
    } catch (error: any) {
      alert("Erro ao cadastrar paciente.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      await updateDoc(doc(db, "tenants", site, "pacientes", editingPatient.id), {
        nome: editName
      });
      setEditingPatient(null);
      fetchPacientes();
    } catch (error) {
      alert("Erro ao atualizar nome.");
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este paciente? Todos os dados vinculados permanecerão no banco, mas o paciente perderá o acesso e não aparecerá mais nesta lista.")) return;

    try {
      await deleteDoc(doc(db, "tenants", site, "pacientes", id));
      fetchPacientes(); // Atualiza a lista imediatamente
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir paciente.");
    }
  };

  const fetchPacientes = async () => {
    if (!site) return;
    try {
      // Remova o setDataLoading(true) se não quiser o efeito de pulso toda hora
      const q = query(collection(db, "tenants", site, "pacientes"), where("tenantId", "==", site));
      const snap = await getDocs(q);
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ESTA É A LINHA QUE FAZ O SELECT FUNCIONAR:
      setPatients(dados);
      setListaPacientes(dados);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleOpenCloudinary = () => {
    if (!selectedPatient) return;

    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET,
        sources: ["local", "url", "camera"],
        resourceType: "auto",
        multiple: false,
        theme: "minimal",
        language: "pt", // Melhora a UX para o psicólogo brasileiro
      },
      async (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const fileUrl = result.info.secure_url;
          const fileName = result.info.original_filename;
          await saveDocumentToFirestore(fileUrl, fileName);
        }
      }
    );
    widget.open();
  };

  const saveDocumentToFirestore = async (url: string, title: string) => {
    try {
      await addDoc(collection(db, "tenants", site as string, "documentos"), {
        tenantId: site,
        titulo: docTitle || title,
        url,
        tipo: docType,

        pacienteUid: selectedPatient.userUid,
        pacienteNome: selectedPatient.nome,
        pacienteEmail: selectedPatient.email,

        criadoPor: user?.uid,
        createdAt: serverTimestamp(),
      }
      );
      alert("Documento enviado e salvo com sucesso!");
      setShowDocModal(false);
    } catch (err) {
      console.error("Erro ao salvar no banco:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !site || !user) return;

    try {
      await addDoc(collection(db, "pacientes"), {
        pacienteId: selectedPatientId, // A CHAVE MESTRA
        pacienteNome: newName,         // Mantemos apenas para exibição rápida (cache)
        pacienteEmail: newEmail,
        tenantId: site,
        criadoPor: user.uid,
        createdAt: serverTimestamp(),
        status: "Agendada"
        // Adicione aqui os campos de data/hora se o seu modal os tiver
      });

      alert("Sessão agendada com sucesso!");
      setShowModal(false);
      setSelectedPatientId("");
      setNewName("");
      setNewEmail("");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user && site) {
      fetchPacientes();
    } else if (!user) {
      router.push(`/login`);
    }
  }, [authLoading, user, site]);

  return (
    <SiteLayout>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Pacientes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
          >
            + Convidar Paciente
          </button>
        </div>

        <div className="space-y-3">
          {dataLoading ? (
            <div className="py-10 text-center text-slate-400 animate-pulse font-medium">Buscando base de pacientes...</div>
          ) : patients.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nenhum paciente cadastrado nesta unidade.</p>
            </div>
          ) : (
            /* CORREÇÃO: Removida a chave { extra aqui */
            patients.map(p => (
              <div key={p.id} className="p-5 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                    {p.nome?.charAt(0)}
                  </div>
                  <div>
                    {editingPatient?.id === p.id ? (
                      <form onSubmit={handleUpdateName} className="flex gap-2">
                        <input
                          className="border border-blue-300 px-2 py-1 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="text-[10px] font-bold text-green-600 uppercase">Salvar</button>
                        <button type="button" onClick={() => setEditingPatient(null)} className="text-[10px] font-bold text-red-400 uppercase">Sair</button>
                      </form>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 block text-lg">{p.nome}</span>
                        <span className="text-xs text-slate-400 font-medium">{p.email}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingPatient(p); setEditName(p.nome); }}
                    className="text-slate-400 hover:text-blue-600 p-2 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeletePatient(p.id)}
                    className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                    title="Excluir Paciente"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => router.push(`/prontuarios?paciente=${p.nome}`)}
                    className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Prontuário
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setShowDocModal(true);
                    }}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Enviar Doc
                  </button>
                </div>
              </div>
            ))
            /* CORREÇÃO: Removida a chave } extra aqui */
          )}
        </div>
      </div>

      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Enviar Documento</h3>
            <p className="text-slate-500 text-sm mb-6">Para: <strong>{selectedPatient?.nome}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título (Opcional)</label>
                <input
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome amigável do arquivo"
                  onChange={e => setDocTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 outline-none"
                  onChange={e => setDocType(e.target.value)}
                >
                  <option value="Documento">Documento</option>
                  <option value="Recibo">Recibo</option>
                  <option value="Exame">Exame/Relatório</option>
                </select>
              </div>

              {/* BOTÃO CLOUDINARY */}
              <button
                type="button"
                onClick={handleOpenCloudinary}
                className="w-full py-8 border-2 border-dashed border-blue-200 rounded-3xl text-blue-600 font-bold hover:bg-blue-50 transition-all flex flex-col items-center gap-2"
              >
                <span className="text-3xl">📤</span>
                Selecionar Ficheiro do Dispositivo
              </button>

              <button
                onClick={() => setShowDocModal(false)}
                className="w-full p-4 text-slate-400 font-bold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Convidar Paciente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Convidar Paciente</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Isso criará o registro clínico e preparará o acesso do usuário.</p>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nome do Paciente
                </label>
                <input
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Digite o nome completo"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    // Limpa o ID de seleção para garantir que o handleAddPatient 
                    // entenda que é um novo registro manual
                    if (selectedPatientId) setSelectedPatientId("");
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail do Paciente</label>
                <input
                  type="email"
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-1"
                  placeholder="paciente@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black">
                  {isCreating ? "Registrando..." : "Convidar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}