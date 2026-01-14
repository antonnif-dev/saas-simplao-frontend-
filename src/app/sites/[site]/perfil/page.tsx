"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import SiteLayout from "../SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
};

export default function PerfilPage() {
  const { site } = useParams();
  const { user, loading: authLoading } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const layoutFileRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutText, setLayoutText] = useState("");

  const [formData, setFormData] = useState({
    nomeCompleto: "",
    telefone: "",
    crp: "",
    bio: "",
    photoURL: "" // Novo campo
  });

  const fetchUserProfile = async () => {
    if (!user) return;
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFormData({
        nomeCompleto: data.nomeCompleto || "",
        telefone: data.telefone || "",
        crp: data.crp || "",
        bio: data.bio || "",
        photoURL: data.photoURL || ""
      });
    }
  };

  const fetchLayout = async () => {
    if (!site) return;

    const snap = await getDoc(doc(db, "layouts", String(site)));
    if (!snap.exists()) return;

    const data = snap.data();
    setLayoutImage(data.image || null);
    setLayoutText(data.text || "");
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile();
      fetchLayout();

      // 🔴 BUSCA ROLE DO USUÁRIO
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          setRole(snap.data().role || null);
        }
      });
    }
  }, [authLoading, user]);

  // Função de Upload para o Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    data.append("upload_preset", "psisaas_preset");
    data.append("cloud_name", "dy0hmkgry");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dy0hmkgry/image/upload", {
        method: "POST",
        body: data
      });
      const uploadedImage = await res.json();

      if (uploadedImage.secure_url) {
        const newUrl = uploadedImage.secure_url;
        setFormData((prev) => ({ ...prev, photoURL: newUrl }));

        if (user) {
          await updateDoc(doc(db, "users", user.uid), { photoURL: newUrl });
        }
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleLayoutImageUpload = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "psisaas_preset");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dy0hmkgry/image/upload",
      { method: "POST", body: data }
    );

    const uploaded = await res.json();
    if (uploaded.secure_url) {
      setLayoutImage(uploaded.secure_url);
    }
  };

  const handleSaveLayout = async () => {
    if (!site) return;

    await setDoc(doc(db, "layouts", String(site)), {
      image: layoutImage || null,
      text: layoutText,
      updatedAt: new Date()
    });

    alert("Layout salvo");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user!.uid), {
        ...formData,
        updatedAt: new Date()
      });
      setIsEditing(false);
      alert("Perfil atualizado!");
    } catch (error) {
      alert("Erro ao atualizar.");
    } finally { setSaving(false); }
  };

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* CARD PERFIL */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-32 bg-slate-900 relative" />

          <div className="p-8 pt-0 -mt-12">
            <div className="flex justify-between items-end mb-8">
              <div className="relative group">
                <div
                  className="h-24 w-24 rounded-3xl border-4 border-white flex items-center justify-center bg-blue-600 text-white text-3xl font-black overflow-hidden cursor-pointer shadow-lg"
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <span className="text-xs animate-pulse">Enviando...</span>
                  ) : formData.photoURL ? (
                    <Image
                      src={formData.photoURL}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    formData.nomeCompleto?.charAt(0)
                  )}
                </div>

                {isEditing && (
                  <div className="absolute bottom-0 right-0 bg-slate-900 text-white p-1.5 rounded-full text-xs shadow-md">
                    📷
                  </div>
                )}

                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={!isEditing}
                />
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm"
              >
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">
                  Nome Completo
                </label>
                <input
                  disabled={!isEditing}
                  className="w-full p-4 bg-slate-50 border rounded-2xl mt-1"
                  value={formData.nomeCompleto}
                  onChange={e =>
                    setFormData({ ...formData, nomeCompleto: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase">
                  WhatsApp
                </label>
                <input
                  disabled={!isEditing}
                  className="w-full p-4 bg-slate-50 border rounded-2xl mt-1"
                  value={formData.telefone}
                  onChange={e =>
                    setFormData({ ...formData, telefone: maskPhone(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase">
                  Registro Profissional (CRP)
                </label>
                <input
                  disabled={!isEditing}
                  className="w-full p-4 bg-slate-50 border rounded-2xl mt-1"
                  value={formData.crp}
                  onChange={e =>
                    setFormData({ ...formData, crp: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">
                  Breve Bio / Descrição
                </label>
                <textarea
                  disabled={!isEditing}
                  rows={4}
                  className="w-full p-4 bg-slate-50 border rounded-2xl mt-1"
                  value={formData.bio}
                  onChange={e =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </div>

              {isEditing && (
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black"
                  >
                    Confirmar Alterações
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {role === "admin" && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-6">

              {/* IMAGEM */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">
                  Imagem do Layout
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const data = new FormData();
                    data.append("file", file);
                    data.append("upload_preset", "psisaas_preset");

                    const res = await fetch(
                      "https://api.cloudinary.com/v1_1/dy0hmkgry/image/upload",
                      { method: "POST", body: data }
                    );

                    const uploaded = await res.json();
                    if (uploaded.secure_url) {
                      setLayoutImage(uploaded.secure_url);
                    }
                  }}
                />
              </div>

              {/* TEXTO */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">
                  Texto do Layout
                </label>
                <textarea
                  rows={3}
                  value={layoutText}
                  onChange={(e) => setLayoutText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border rounded-2xl mt-2"
                  placeholder="Mensagem exibida no menu lateral"
                />
              </div>

              {/* SALVAR */}
              <button
                onClick={async () => {
                  if (!site) return;

                  await setDoc(doc(db, "layouts", String(site)), {
                    image: layoutImage || null,
                    text: layoutText,
                    updatedAt: new Date()
                  });

                  alert("Layout salvo");
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                Salvar Layout
              </button>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}