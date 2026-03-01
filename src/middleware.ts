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
  const pathname = url.pathname;

  // Já está dentro de /sites
  if (pathname.startsWith("/sites/")) {
    return NextResponse.next();
  }

  // acesso local puro
  if (domain === "localhost" || domain === "www.localhost") {
    return NextResponse.next();
  }

  // suporte a clinica.localhost
  if (domain.endsWith(".localhost")) {
    const tenant = domain.replace(".localhost", "");
    return NextResponse.rewrite(
      new URL(`/sites/${tenant}${pathname}`, req.url)
    );
  }

  // 🔥 CASO VERCEL PREFIXADO
  if (domain.endsWith(".vercel.app")) {
    // exemplo:
    // clinica-saas-simplao-frontend.vercel.app

    const base = "saas-simplao-frontend.vercel.app";

    if (domain === base) {
      return NextResponse.next();
    }

    if (domain.endsWith(base)) {
      const tenant = domain.replace(`-${base}`, "");

      return NextResponse.rewrite(
        new URL(`/sites/${tenant}${pathname}`, req.url)
      );
    }
  }

  return NextResponse.next();
}