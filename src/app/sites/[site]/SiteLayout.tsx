"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { useAuth } from "@/hooks/useAuth";
import { verticals } from "@/config/verticals";
//import { verticalExtrasMap } from "@/config/verticalExtras";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = useParams();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("Carregando...");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [tenantData, setTenantData] = useState<any>(null);

  const normalizedRole = role ?? "client";

  //const tenantSnap = await getDoc(doc(db, "tenants", site as string));

  const [layoutInfo, setLayoutInfo] = useState<{
    image: string | null;
    text: string | null;
  }>({
    image: null,
    text: null,
  });

  const primaryColor = tenantData?.config?.primaryColor || "#ffc4d8";

  const vertical = tenantData
    ? verticals[tenantData.verticalId]
    : verticals.psicologia;

  useEffect(() => {
    let unsubscribeUser = () => { };

    async function initData() {
      try {
        // Tenant
        if (site) {
          const tenantSnap = await getDoc(doc(db, "tenants", site as string));
          if (tenantSnap.exists()) {
            setTenantData(tenantSnap.data());
          }

          // ✅ Layout salvo pelo admin
          const layoutSnap = await getDoc(doc(db, "layouts", site as string));
          if (layoutSnap.exists()) {
            const data = layoutSnap.data();
            setLayoutInfo({
              image: data.image || null,
              text: data.text || null,
            });
          }
        }

        // Usuário (tempo real)
        if (user?.uid) {
          unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(data.role || "paciente");
              setUserName(data.nomeCompleto || "Usuário");
              setUserPhoto(data.photoURL || null);
            }
            setLoadingRole(false);
          });
        } else {
          setLoadingRole(false);
        }

      } catch (error) {
        console.error("Erro ao carregar dados do Layout:", error);
        setLoadingRole(false);
      }
    }

    if (!authLoading) {
      initData();
    }

    return () => {
      unsubscribeUser();
    };
  }, [user, authLoading, site]);

  const baseMenu =
    normalizedRole === "admin"
      ? [
        { icon: "📊", label: "Dashboard", href: "/" },
        { icon: "📅", label: vertical.terms.session, href: "/agenda" },
        { icon: "👥", label: vertical.terms.client, href: "/pacientes" },
        { icon: "💰", label: "Financeiro", href: "/financeiro" },
        { icon: "📄", label: "Prontuários", href: "/prontuarios" },
      ]
      : [
        { icon: "🏠", label: "Meu Início", href: "/" },
        { icon: "📅", label: vertical.terms.session, href: "/agenda" },
        //{ icon: "👥", label: vertical.terms.client, href: "/pacientes" },
        { icon: "💰", label: "Financeiro", href: "/financeiro" },
        { icon: "📄", label: vertical.terms.document, href: "/documentos" },
      ];
  {/* Visão do admin. Visão do cliente */ }


  const verticalExtras =
    tenantData?.verticalId === "psicologia"
      ? [
        {
          icon: "🧠",
          label: "Tratamentos",
          href: "/verticalPage",
        },
      ]
      : tenantData?.verticalId === "advocacia"
        ? [
          {
            icon: "⚖️",
            label: "Área Jurídica",
            href: "/verticalPage",
          },
        ]
        : tenantData?.verticalId === "personal"
          ? [
            {
              icon: "🏋️",
              label: "Ficha Técnica",
              href: "/verticalPage",
            },
          ]
          : tenantData?.verticalId === "musica"
            ? [
              {
                icon: "🎵",
                label: "Plano de Estudos",
                href: "/verticalPage",
              },
            ]
            : tenantData?.verticalId === "nutricao"
              ? [
                {
                  icon: "🥗",
                  label: "Plano Alimentar",
                  href: "/verticalPage",
                },
              ]
              : [];

  const menuItems = [...baseMenu, ...verticalExtras];

  {/* Menu vertical ao invés de menu fixo
    const verticalMenu =
    normalizedRole && vertical?.menu?.[normalizedRole]
      ? vertical.menu[normalizedRole]
      : [];

  const menuItems = [...baseMenu, ...verticalMenu];
    */}

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = `/login`;
  };

  if (loadingRole && !authLoading) return <div className="h-screen flex items-center justify-center">Validando acesso...</div>;

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden font-sans"
      style={{ "--primary-color": primaryColor } as React.CSSProperties}
    >
      <aside className="w-44 md:w-80 bg-slate-900 flex flex-col text-slate-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div
            className="h-9 w-12 rounded flex items-center justify-center mr-3"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            <span className="text-white font-bold p-5">
              {tenantData?.appSimbol || "Ψ"}
            </span>
          </div>
          <span className="text-lg font-bold text-white uppercase tracking-tighter">
            {tenantData?.appName || "PsiSaaS"}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${isActive ? 'text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                style={isActive ? { backgroundColor: 'var(--primary-color)' } : {}}
              >
                <span className="mr-3 text-lg">{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>

        {layoutInfo && (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-800/60">
            {layoutInfo.image && (
              <Image
                src={layoutInfo.image}
                alt="Layout Info"
                width={200}
                height={200}
                className="object-contain mx-auto"
                priority
              />
            )}

            {layoutInfo.text && (
              <div className="p-3 text-xs text-slate-300 leading-snug text-center">
                {layoutInfo.text}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
          <div className="flex justify-center mb-2">
            <Link href="/perfil">
              {/* Exibição da Foto no Sidebar */}
              {userPhoto ? (
                <Image
                  src={userPhoto}
                  alt="Perfil"
                  width={48}
                  height={48}
                  className="rounded-full object-cover h-12 w-12 border-2 border-slate-600 hover:border-white transition cursor-pointer"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg hover:bg-slate-600 transition cursor-pointer">
                  {userName.charAt(0)}
                </div>
              )}
            </Link>
          </div>

          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Acesso {role === "admin" ? "Profissional" : "Paciente"}
          </span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-500 border-b border-slate-200 flex justify-between items-center px-8">
          <h1 className="text-sm font-bold text-slate-400">
            {vertical.terms.tenant} /{" "}<span className="uppercase font-black" style={{ color: 'var(--primary-color)' }}>{site}</span>
          </h1>
          <div className="flex items-center space-x-4">
            {/* Exibição da Foto no Header (Opcional, ou mantenha apenas o nome) */}
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-800">{userName}</span>
              <span className="block text-[10px] text-slate-400 uppercase">{role}</span>
            </div>

            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition">Sair</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}