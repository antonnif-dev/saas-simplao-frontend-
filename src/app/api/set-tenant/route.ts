import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { tenantId } = await request.json();

  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant inválido" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("tenant", tenantId, {
    path: "/",
    sameSite: "lax",
    secure: true, // produção HTTPS
  });

  return response;
}