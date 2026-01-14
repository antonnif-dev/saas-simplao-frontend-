import { VerticalId, VerticalMenuItem } from "./verticals";

export function getVerticalExtras(
  verticalId: VerticalId,
  site: string
): VerticalMenuItem[] {
  switch (verticalId) {
    case "psicologia":
      return [
        {
          icon: "🧠",
          label: "Área da Psicologia",
          href: `/sites/${site}/verticalPage`,
        },
      ];

    case "advocacia":
      return [
        {
          icon: "⚖️",
          label: "Área Jurídica",
          href: `/sites/${site}/verticalPage`,
        },
        {
          icon: "📄",
          label: "Diligências",
          href: `/sites/${site}/verticals/advocacia/diligencias`,
        },
      ];

    case "personal":
      return [
        {
          icon: "🏋️",
          label: "Ficha Técnica",
          href: `/sites/${site}/verticalPage`,
        },
      ];

    case "musica":
      return [
        {
          icon: "🎵",
          label: "Plano de Estudos",
          href: `/sites/${site}/verticalPage`,
        },
      ];

    case "nutricao":
      return [
        {
          icon: "🥗",
          label: "Plano Alimentar",
          href: `/sites/${site}/verticalPage`,
        },
      ];

    default:
      return [];
  }
}
