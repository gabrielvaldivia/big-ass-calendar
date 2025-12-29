import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Safety: Only allow in development or when explicitly enabled
  const dev = process.env.NODE_ENV !== "production";
  const allowFlag = process.env.ALLOW_DEV_WIPE === "1";
  if (!dev && !allowFlag) {
    return NextResponse.json({ ok: false, error: "Disabled" }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const scope = body?.scope === "all" ? "all" : "current";

  if (scope === "current") {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    return NextResponse.json({ ok: true, scope: "current" });
  }

  // scope === "all"
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  return NextResponse.json({ ok: true, scope: "all" });
}



