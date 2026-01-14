import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next|_static|favicon.ico).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  // Remove porta (localhost:3000)
  const hostname = host.split(":")[0];

  /**
   * =========================
   * DEV — localhost
   * =========================
   */
  if (hostname === "localhost" || hostname === "www.localhost") {
    // Acessando http://localhost:3000 → site público ou landing
    return NextResponse.next();
  }

  if (hostname.endsWith(".localhost")) {
    const tenant = hostname.replace(".localhost", "");
    url.pathname = `/sites/${tenant}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  /**
   * =========================
   * PROD — Vercel / Domínio próprio
   * =========================
   */

  // Ex: tenant.vercel.app ou tenant.seu-dominio.com
  const parts = hostname.split(".");

  // Garante que existe subdomínio
  if (parts.length >= 3) {
    const tenant = parts[0];

    url.pathname = `/sites/${tenant}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Domínio raiz (ex: app.vercel.app ou seu-dominio.com)
  return NextResponse.next();
}

/*
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next|_static|favicon.ico).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  const domain = hostname.split(":")[0];

  // acesso local direto
  if (domain === "localhost" || domain === "www.localhost") {
    return NextResponse.next();
  }

  const currentHost = domain.replace(".localhost", "");
  const targetPath = `/sites/${currentHost}${url.pathname}`;

  console.log(`🔗 Multi-tenant Ativo: ${hostname} -> ${targetPath}`);

  return NextResponse.rewrite(new URL(targetPath, req.url));
}
*/
