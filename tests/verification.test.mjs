// Tes kontrak verifier. Dipakai supaya gate-nya bisa dipercaya: gate yang tidak pernah diuji akan
// diam-diam selalu hijau.
//
// Jalankan: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERIFIER = path.join(PACKAGE_ROOT, "templates/pack/verification.mjs");
const MANIFEST_TEMPLATE = path.join(PACKAGE_ROOT, "templates/pack/manifest.json");

const FAKE_LINT = `import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(".pi/stapler/fake-lint.json", "utf8"));
const abs = (p) => new URL(p, \`file://\${process.cwd()}/\`).pathname;
let errors = 0;
for (const [file, count] of Object.entries(spec)) {
  if (count === 0) continue;
  console.log(abs(file));
  for (let i = 0; i < count; i += 1) console.log(\`  \${i + 1}:1  error  Pesan palsu  rule-\${i}\`);
  console.log();
  errors += count;
}
console.log(\`\\u2716 \${errors} problems (\${errors} errors, 0 warnings)\`);
`;

const FAKE_LINT_JSON = `import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(".pi/stapler/fake-lint.json", "utf8"));
const abs = (p) => new URL(p, \`file://\${process.cwd()}/\`).pathname;
const results = Object.entries(spec).map(([file, count]) => ({
  filePath: abs(file),
  errorCount: count,
  warningCount: 0,
}));
const errors = results.reduce((sum, item) => sum + item.errorCount, 0);
console.log(JSON.stringify(results));
process.exit(errors > 0 ? 1 : 0);
`;

const FAKE_LINT_PLAIN = `import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(".pi/stapler/fake-lint.json", "utf8"));
let errors = 0;
for (const [file, count] of Object.entries(spec)) {
  console.log(\`\${file}:\${count}\`);
  errors += count;
}
process.exit(errors > 0 ? 1 : 0);
`;

const FAKE_LINT_NOISY = `import fs from "node:fs";
const spec = JSON.parse(fs.readFileSync(".pi/stapler/fake-lint.json", "utf8"));
const abs = (p) => new URL(p, \`file://\${process.cwd()}/\`).pathname;
const results = Object.entries(spec).map(([file, count]) => ({ filePath: abs(file), errorCount: count, warningCount: 0 }));
process.stdout.write(JSON.stringify(results));
process.stderr.write("npm notice run eslint --format json\\n");
process.exit(1);
`;

// Parser custom contoh: membaca keluaran "path:jumlah" satu per baris.
const CUSTOM_PARSER = `export default function parse(output) {
  const files = {};
  let errors = 0;
  for (const line of output.trim().split("\\n").filter(Boolean)) {
    const [file, count] = line.split(":");
    const value = Number(count);
    if (value > 0) {
      files[file] = value;
      errors += value;
    }
  }
  return { errors, warnings: 0, files };
}
`;

function git(dir, args) {
  return spawnSync("git", args, { cwd: dir, encoding: "utf8" });
}

