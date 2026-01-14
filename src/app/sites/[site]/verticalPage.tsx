"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import Psicologia from "@/app/verticals/psicologia/page";
import Advocacia from "@/app/verticals/advocacia/page";
import Nutricao from "@/app/verticals/nutricao/page";
import Musica from "@/app/verticals/musica/page";
import Personal from "@/app/verticals/personal/page";

const verticalPages: Record<string, React.ComponentType> = {
  psicologia: Psicologia,
  advocacia: Advocacia,
  nutricao: Nutricao,
  musica: Musica,
  personal: Personal,
};

export default function SiteVerticalPage() {
  const { site } = useParams();
  const [verticalId, setVerticalId] = useState<string | null>(null);

  useEffect(() => {
    if (!site) return;

    getDoc(doc(db, "tenants", site as string)).then((snap) => {
      if (snap.exists()) {
        setVerticalId(snap.data().verticalId);
      }
    });
  }, [site]);

  if (!verticalId) return <div>Carregando vertical...</div>;

  const VerticalPage = verticalPages[verticalId];
  if (!VerticalPage) return <div>Vertical não suportada</div>;

  return <VerticalPage />;
}
