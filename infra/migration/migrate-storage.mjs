import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.SUPABASE_URL;
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetBucket = process.env.STORAGE_BUCKET;
if (!endpoint || !sourceKey || !targetBucket) throw new Error("Configuração de storage incompleta");

const headers = {
  Authorization: `Bearer ${sourceKey}`,
  apikey: sourceKey,
  "Content-Type": "application/json",
  "User-Agent": "olimpiadas-migration/1.0",
};
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "sa-east-1" });

async function list(bucket, prefix = "") {
  const result = [];
  for (let offset = 0; ; offset += 100) {
    const response = await fetch(`${endpoint}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prefix,
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    if (!response.ok) throw new Error(`${bucket}/${prefix}: ${await response.text()}`);
    const page = await response.json();
    for (const object of page) {
      const objectPath = prefix ? `${prefix}/${object.name}` : object.name;
      if (object.id) result.push(objectPath);
      else result.push(...(await list(bucket, objectPath)));
    }
    if (page.length < 100) return result;
  }
}

const bucketsResponse = await fetch(`${endpoint}/storage/v1/bucket`, { headers });
if (!bucketsResponse.ok) throw new Error(await bucketsResponse.text());
const buckets = await bucketsResponse.json();
const queue = [];
for (const bucket of buckets) {
  for (const objectPath of await list(bucket.id)) queue.push({ bucket: bucket.id, objectPath });
}

const manifest = { migratedAt: new Date().toISOString(), objects: [], totals: {} };
let cursor = 0;
async function worker() {
  for (;;) {
    const item = queue[cursor++];
    if (!item) return;
    const source = await fetch(
      `${endpoint}/storage/v1/object/authenticated/${item.bucket}/${item.objectPath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      { headers },
    );
    if (!source.ok) throw new Error(`${item.bucket}/${item.objectPath}: HTTP ${source.status}`);
    const body = Buffer.from(await source.arrayBuffer());
    const targetKey = `${item.bucket}/${item.objectPath}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: targetKey,
        Body: body,
        ContentType: source.headers.get("content-type") ?? undefined,
        Metadata: { "source-sha256": createHash("sha256").update(body).digest("hex") },
      }),
    );
    manifest.objects.push({
      bucket: item.bucket,
      path: item.objectPath,
      bytes: body.length,
      sha256: createHash("sha256").update(body).digest("hex"),
    });
    const total = (manifest.totals[item.bucket] ??= { objects: 0, bytes: 0 });
    total.objects += 1;
    total.bytes += body.length;
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
await s3.send(
  new PutObjectCommand({
    Bucket: targetBucket,
    Key: `migration/storage-manifest-${Date.now()}.json`,
    Body: JSON.stringify(manifest),
    ContentType: "application/json",
  }),
);
console.log(JSON.stringify(manifest.totals));
