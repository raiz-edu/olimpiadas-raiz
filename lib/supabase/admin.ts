/**
 * Cliente administrativo do backend AWS.
 *
 * Usa PostgREST privado no mesmo task ECS, sem tráfego ao serviço Supabase.
 *
 * IMPORTANTE: usar APENAS em Server Components, Route Handlers e Server Actions.
 * NUNCA expor a SERVICE_ROLE_KEY no client side.
 */
import { createAwsDataClient } from "@/lib/aws/backend";

export function createAdminClient() {
  return createAwsDataClient();
}
