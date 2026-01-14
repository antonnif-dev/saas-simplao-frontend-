import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
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
