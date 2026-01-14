"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export default function DocumentosPage() {
  const { site } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para controlar qual documento está aberto no modal
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const fetchDocumentos = async () => {
    if (!site || !user?.email) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "tenants", site, "documentos"),
        where("pacienteUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error: any) {
      console.error("Erro ao buscar documentos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchDocumentos();
  }, [authLoading, user, site]);

  // --- FUNÇÃO ÚNICA DE RENDERIZAÇÃO (Leitor Universal) ---
  const renderDocContent = (url: string) => {
    // Limpa a URL para garantir que pegamos a extensão correta
    const cleanUrl = url.split('?')[0].toLowerCase();

    // 1. Verifica se é PDF
    if (cleanUrl.endsWith('.pdf')) {
      return (
        <object
          data={url}
          type="application/pdf"
          className="w-full h-full bg-slate-100 rounded-b-2xl"
        >
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
            <p>Seu navegador não suporta visualização direta.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
            >
              Baixar PDF
            </a>
          </div>
        </object>
      );
    }

    // 2. Verifica se é Arquivo Office (Word, Excel, PowerPoint)
    // Usa o Google Docs Viewer para exibir sem precisar baixar
    if (cleanUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/)) {
      const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <iframe
          src={googleDocsUrl}
          className="w-full h-full rounded-b-2xl bg-white border-0"
          title="Visualizador Office"
          loading="lazy"
        />
      );
    }

    // 3. Padrão: Imagem
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Visualização do documento"
        className="w-full h-full object-contain bg-slate-900 rounded-b-2xl"
      />
    );
  };

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Meus Documentos</h2>
          <p className="text-slate-500 font-medium">Acesse recibos, orientações e materiais compartilhados.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">
              Sincronizando arquivos...
            </div>
          ) : docs.length === 0 ? (
            <div className="col-span-2 p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
              <span className="text-4xl block mb-4">📂</span>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum documento disponível</p>
              <p className="text-slate-500 mt-2">Seu psicólogo ainda não compartilhou arquivos com você.</p>
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-50 transition-colors">
                    {doc.tipo === 'Recibo' ? '💰' : '📄'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{doc.titulo}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {doc.tipo} • {doc.createdAt?.seconds ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() : 'Recentemente'}
                    </p>
                  </div>
                </div>

                {/* Botão para abrir o Modal */}
                <button
                  onClick={() => setViewingDoc(doc)}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-900 hover:text-white transition-all"
                >
                  ABRIR
                </button>
              </div>
            ))
          )}
        </div>

        {/* Informação de Segurança */}
        <div className="mt-12 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4 items-center">
          <span className="text-2xl">🛡️</span>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            Seus documentos são criptografados e apenas você e seu profissional responsável têm acesso a estes arquivos dentro da plataforma.
          </p>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xl">📄</span>
                <h3 className="font-bold text-slate-700 truncate max-w-md" title={viewingDoc.titulo}>
                  {viewingDoc.titulo}
                </h3>
              </div>

              <div className="flex gap-2 shrink-0">
                <a
                  href={viewingDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center gap-2"
                >
                  <span>⬇️</span> Baixar
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition"
                >
                  Fechar (ESC)
                </button>
              </div>
            </div>

            {/* Área de Conteúdo */}
            <div className="flex-1 bg-slate-200 overflow-hidden relative w-full">
              {renderDocContent(viewingDoc.url)}
            </div>
          </div>
        </div>
      )}

    </SiteLayout>
  );
}