"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STAFF_SESSION_COOKIE } from "@/lib/auth/cognito-session";

type LoginState = { error?: string } | null;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  void _prevState;
  void formData;
  return { error: "Use Entrar com Google. O login por senha foi desativado." };
}

export async function logout() {
  (await cookies()).delete(STAFF_SESSION_COOKIE);
  redirect("/login");
}
