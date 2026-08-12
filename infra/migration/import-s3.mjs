import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const source = process.argv[2];
if (!source?.startsWith("s3://")) throw new Error("Informe s3://bucket/prefix");
const [, , bucket, ...parts] = source.split("/");
const prefix = parts.join("/").replace(/\/$/, "");
const directory = "/tmp/olimpiadas-snapshot";
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "sa-east-1" });

async function download(name) {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: `${prefix}/${name}` }),
  );
  if (!response.Body) throw new Error(`Objeto vazio: ${name}`);
  await writeFile(path.join(directory, name), await response.Body.transformToByteArray());
}

await mkdir(directory, { recursive: true });
await download("manifest.json");
const manifest = JSON.parse(
  await (await import("node:fs/promises")).readFile(path.join(directory, "manifest.json"), "utf8"),
);
for (const table of Object.keys(manifest.tables)) await download(`${table}.json`);

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ["/migration/runner/import-snapshot.mjs", directory], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`Importação terminou com código ${code}`)),
  );
  child.on("error", reject);
});
