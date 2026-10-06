#!/usr/bin/env node
// Penulis provenance untuk context pack. Dipakai mode init dan refresh supaya hash tidak dihitung tangan.
//
//   node .pi/stapler/provenance.mjs                 # tulis ulang provenance.json
//   node .pi/stapler/provenance.mjs --print         # tampilkan saja, tanpa menulis
//   node .pi/stapler/provenance.mjs --generated-by "stapler-context@0.4.0"
//
// Yang dihitung:
//   - sumber dari manifest.json yang bukan harness-injected: hash isi file, atau untuk direktori hash
//     "nama:hash isi" tiap file di dalamnya, supaya perubahan isi ikut terdeteksi
//   - file konteks harness dari manifest.harnessInjected: diawasi hash-nya, isinya tidak disalin
//   - file MANUAL pack: ditandai manual, tanpa hash, supaya check tidak melaporkannya sebagai hilang

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACK_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(PACK_DIR, "..", "..");
const MANIFEST_PATH = path.join(PACK_DIR, "manifest.json");
const PROVENANCE_PATH = path.join(PACK_DIR, "provenance.json");

const MANUAL_FILES = ["index.md", "manifest.json", "verification.mjs", "check.mjs", "provenance.mjs"];

const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");

function listFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, dir));
  return out.sort();
}

function hashPath(relative) {
  const full = path.join(ROOT, relative);
  if (!fs.statSync(full).isDirectory()) return { kind: "file", sha256: sha(fs.readFileSync(full)) };
  const files = listFiles(relative);
  const lines = files.map((file) => `${file}:${sha(fs.readFileSync(path.join(ROOT, file)))}`);
  return { kind: "directory", sha256: sha(lines.join("\n")), files: files.length };
}

function main() {
  const args = process.argv.slice(2);
  const printOnly = args.includes("--print");
  const generatedByIndex = args.indexOf("--generated-by");
  const generatedBy = generatedByIndex >= 0 ? args[generatedByIndex + 1] : "stapler-context";

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("manifest.json tidak ditemukan di pack ini");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const previous = fs.existsSync(PROVENANCE_PATH) ? JSON.parse(fs.readFileSync(PROVENANCE_PATH, "utf8")) : { sources: [] };
  const previousByPath = new Map((previous.sources ?? []).map((entry) => [entry.path, entry]));

  const sources = [];
  for (const source of manifest.sources ?? []) {
    if (source.role === "harness-injected") continue;
    const full = path.join(ROOT, source.path);
    if (!fs.existsSync(full)) {
      sources.push({ path: source.path, missing: true, role: source.role ?? null });
      continue;
    }
    const hash = hashPath(source.path);
    sources.push({
      path: source.path,
      role: source.role ?? null,
      ...hash,
      compiledInto: previousByPath.get(source.path)?.compiledInto ?? [],
    });
  }

  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  for (const entry of manifest.harnessInjected ?? []) {
    const full = entry.path.startsWith("~/") ? path.join(home, entry.path.slice(2)) : path.join(ROOT, entry.path);
    if (!fs.existsSync(full)) {
      sources.push({ path: entry.path, scope: entry.scope ?? null, watched: true, missing: true });
      continue;
    }
    sources.push({ path: entry.path, scope: entry.scope ?? null, watched: true, sha256: sha(fs.readFileSync(full)) });
  }

  for (const file of MANUAL_FILES) sources.push({ path: `.pi/stapler/${file}`, manual: true });
  const playsDir = path.join(PACK_DIR, "plays");
  if (fs.existsSync(playsDir)) {
    for (const file of fs.readdirSync(playsDir).filter((name) => name.endsWith(".md")).sort()) {
      sources.push({ path: `.pi/stapler/plays/${file}`, manual: true });
    }
  }

  const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  const provenance = {
    schemaVersion: 1,
    generatedBy,
    generatedAt: new Date().toISOString(),
    head: head.status === 0 ? head.stdout.trim() : null,
    sources,
  };

  if (printOnly) {
    console.log(JSON.stringify(provenance, null, 2));
    return;
  }
  fs.writeFileSync(PROVENANCE_PATH, `${JSON.stringify(provenance, null, 2)}\n`);
  const compiled = sources.filter((s) => s.sha256 && !s.manual && !s.watched).length;
  const watched = sources.filter((s) => s.watched).length;
  const manual = sources.filter((s) => s.manual).length;
  const missing = sources.filter((s) => s.missing).length;
  console.log(`provenance ditulis: ${compiled} sumber dikompilasi, ${watched} file kelas A diawasi, ${manual} file manual`);
  if (missing > 0) console.log(`peringatan: ${missing} path di manifest tidak ditemukan`);
}

main();
