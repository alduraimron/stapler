#!/usr/bin/env node
// Pemeriksa kebasian context pack, kontrak v1. Lihat docs/design.md bagian 12.
//
//   node .pi/stapler/check.mjs            # laporan untuk manusia
//   node .pi/stapler/check.mjs --json     # keluaran mesin
//
// Read-only: tidak menulis apa pun. Aman dijalankan sesering apa pun, termasuk setiap habis pull.
//
// Exit 0: hanya OK dan WARN.
// Exit 1: ada STALE, HARNESS-CHANGED, MISS, atau DEVIATION-STALE.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACK_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(PACK_DIR, "..", "..");
const MANIFEST_PATH = path.join(PACK_DIR, "manifest.json");
const PROVENANCE_PATH = path.join(PACK_DIR, "provenance.json");
const VERIFICATION_PATH = path.join(PACK_DIR, "verification.json");

const PACK_DOCS = [
  "rules.md",
  "deviations.md",
  "architecture.md",
  "domain.md",
  "adr-index.md",
  "design.md",
  "index.md",
  "standards",
  "plays",
];

const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return { ok: result.status === 0, out: (result.stdout ?? "").trim() };
}

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

/**
 * Hash sebuah path. Untuk direktori, hash menghitung nama DAN isi tiap file, supaya perubahan isi
 * di dalam folder sumber ikut terdeteksi (sebelumnya hanya daftar nama, sehingga perubahan isi lolos).
 */
function hashPath(relative) {
  const full = path.join(ROOT, relative);
  if (!fs.existsSync(full)) return null;
  if (!fs.statSync(full).isDirectory()) return sha(fs.readFileSync(full));
  const lines = listFiles(relative).map((file) => `${file}:${sha(fs.readFileSync(path.join(ROOT, file)))}`);
  return sha(lines.join("\n"));
}

function markdownFiles() {
  const files = [];
  for (const entry of PACK_DOCS) {
    const full = path.join(PACK_DIR, entry);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) {
      for (const file of listFiles(path.relative(ROOT, full))) if (file.endsWith(".md")) files.push(file);
    } else if (entry.endsWith(".md")) {
      files.push(path.relative(ROOT, full));
    }
  }
  return files;
}