/** Buat repo sementara berisi pack minimal, supaya gate bisa diuji tanpa project nyata. */
function fixture({ lint = true, lintFormat = "stylish", lintConfig = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stapler-test-"));
  fs.mkdirSync(path.join(dir, ".pi/stapler"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_TEMPLATE, "utf8"));
  manifest.projectName = "test-fixture";
  const lintScript =
    lintFormat === "json" || lintFormat === "json-with-noise"
      ? lintFormat === "json"
        ? "fake-lint-json.mjs"
        : "fake-lint-json-noisy.mjs"
      : lintFormat === "plain"
        ? "fake-lint-plain.mjs"
        : "fake-lint.mjs";
  manifest.commands = {
    format: null,
    typecheck: null,
    lint: lint ? `node .pi/stapler/${lintScript}` : null,
    test: null,
    build: null,
  };
  manifest.lint = { ...manifest.lint, ...lintConfig };
  fs.writeFileSync(path.join(dir, ".pi/stapler/manifest.json"), JSON.stringify(manifest, null, 2));
  fs.copyFileSync(VERIFIER, path.join(dir, ".pi/stapler/verification.mjs"));

  if (lint) {
    const script =
      lintFormat === "json"
        ? FAKE_LINT_JSON
        : lintFormat === "json-with-noise"
          ? FAKE_LINT_NOISY
          : lintFormat === "plain"
            ? FAKE_LINT_PLAIN
            : FAKE_LINT;
    fs.writeFileSync(path.join(dir, ".pi/stapler", lintScript), script);
    fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/legacy.ts": 1 }));
    if (lintConfig.parserPath) {
      fs.writeFileSync(path.join(dir, lintConfig.parserPath), CUSTOM_PARSER);
    }
  }

  fs.writeFileSync(path.join(dir, "src/app.ts"), "export const app = 1;\n");
  fs.writeFileSync(path.join(dir, "src/legacy.ts"), "export const legacy = 1;\n");
  git(dir, ["init", "-q"]);
  git(dir, ["-c", "user.email=t@t", "-c", "user.name=t", "add", "-A"]);
  git(dir, ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"]);
  return dir;
}

function verify(dir, args = []) {
  const result = spawnSync(process.execPath, [".pi/stapler/verification.mjs", ...args], {
    cwd: dir,
    encoding: "utf8",
  });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

test("baseline yang belum tercatat dilaporkan, bukan dianggap regresi", () => {
  const dir = fixture();
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 0);
  assert.match(out, /WARN\s+lint.*baseline belum tercatat/);
});

test("tanpa scope, gate scope dilewati dan hasilnya hijau", () => {
  const dir = fixture();
  const { code, out } = verify(dir);
  assert.equal(code, 0);
  assert.match(out, /SKIP\s+scope/);
});

test("file berubah di luar scope menggagalkan gate dan keluar dengan exit 1", () => {
  const dir = fixture();
  fs.writeFileSync(path.join(dir, "catatan.txt"), "x\n");
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 1);
  assert.match(out, /FAIL\s+scope.*catatan\.txt/);
});

test("artefak pack sendiri tidak pernah dianggap perubahan", () => {
  const dir = fixture();
  fs.writeFileSync(path.join(dir, "src/app.ts"), "export const app = 2;\n");
  verify(dir, ["--scope", "src/app.ts"]);
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 0);
  assert.doesNotMatch(out, /verification\.json/);
});

test("gate yang belum dideklarasikan dilaporkan skip, bukan hijau", () => {
  const dir = fixture({ lint: false });
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 0);
  assert.match(out, /SKIP\s+lint\s+perintah belum dideklarasikan/);
  assert.match(out, /SKIP\s+test/);
});

test("regresi lint terdeteksi walau total error tidak berubah", () => {
  const dir = fixture();
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);

  // Total tetap 1, tapi error berpindah ke file yang sedang dikerjakan. Perbandingan total saja akan lolos.
  fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/legacy.ts": 0, "src/app.ts": 1 }));
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 1);
  assert.match(out, /FAIL\s+lint.*error baru: src\/app\.ts naik dari 0 ke 1/);
});

test("error baru hanya di luar scope dilaporkan sebagai catatan, bukan regresi", () => {
  const dir = fixture();
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  fs.writeFileSync(
    path.join(dir, ".pi/stapler/fake-lint.json"),
    JSON.stringify({ "src/legacy.ts": 1, "src/tim.ts": 3 }),
  );
  const { code, out } = verify(dir, ["--scope", "src/app.ts"]);
  assert.equal(code, 0);
  assert.match(out, /WARN\s+lint/);
});

test("keluaran --json bisa dibaca mesin dan memuat daftar gate", () => {
  const dir = fixture();
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 0);
  const parsed = JSON.parse(out);
  assert.equal(parsed.ok, true);
  const names = parsed.gates.map((gate) => gate.name);
  for (const expected of ["scope", "format", "typecheck", "lint", "test", "build"]) {
    assert.ok(names.includes(expected), `gate ${expected} hilang`);
  }
});

test("parser eslint-json mendeteksi regresi per file seperti parser stylish", () => {
  const dir = fixture({ lintFormat: "json" });
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/legacy.ts": 0, "src/app.ts": 1 }));
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 1);
  const parsed = JSON.parse(out);
  const lint = parsed.gates.find((gate) => gate.name === "lint");
  assert.equal(lint.parser, "eslint-json");
  assert.match(lint.detail, /src\/app\.ts naik dari 0 ke 1/);
});

test("parser custom dari project dipakai saat lint.parser bernilai custom", () => {
  const dir = fixture({
    lintFormat: "plain",
    lintConfig: { parser: "custom", parserPath: ".pi/stapler/lint-parser.mjs" },
  });
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/legacy.ts": 0, "src/app.ts": 2 }));
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 1);
  const lint = JSON.parse(out).gates.find((gate) => gate.name === "lint");
  assert.equal(lint.parser, "custom");
  assert.match(lint.detail, /src\/app\.ts naik dari 0 ke 2/);
});

test("mode exit-only tidak pernah menggagalkan gate karena isi, dan menyebut batasannya", () => {
  const dir = fixture({ lintFormat: "plain", lintConfig: { parser: "exit-only" } });
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/app.ts": 5 }));
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 0);
  const lint = JSON.parse(out).gates.find((gate) => gate.name === "lint");
  assert.equal(lint.parser, "exit-only");
  assert.match(lint.detail, /perbandingan per file tidak tersedia/);
});

test("parse yang tidak dikenali dilaporkan sebagai keterbatasan, bukan hijau", () => {
  const dir = fixture({ lintFormat: "plain", lintConfig: { parser: "eslint-stylish" } });
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 0);
  const lint = JSON.parse(out).gates.find((gate) => gate.name === "lint");
  assert.equal(lint.parser, "none");
  assert.match(lint.detail, /hasil tidak terbaca.*set lint\.parser/);
});

test("JSON lint tetap terbaca walau stderr ditempel di belakangnya", () => {
  const dir = fixture({ lintFormat: "json-with-noise" });
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 0);
  const lint = JSON.parse(out).gates.find((gate) => gate.name === "lint");
  assert.equal(lint.parser, "eslint-json");
  assert.match(lint.detail, /1 error/);
});

test("file di lint.ignoreFiles tidak masuk perbandingan", () => {
  const dir = fixture({ lintFormat: "json", lintConfig: { ignoreFiles: ["src/legacy.ts"] } });
  const { code, out } = verify(dir, ["--scope", "src/app.ts", "--json"]);
  assert.equal(code, 0);
  const lint = JSON.parse(out).gates.find((gate) => gate.name === "lint");
  assert.match(lint.detail, /1 file diabaikan oleh lint\.ignoreFiles/);
});

test("baseline tidak ditulis kalau hasil lint tidak terbaca", () => {
  const dir = fixture({ lintFormat: "plain", lintConfig: { parser: "eslint-stylish" } });
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  const state = JSON.parse(fs.readFileSync(path.join(dir, ".pi/stapler/verification.json"), "utf8"));
  assert.ok(!state.baseline || state.baseline.errors === null || state.baseline.files === undefined);
});

test("scope dari artefak run dipakai, dan hasil verifikasi ditulis balik ke artefak itu", () => {
  const dir = fixture();
  fs.mkdirSync(path.join(dir, ".pi/stapler/runs"), { recursive: true });
  const runPath = ".pi/stapler/runs/2026-10-06-demo.json";
  fs.writeFileSync(
    path.join(dir, runPath),
    JSON.stringify({ schemaVersion: 1, slug: "demo", scope: ["src/app.ts"], acc: "first" }, null, 2),
  );

  fs.writeFileSync(path.join(dir, "catatan.txt"), "x\n");
  const gagal = verify(dir, ["--scope-from", runPath]);
  assert.equal(gagal.code, 1);
  assert.match(gagal.out, /FAIL\s+scope.*catatan\.txt/);

  fs.rmSync(path.join(dir, "catatan.txt"));
  const hijau = verify(dir, ["--scope-from", runPath]);
  assert.equal(hijau.code, 0);

  const written = JSON.parse(fs.readFileSync(path.join(dir, runPath), "utf8"));
  assert.equal(written.verification.exit, 0);
  assert.match(written.verification.head, /^[0-9a-f]{7,}$/);
  assert.ok(Array.isArray(written.verification.gates));
  assert.equal(written.slug, "demo");
  assert.equal("delegations" in written, false, "run lama tidak membutuhkan field delegations");
});

