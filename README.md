# SaaS Psicológico Multi-Tenant

## Arquitetura
- **Frontend:** Next.js (App Router), TailwindCSS.
- **Backend:** Node.js Express API.
- **Database:** Firestore (Multi-tenant via `tenantId` property).
- **Storage:** Cloudinary (Folder: `tenants/{tenantId}/...`).

## Instalação Local

1. **Configurar Hosts:**
   Edite `/etc/hosts` (Mac/Linux) ou `C:\Windows\System32\drivers\etc\hosts` para simular subdomínios: