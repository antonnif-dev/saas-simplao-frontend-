import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next|_static|favicon.ico).*)",
  ],
};

export default function proxy(req: NextRequest) {
  console.log("====================================");
  console.log("[PROXY-1] Nova requisição recebida");

  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const domain = hostname.split(":")[0];
  const pathname = url.pathname;

  console.log("[PROXY-2] Hostname:", hostname);
  console.log("[PROXY-3] Domain:", domain);
  console.log("[PROXY-4] Pathname:", pathname);

  // 🔹 Já está dentro de /sites
  if (pathname.startsWith("/sites/")) {
    console.log("[PROXY-5] Já está em /sites → Next()");
    return NextResponse.next();
  }

  // 🔹 Acesso localhost puro
  if (domain === "localhost" || domain === "www.localhost") {
    console.log("[PROXY-6] Acesso localhost → Next()");
    return NextResponse.next();
  }

  // 🔹 clinica.localhost
  if (domain.endsWith(".localhost")) {
    const tenant = domain.replace(".localhost", "");
    console.log("[PROXY-7] Subdomínio localhost detectado");
    console.log("[PROXY-8] Tenant extraído:", tenant);

    const rewriteUrl = new URL(`/sites/${tenant}${pathname}`, req.url);
    console.log("[PROXY-9] Reescrevendo para:", rewriteUrl.toString());

    return NextResponse.rewrite(rewriteUrl);
  }

  // 🔹 Caso Vercel
  if (domain.endsWith(".vercel.app")) {
    console.log("[PROXY-10] Domínio vercel detectado");

    const base = "saas-simplao-frontend.vercel.app";
    console.log("[PROXY-11] Base configurada:", base);

    if (domain === base) {
      console.log("[PROXY-12] Domínio base sem tenant → Next()");
      return NextResponse.next();
    }

    if (domain.endsWith(base)) {
      const tenant = domain.replace(`-${base}`, "");
      console.log("[PROXY-13] Tenant extraído:", tenant);

      if (!tenant || tenant === domain) {
        console.log("[PROXY-14] Tenant inválido → Next()");
        return NextResponse.next();
      }

      const rewriteUrl = new URL(`/sites/${tenant}${pathname}`, req.url);
      console.log("[PROXY-15] Reescrevendo para:", rewriteUrl.toString());

      return NextResponse.rewrite(rewriteUrl);
    }
  }

  console.log("[PROXY-16] Nenhuma regra aplicada → Next()");
  return NextResponse.next();
}