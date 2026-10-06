// Tes untuk check.mjs dan provenance.mjs: tanpa ini, pemeriksa kebasian tidak bisa dipercaya.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = path.join(PACKAGE_ROOT, "templates/pack/check.mjs");
const PROVENANCE = path.join(PACKAGE_ROOT, "templates/pack/provenance.mjs");

function fixture({ withAdr = true, withDeviation = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stapler-check-"));
  fs.mkdirSync(path.join(dir, ".pi/stapler/standards"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "standards/team"), { recursive: true });
  fs.writeFileSync(path.join(dir, "standards/team/frontend.md"), "# Standar frontend\n");
  fs.writeFileSync(path.join(dir, "docs.md"), "# Dokumen\n");
  fs.writeFileSync(path.join(dir, "src/app.ts"), "export const app = 1;\n");

  const manifest = {
    schemaVersion: 1,
    projectName: "check-fixture",
    rawReads: "index-only",
    commands: { format: null, typecheck: null, lint: null, test: null, build: null },
    format: { ignore: [".pi/**"] },
    lint: { parser: "auto", ignoreFiles: [".pi/**"], baseline: {} },
    scope: { paths: [], always: [".pi/**"] },
    sources: [
      { path: "standards/team/frontend.md", role: "authoritative" },
      { path: "docs.md", role: "reference-only" },
    ],
    harnessInjected: [{ path: "AGENTS.md", scope: "project" }],
  };
  if (withAdr) manifest.sources.push({ path: ".pi/adr", role: "authoritative" });

  fs.writeFileSync(path.join(dir, ".pi/stapler/manifest.json"), JSON.stringify(manifest, null, 2));
  fs.copyFileSync(CHECK, path.join(dir, ".pi/stapler/check.mjs"));
  fs.copyFileSync(PROVENANCE, path.join(dir, ".pi/stapler/provenance.mjs"));
  fs.writeFileSync(
    path.join(dir, ".pi/stapler/rules.md"),
    "# Aturan\n\n- Contoh rujukan: `src/app.ts`\n",
  );
  fs.writeFileSync(
    path.join(dir, ".pi/stapler/deviations.md"),
    `# Deviasi\n\n| Topik | Standar tim | Yang dipakai | Alasan | Risiko | Terlihat tim | Penegak |\n| --- | --- | --- | --- | --- | --- | --- |\n${
      withDeviation ? "| icons | .kiro/steering/frontend-architecture.md | solar | preferensi | rendah | ya | none |\n" : ""
    }\n`,
  );
  if (withAdr) {
    fs.mkdirSync(path.join(dir, ".pi/adr"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".pi/adr/0001-keputusan.md"), "# ADR 1\n");
    fs.writeFileSync(path.join(dir, ".pi/adr/README.md"), "| ADR |\n| --- |\n| [0001](0001-keputusan.md) |\n");
  }
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Instruksi harness\n");

  const git = (args) => spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd: dir, encoding: "utf8" });
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["commit", "-qm", "init"]);

  const run = (script, args = []) =>
    spawnSync(process.execPath, [`.pi/stapler/${script}`, ...args], { cwd: dir, encoding: "utf8" });
  run("provenance.mjs");
  return { dir, run };
}

test("check melaporkan pack bersih setelah provenance ditulis", () => {
  const { run } = fixture();
  const result = run("check.mjs");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /tidak ada temuan/);
});

test("perubahan isi file di dalam folder sumber terdeteksi sebagai STALE", () => {
  const { dir, run } = fixture();
  // docs.md adalah file tunggal; ubah isinya.
  fs.writeFileSync(path.join(dir, "docs.md"), "# Dokumen berubah\n");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /STALE\s+docs\.md/);
});

test("perubahan isi file di dalam direktori sumber juga terdeteksi", () => {
  const { dir, run } = fixture();
  const adr = path.join(dir, ".pi/adr/0001-keputusan.md");
  fs.writeFileSync(adr, "# ADR 1 (diubah)\n");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /STALE\s+\.pi\/adr/);
});

test("perubahan file konteks harness dilaporkan sebagai HARNESS-CHANGED", () => {
  const { dir, run } = fixture();
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Instruksi harness (berubah)\n");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /HARNESS-CHANGED\s+AGENTS\.md/);
});

test("ADR yang belum terdaftar di index dilaporkan sebagai MISS", () => {
  const { dir, run } = fixture();
  fs.writeFileSync(path.join(dir, ".pi/adr/0002-belum-terdaftar.md"), "# ADR 2\n");
  fs.rmSync(path.join(dir, ".pi/stapler/provenance.json"));
  run("provenance.mjs");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /MISS\s+\.pi\/adr\/0002-belum-terdaftar\.md/);
});

test("path yang dirujuk pack tapi tidak ada dilaporkan sebagai MISS", () => {
  const { dir, run } = fixture();
  fs.writeFileSync(path.join(dir, ".pi/stapler/rules.md"), "# Aturan\n\n- Rujukan hilang: `src/tidak-ada.ts`\n");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /MISS\s+src\/tidak-ada\.ts/);
});

test("standar yang berubah memunculkan DEVIATION-STALE", () => {
  const { dir, run } = fixture();
  fs.mkdirSync(path.join(dir, ".kiro/steering"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".kiro/steering/frontend-architecture.md"), "# Standar\n");
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, ".pi/stapler/manifest.json"), "utf8"));
  manifest.sources.push({ path: ".kiro/steering/frontend-architecture.md", role: "authoritative" });
  fs.writeFileSync(path.join(dir, ".pi/stapler/manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(dir, ".pi/stapler/deviations.md"),
    "# Deviasi\n\n| Topik | Standar tim | Yang dipakai | Alasan | Risiko | Terlihat tim | Penegak |\n| --- | --- | --- | --- | --- | --- | --- |\n| icons | .kiro/steering/frontend-architecture.md | solar | preferensi | rendah | ya | none |\n",
  );
  run("provenance.mjs");
  assert.equal(run("check.mjs").status, 0);

  fs.writeFileSync(path.join(dir, ".kiro/steering/frontend-architecture.md"), "# Standar (berubah)\n");
  const result = run("check.mjs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /DEVIATION-STALE\s+\.kiro\/steering\/frontend-architecture\.md/);
});

test("provenance mempertahankan compiledInto dan menandai file manual", () => {
  const { dir, run } = fixture();
  const provenancePath = path.join(dir, ".pi/stapler/provenance.json");
  const provenance = JSON.parse(fs.readFileSync(provenancePath, "utf8"));
  assert.equal(provenance.sources.find((s) => s.path === "docs.md").compiledInto.length, 0);
  assert.ok(provenance.sources.find((s) => s.path === ".pi/stapler/manifest.json").manual);
  assert.ok(provenance.sources.find((s) => s.path === "AGENTS.md").watched);
  assert.equal(run("provenance.mjs").status, 0);
});
