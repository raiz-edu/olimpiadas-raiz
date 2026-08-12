import { cookies } from "next/headers";
import { verifyCognitoSession } from "@/lib/auth/cognito-session";
import { createAwsDataClient } from "@/lib/aws/backend";

export async function createClient() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("olymp_staff_session")?.value;
  const session = raw ? verifyCognitoSession(raw) : null;
  return createAwsDataClient(session ? { id: session.sub, email: session.email } : null);
}
