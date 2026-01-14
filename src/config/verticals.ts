export type VerticalId =
  | "psicologia"
  | "personal"
  | "musica"
  | "advocacia"
  | "nutricao";

export type VerticalConfig = {
  id: VerticalId;
  label: string;
  terms: {
    tenant: string;
    professional: string;
    client: string;
    session: string;
    document: string;
  };
  modules: {
    prontuario: boolean;
    financeiro: boolean;
    agenda: boolean;
    documentos: boolean;
  };
  menu?: VerticalMenuConfig;
};

export type UserRole = "admin" | "professional" | "client" | "paciente" | "aluno";

export type VerticalMenuItem = {
  icon: string;
  label: string;
  href: string;
};

export type VerticalMenuConfig = Partial<
  Record<UserRole, VerticalMenuItem[]>
>;

export const verticals: Record<VerticalId, VerticalConfig> = {
  psicologia: {
    id: "psicologia",
    label: "Psicologia",
    terms: {
      tenant: "Clínica",
      professional: "Psicólogo",
      client: "Paciente",
      session: "Sessão",
      document: "Documento",
    },
    modules: {
      prontuario: true,
      financeiro: true,
      agenda: true,
      documentos: true,
    },
    menu: {
      admin: [
        {
          icon: "🧠",
          label: "Área da Psicologia",
          href: "/vertical",
        },
      ],
      professional: [
        {
          icon: "🧠",
          label: "Atendimentos",
          href: "/vertical",
        },
      ],
      client: [
        {
          icon: "🧠",
          label: "Meu Acompanhamento",
          href: "/vertical",
        },
      ],
    },
  },

  personal: {
    id: "personal",
    label: "Personal Trainer",
    terms: {
      tenant: "Estúdio",
      professional: "Personal",
      client: "Aluno",
      session: "Treino",
      document: "Plano",
    },
    modules: {
      prontuario: false,
      financeiro: true,
      agenda: true,
      documentos: true,
    },
    menu: {
      admin: {
        icon: "🏋️",
        label: "Ficha Técnica",
        href: "/vertical",
      },
      professional: {
        icon: "🏋️",
        label: "Treinos",
        href: "/vertical",
      },
      aluno: {
        icon: "🏋️",
        label: "Meu Treino",
        href: "/vertical",
      },
    },
  },

  musica: {
    id: "musica",
    label: "Música",
    terms: {
      tenant: "Escola",
      professional: "Professor",
      client: "Aluno",
      session: "Aula",
      document: "Partitura",
    },
    modules: {
      prontuario: false,
      financeiro: true,
      agenda: true,
      documentos: true,
    },
    menu: {
      admin: {
        icon: "🎵",
        label: "Área Musical",
        href: "/vertical",
      },
      professional: {
        icon: "🎵",
        label: "Minhas Aulas",
        href: "/vertical",
      },
      aluno: {
        icon: "🎵",
        label: "Meu Curso",
        href: "/vertical",
      },
    },
  },

  advocacia: {
    id: "advocacia",
    label: "Advocacia",
    terms: {
      tenant: "Escritório",
      professional: "Advogado",
      client: "Cliente",
      session: "Atendimento",
      document: "Peça",
    },
    modules: {
      prontuario: true, // pode virar "Processos" no futuro
      financeiro: true,
      agenda: true,
      documentos: true,
    },
    menu: {
      admin: {
        icon: "⚖️",
        label: "Área Jurídica",
        href: "/vertical",
      },
      professional: {
        icon: "⚖️",
        label: "Processos",
        href: "/vertical",
      },
    },
  },

  nutricao: {
    id: "nutricao",
    label: "Nutrição",
    terms: {
      tenant: "Consultório",
      professional: "Nutricionista",
      client: "Paciente",
      session: "Consulta",
      document: "Plano Alimentar",
    },
    modules: {
      prontuario: true,
      financeiro: true,
      agenda: true,
      documentos: true,
    },
    menu: {
      admin: {
        icon: "🥗",
        label: "Área Nutricional",
        href: "/vertical",
      },
      professional: {
        icon: "🥗",
        label: "Atendimentos",
        href: "/vertical",
      },
      client: {
        icon: "🥗",
        label: "Meu Plano",
        href: "/vertical",
      },
    },
  },
};
