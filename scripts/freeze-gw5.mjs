import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const GAMEWEEK = 5;
const forceBeforeDeadline = process.argv.includes("--force-before-deadline");
const SOURCE = `https://fpl-risk-ui-refresh.vercel.app/api/ledger/snapshot?event=${GAMEWEEK}`;
const DESTINATION = new URL(`../data/gw${GAMEWEEK}-locked.json`, import.meta.url);

const response = await fetch(SOURCE, {
  cache: "no-store",
  headers: { "User-Agent": "FPL-Ledger-Lock/1.0" },
});

if (!response.ok) {
  throw new Error(`Projection source returned HTTP ${response.status}`);
}

const raw = await response.text();
const snapshot = JSON.parse(raw);

if (snapshot.gameweek !== GAMEWEEK) {
  throw new Error(`Expected GW${GAMEWEEK}, received GW${snapshot.gameweek ?? "?"}`);
}

const deadline = Date.parse(snapshot.deadlineTime);
if (!Number.isFinite(deadline)) {
  throw new Error("Snapshot did not include a valid official FPL deadline.");
}

if (Date.now() < deadline && !forceBeforeDeadline) {
  const seconds = Math.ceil((deadline - Date.now()) / 1000);
  throw new Error(`Refusing to freeze before the official GW${GAMEWEEK} deadline (${seconds}s remaining).`);
}

if (!Array.isArray(snapshot.rows) || snapshot.rows.length < 100) {
  throw new Error("Projection snapshot is incomplete; refusing to create a lock.");
}

const lockedAt = new Date().toISOString();
const contentHash = createHash("sha256").update(raw, "utf8").digest("hex");
const artifact = {
  lockSchemaVersion: 2,
  gameweek: GAMEWEEK,
  lockedAt,
  lockMode: Date.now() < deadline ? "manual-predeadline" : "official-deadline",
  lockNote: Date.now() < deadline
    ? "Manually locked at the operator's request before the official deadline; this exact snapshot is now the public scoring baseline."
    : "Locked at or after the official FPL deadline.",
  deadlineTime: snapshot.deadlineTime,
  modelVersion: snapshot.modelVersion ?? null,
  source: SOURCE,
  contentHashAlgorithm: "sha256",
  contentHash,
  sourceByteLength: Buffer.byteLength(raw, "utf8"),
  snapshot,
};

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(DESTINATION, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

console.log(`GW${GAMEWEEK} locked successfully.`);
console.log(`Locked at: ${lockedAt}`);
console.log(`Model: ${artifact.modelVersion ?? "unknown"}`);
console.log(`Players: ${snapshot.rows.length}`);
console.log(`SHA-256: ${contentHash}`);
console.log(`Artifact: data/gw${GAMEWEEK}-locked.json`);