test("catatan delegasi dipertahankan tanpa menggantikan gate verifier", (t) => {
  const dir = fixture({ lint: false });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, ".pi/stapler/runs"), { recursive: true });
  const runPath = ".pi/stapler/runs/delegasi.json";
  const fullPath = path.join(dir, runPath);
  const delegations = [
    { id: "scout-1", agent: "scout", profile: "impact", status: "completed", assessment: "Bukti diperiksa." },
    { id: "review-1", agent: "reviewer", profile: "change-review", status: "failed", assessment: "Fallback review sendiri." },
    { id: "implementation-1", agent: "implementer", profile: "implement-approved", status: "cancelled", assessment: "Perubahan parsial diperiksa parent." },
    { id: null, agent: "reviewer", profile: "scope-review", status: "skipped", assessment: "Scope sederhana." },
  ];
  fs.writeFileSync(fullPath, JSON.stringify({ schemaVersion: 1, scope: ["src/app.ts"], delegations }));

  fs.writeFileSync(path.join(dir, "catatan.txt"), "di luar scope\n");
  assert.equal(verify(dir, ["--scope-from", runPath]).code, 1);
  const failed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  assert.equal(failed.verification.exit, 1);
  assert.deepEqual(failed.delegations, delegations);

  fs.rmSync(path.join(dir, "catatan.txt"));
  assert.equal(verify(dir, ["--scope-from", runPath]).code, 0);
  const passed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  assert.equal(passed.verification.exit, 0);
  assert.deepEqual(passed.delegations, delegations);
});

test("artefak run tanpa scope dilaporkan sebagai kesalahan yang jelas", () => {
  const dir = fixture();
  fs.mkdirSync(path.join(dir, ".pi/stapler/runs"), { recursive: true });
  const runPath = ".pi/stapler/runs/kosong.json";
  fs.writeFileSync(path.join(dir, runPath), JSON.stringify({ schemaVersion: 1, scope: [] }));
  const hasil = verify(dir, ["--scope-from", runPath]);
  assert.equal(hasil.code, 1);
  assert.match(hasil.out, /tidak memuat scope/);
});

test("refresh baseline menyimpan riwayat dan melaporkan delta", () => {
  const dir = fixture();
  verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  const pertama = JSON.parse(fs.readFileSync(path.join(dir, ".pi/stapler/verification.json"), "utf8"));
  assert.equal(pertama.baselineHistory.length, 1);
  assert.equal(pertama.baselineHistory[0].errors, 1);

  fs.writeFileSync(path.join(dir, ".pi/stapler/fake-lint.json"), JSON.stringify({ "src/legacy.ts": 3 }));
  const out = verify(dir, ["--refresh-baseline", "--scope", "src/app.ts"]);
  const kedua = JSON.parse(fs.readFileSync(path.join(dir, ".pi/stapler/verification.json"), "utf8"));
  assert.equal(kedua.baselineHistory.length, 2);
  assert.equal(kedua.baselineDelta.errors, 2);
  assert.match(out.out, /delta baseline: naik 2 error/);
  assert.match(out.out, /baseline naik 2 error/);
});

test("template manifest tetap JSON yang sah dan memuat field kontrak", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_TEMPLATE, "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.rawReads, "index-only");
  assert.ok(Array.isArray(manifest.precedence));
  assert.equal(manifest.precedence[0], "safety-floor");
  assert.ok(manifest.format.ignore.includes(".pi/**"));
  assert.equal(manifest.lint.parser, "auto");
});
