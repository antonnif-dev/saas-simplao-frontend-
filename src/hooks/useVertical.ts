"use client";

import { verticals } from "@/config/verticals";
import { useParams } from "next/navigation";

export function useVertical() {
  const { site } = useParams();

  // Fase 1: vertical fixa (psicologia)
  // Fase 2: virá do tenant
  const verticalId = "psicologia";

  return verticals[verticalId];
}