/** Path yang dirujuk pack dan wajib ada. Ekstensi diurut dari yang terpanjang agar .tsx tidak terpotong. */
function referencedPaths() {
  const token = /(?:^|[`(\s])((?:src|\.kiro|\.pi|docs|prisma|\.github|public)\/[A-Za-z0-9_./\-[\]]+\.(?:tsx|ts|mjs|prisma|json|css|md))/g;
  const found = new Map();
  for (const file of markdownFiles()) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const match of text.matchAll(token)) {
      const value = match[1].replace(/[.,)]+$/, "");
      if (value.includes("*")) continue;
      if (!found.has(value)) found.set(value, file);
    }
  }
  return found;
}

function deviationsFromPack() {
  const file = path.join(PACK_DIR, "deviations.md");
  if (!fs.existsSync(file)) return [];
  const rows = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .filter((line) => !/^\|\s*-+/.test(line.trim()))
    .filter((line) => !/^\|\s*Topik\s*\|/i.test(line.trim()));
  const entries = [];
  for (const row of rows) {
    const topic = row.split("|")[1]?.trim();
    const standards = [...row.matchAll(/(\.kiro\/[A-Za-z0-9_./-]+\.md)/g)].map((m) => m[1]);
    if (topic && standards.length > 0) entries.push({ topic, standards });
  }
  return entries;
}

function main() {
  const json = process.argv.includes("--json");
  const findings = [];
  const add = (code, path_, detail) => findings.push({ code, path: path_, detail });
  const notes = [];

  if (!fs.existsSync(PROVENANCE_PATH) || !fs.existsSync(MANIFEST_PATH)) {
    add("MISS", ".pi/stapler/provenance.json", "pack belum lengkap; jalankan stapler-context init");
    return report(findings, notes, json);
  }

  const provenance = JSON.parse(fs.readFileSync(PROVENANCE_PATH, "utf8"));
  const entries = provenance.sources ?? [];
  const compiled = entries.filter((entry) => entry.sha256 && !entry.manual && !entry.watched);
  const watched = entries.filter((entry) => entry.watched);

  // Sumbu dokumen.
  for (const entry of compiled) {
    const now = hashPath(entry.path);
    if (now === null) add("MISS", entry.path, "sumber yang dikompilasi sudah tidak ada");
    else if (now !== entry.sha256) {
      const into = (entry.compiledInto ?? []).join(", ") || "belum dipetakan";
      add("STALE", entry.path, `berubah sejak kompilasi; terdampak: ${into}`);
    }
  }

  // Sumbu kelas A.
  for (const entry of watched) {
    const full = entry.path.startsWith("~/") ? path.join(process.env.HOME ?? "", entry.path.slice(2)) : path.join(ROOT, entry.path);
    if (!fs.existsSync(full)) {
      add("MISS", entry.path, "file konteks harness tidak ditemukan");
      continue;
    }
    if (sha(fs.readFileSync(full)) !== entry.sha256) {
      add("HARNESS-CHANGED", entry.path, "instruksi harness berubah; tinjau apakah pack masih akurat");
    }
  }

  // Path yang dirujuk pack.
  for (const [value, from] of referencedPaths()) {
    if (!fs.existsSync(path.join(ROOT, value))) add("MISS", value, `dirujuk oleh ${from.replace(".pi/stapler/", "")}`);
  }

  // Integritas index ADR.
  const adrDir = compiled.map((entry) => entry.path).find((p) => p.endsWith("/adr") || p.endsWith("/adr/"));
  if (adrDir) {
    const indexFile = path.join(ROOT, adrDir, "README.md");
    if (!fs.existsSync(indexFile)) add("MISS", `${adrDir}/README.md`, "index ADR tidak ditemukan");
    else {
      const indexText = fs.readFileSync(indexFile, "utf8");
      const adrFiles = fs.readdirSync(path.join(ROOT, adrDir)).filter((file) => /^\d{4}-.+\.md$/.test(file));
      for (const file of adrFiles) {
        if (!indexText.includes(`(${file})`)) add("MISS", `${adrDir}/${file}`, "ADR ada tetapi belum terdaftar di index");
      }
    }
  }

  // Deviasi yang standarnya berubah.
  const staleSources = new Set(findings.filter((f) => f.code === "STALE").map((f) => f.path));
  for (const deviation of deviationsFromPack()) {
    for (const standard of deviation.standards) {
      if (staleSources.has(standard)) {
        add("DEVIATION-STALE", standard, `deviasi "${deviation.topic}" mungkin tidak lagi relevan karena standarnya berubah`);
      }
    }
  }

  // Sumbu kode: HEAD, baseline, dan langkah pasca-pull.
  const head = git(["rev-parse", "--short", "HEAD"]);
  if (head.ok) {
    const current = head.out;
    const baseline = fs.existsSync(VERIFICATION_PATH)
      ? JSON.parse(fs.readFileSync(VERIFICATION_PATH, "utf8")).baseline ?? {}
      : {};
    if (provenance.head && provenance.head !== current) {
      notes.push(`HEAD bergerak sejak kompilasi: ${provenance.head} -> ${current}. Jalankan refresh kalau ada sumber yang berubah.`);
    }
    if (baseline.head && baseline.head !== current) {
      const changed = git(["diff", "--name-only", `${baseline.head}..HEAD`]);
      const files = changed.ok ? changed.out.split("\n").filter(Boolean) : [];
      notes.push(`baseline diukur di HEAD ${baseline.head}, sekarang ${current} (${files.length} file berubah)`);
      if (files.some((file) => /^package(-lock)?\.json$/.test(file))) {
        notes.push("package.json berubah: jalankan npm install");
      }
      if (files.includes("prisma/schema.prisma")) {
        notes.push("prisma/schema.prisma berubah: jalankan npm run db:generate, sinkronkan DB lokal, lalu restart dev server");
      }
    }
  } else {
    notes.push("bukan repo git: pemeriksaan HEAD dilewati");
  }

  return report(findings, notes, json);
}

function report(findings, notes, json) {
  const wajib = findings.filter((f) => f.code !== "WARN");
  const ok = wajib.length === 0;

  if (json) {
    console.log(JSON.stringify({ ok, findings, notes }, null, 2));
  } else {
    const lines = ["== check context pack =="];
    if (findings.length === 0) lines.push("  OK      tidak ada temuan");
    for (const finding of findings) lines.push(`  ${finding.code.padEnd(16)} ${finding.path} - ${finding.detail}`);
    for (const note of notes) lines.push(`  WARN    ${note}`);
    lines.push("");
    lines.push(ok ? "  pack akurat: aman dipakai" : `  pack perlu perhatian: ${wajib.length} temuan wajib`);
    if (!ok) lines.push("  jalankan stapler-context refresh untuk mengompilasi ulang");
    console.log(lines.join("\n"));
  }

  process.exit(ok ? 0 : 1);
}

main();
