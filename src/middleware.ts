
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

  if (pathname.startsWith("/sites/")) {
    return NextResponse.next();
  }

  // acesso local direto
  if (domain === "localhost" || domain === "www.localhost") {
    return NextResponse.next();
  }

  if (
    domain.endsWith(".vercel.app") &&
    domain.split(".").length === 3 // ex: simplao-frontend.vercel.app
  ) {
    return NextResponse.next();
  }

  if (domain.endsWith(".localhost")) {
    const tenant = domain.replace(".localhost", "");
    const targetPath = `/sites/${tenant}${pathname}`;
    return NextResponse.rewrite(new URL(targetPath, req.url));
  }

  const parts = domain.split(".");
  if (parts.length >= 3) {
    const tenant = parts[0];
    const targetPath = `/sites/${tenant}${pathname}`;
    return NextResponse.rewrite(new URL(targetPath, req.url));
  }

  const currentHost = domain.replace(".localhost", "");
  const targetPath = `/sites/${currentHost}${url.pathname}`;

  return NextResponse.next();
}