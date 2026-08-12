import "server-only";

import { createHmac } from "node:crypto";
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminResetUserPasswordCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PostgrestClient } from "@supabase/postgrest-js";
import { decodeJwt } from "jose";
import type { Database } from "@/lib/types/database";

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type AuthResult = { data: { user: AuthUser | null }; error: Error | null };

const region = process.env.AWS_REGION ?? "sa-east-1";
const cognito = new CognitoIdentityProviderClient({ region });
const s3 = new S3Client({ region });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function secretHash(username: string): string {
  return createHmac("sha256", required("COGNITO_CLIENT_SECRET"))
    .update(username + required("COGNITO_CLIENT_ID"))
    .digest("base64");
}

function attribute(attributes: Array<{ Name?: string; Value?: string }> | undefined, name: string) {
  return attributes?.find((item) => item.Name === name)?.Value;
}

async function createCognitoUser(input: {
  email: string;
  password?: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
}): Promise<AuthResult> {
  try {
    const response = await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: required("COGNITO_USER_POOL_ID"),
        Username: input.email,
        MessageAction: "SUPPRESS",
        TemporaryPassword: input.password,
        UserAttributes: [
          { Name: "email", Value: input.email },
          { Name: "email_verified", Value: input.email_confirm ? "true" : "false" },
          ...(input.user_metadata?.nome
            ? [{ Name: "name", Value: String(input.user_metadata.nome) }]
            : []),
        ],
      }),
    );
    if (input.password) {
      await cognito.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: required("COGNITO_USER_POOL_ID"),
          Username: input.email,
          Password: input.password,
          Permanent: true,
        }),
      );
    }
    const id = attribute(response.User?.Attributes, "sub");
    if (!id) throw new Error("Cognito não retornou o identificador do usuário");
    return {
      data: { user: { id, email: input.email, user_metadata: input.user_metadata } },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null },
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function storageAdapter() {
  return {
    createBucket: async (_name?: string, _options?: unknown) => ({ data: null, error: null }),
    from: (namespace: string) => ({
      upload: async (
        path: string,
        body: ArrayBuffer | Uint8Array | Buffer,
        options?: { contentType?: string; upsert?: boolean },
      ) => {
        try {
          await s3.send(
            new PutObjectCommand({
              Bucket: required("STORAGE_BUCKET"),
              Key: `${namespace}/${path}`,
              Body: Buffer.from(body as ArrayBuffer),
              ContentType: options?.contentType,
              IfNoneMatch: options?.upsert ? undefined : "*",
              ServerSideEncryption: "aws:kms",
            }),
          );
          return { data: { path }, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      remove: async (paths: string[]) => {
        try {
          await s3.send(
            new DeleteObjectsCommand({
              Bucket: required("STORAGE_BUCKET"),
              Delete: { Objects: paths.map((path) => ({ Key: `${namespace}/${path}` })) },
            }),
          );
          return { data: paths, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      list: async (prefix = "", _options?: unknown) => {
        try {
          const response = await s3.send(
            new ListObjectsV2Command({
              Bucket: required("STORAGE_BUCKET"),
              Prefix: `${namespace}/${prefix ? `${prefix}/` : ""}`,
            }),
          );
          return {
            data: (response.Contents ?? []).map((object) => ({
              name:
                String(object.Key ?? "")
                  .split("/")
                  .pop() ?? "",
              created_at: object.LastModified?.toISOString() ?? "",
            })),
            error: null,
          };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      createSignedUrl: async (path: string, expiresIn: number) => ({
        data: {
          signedUrl: await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: required("STORAGE_BUCKET"),
              Key: `${namespace}/${path}`,
            }),
            { expiresIn },
          ),
        },
        error: null,
      }),
      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `/api/storage/${encodeURIComponent(namespace)}/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
        },
      }),
    }),
  };
}

function postgrestToken(role: "anon" | "authenticated" | "service_role", sub: string) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    role,
    sub,
    exp: Math.floor(Date.now() / 1000) + 300,
  });
  const signature = createHmac("sha256", required("SESSION_SIGNING_SECRET"))
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function createAwsDataClient(currentUser?: AuthUser | null, admin = false) {
  const role = admin ? "service_role" : currentUser ? "authenticated" : "anon";
  const sub = currentUser?.id ?? "00000000-0000-0000-0000-000000000000";
  const postgrest = new PostgrestClient<Database>(required("POSTGREST_URL"), {
    headers: { Authorization: `Bearer ${postgrestToken(role, sub)}` },
  });

  return Object.assign(postgrest, {
    auth: {
      getUser: async (): Promise<AuthResult> => ({
        data: { user: currentUser ?? null },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const response = await cognito.send(
            new InitiateAuthCommand({
              ClientId: required("COGNITO_CLIENT_ID"),
              AuthFlow: "USER_PASSWORD_AUTH",
              AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: secretHash(email),
              },
            }),
          );
          const token = response.AuthenticationResult?.IdToken;
          if (!token) throw new Error("Credenciais inválidas");
          const claims = decodeJwt(token);
          return { data: { user: { id: String(claims.sub), email } }, error: null };
        } catch (error) {
          return {
            data: { user: null },
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },
      admin: {
        createUser: createCognitoUser,
        deleteUser: async (id: string) => {
          try {
            await cognito.send(
              new AdminDeleteUserCommand({
                UserPoolId: required("COGNITO_USER_POOL_ID"),
                Username: id,
              }),
            );
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
          }
        },
        updateUserById: async (id: string, input: { email?: string; nome?: string }) => {
          try {
            await cognito.send(
              new AdminUpdateUserAttributesCommand({
                UserPoolId: required("COGNITO_USER_POOL_ID"),
                Username: id,
                UserAttributes: [
                  ...(input.email
                    ? [
                        { Name: "email", Value: input.email },
                        { Name: "email_verified", Value: "true" },
                      ]
                    : []),
                  ...(input.nome ? [{ Name: "name", Value: input.nome }] : []),
                ],
              }),
            );
            return { data: {}, error: null };
          } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
          }
        },
        generateLink: async ({ email }: { type: string; email: string; options?: unknown }) => {
          try {
            await cognito.send(
              new AdminResetUserPasswordCommand({
                UserPoolId: required("COGNITO_USER_POOL_ID"),
                Username: email,
              }),
            );
            return { data: {}, error: null };
          } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
          }
        },
      },
    },
    storage: storageAdapter(),
  });
}
