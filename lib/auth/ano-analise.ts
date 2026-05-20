"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE = "ano_analise";

export async function getAnoAnalise(): Promise<number> {
  const store = await cookies();
  const saved = store.get(COOKIE)?.value;
  const parsed = saved ? parseInt(saved, 10) : NaN;
  return isNaN(parsed) ? new Date().getFullYear() : parsed;
}

export async function setAnoAnalise(ano: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, String(ano), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
