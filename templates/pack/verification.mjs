#!/usr/bin/env node
// Verifier Stapler, kontrak v1. Lihat docs/design.md bagian 13.
//
// Jalankan dari root project:
//   node .pi/stapler/verification.mjs                       # gate cepat
//   node .pi/stapler/verification.mjs --scope "a.ts,b.tsx"   # tambah gate scope
//   node .pi/stapler/verification.mjs --with-build           # tambah gate build (lambat)
//   node .pi/stapler/verification.mjs --json                 # keluaran mesin
//   node .pi/stapler/verification.mjs --refresh-baseline     # catat baseline baru, tidak menggagalkan gate
//   node .pi/stapler/verification.mjs --list-gates           # tampilkan gate dan perintahnya
//
// Exit 0: semua gate hijau, atau merah yang terbukti sudah ada sebelum perubahan.
// Exit 1: ada regresi, atau ada file berubah di luar scope.
//
// Semua konfigurasi dibaca dari manifest.json. Skrip ini tidak boleh tahu nama folder project.
//
// Catatan perilaku:
// - Gate format melewati path di `format.ignore` (default `.pi/**`), karena artefak workflow tidak perlu diformat.
// - Gate scope mengabaikan path di `scope.always`, termasuk hasil verifier sendiri.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const PACK_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(PACK_DIR, "..", "..");
const MANIFEST_PATH = path.join(PACK_DIR, "manifest.json");
const RESULT_PATH = path.join(PACK_DIR, "verification.json");

const FORMAT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css", ".scss", ".html"];

const options = { scope: [], withBuild: false, json: false, refresh: false, listGates: false };

function parseArgs(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--with-build") options.withBuild = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--refresh-baseline") options.refresh = true;
    else if (arg === "--list-gates") options.listGates = true;
    else if (arg === "--scope") options.scope = (argv[i + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ?? null,
  };
}

function runWithInput(command, args, input) {
  const result = spawnSync(command, args, { cwd: ROOT, input, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ?? null,
  };
}

function git(args) {
  return run("git", args);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function manifest() {
  const raw = readJson(MANIFEST_PATH, null);
  if (!raw) {
    console.error(`Manifest tidak ditemukan atau tidak bisa dibaca: ${MANIFEST_PATH}`);
    console.error("Jalankan skill stapler-context mode init lebih dulu.");
    process.exit(1);
  }
  return {
    schemaVersion: raw.schemaVersion ?? 1,
    projectName: raw.projectName ?? path.basename(ROOT),
    commands: raw.commands ?? {},
    cleanupPaths: raw.cleanupPaths ?? [],
    lint: raw.lint ?? {},
    scope: raw.scope ?? { paths: [], always: [] },
    ...raw,
  };
}

/** File yang berubah relatif ke HEAD, termasuk yang belum di-track dan yang dihapus. */
function changedFiles() {
  const status = git(["status", "--porcelain=v1", "-uall"]);
  if (status.status !== 0) return [];
  return status.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const body = line.slice(3);
      const renamed = body.split(" -> ");
      return renamed[renamed.length - 1].replace(/^"|"$/g, "");
    });
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => {
    if (pattern.endsWith("/**")) return file === pattern.slice(0, -3) || file.startsWith(pattern.slice(0, -2));
    return file === pattern;
  });
}

function cleanup(paths, notes) {
  for (const relative of paths) {
    const target = path.join(ROOT, relative);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      notes.push(`${relative} dibersihkan (artefak build bisa memalsukan hasil typecheck)`);
    }
  }
}

/**
 * Gate format memakai `commands.format` dari manifest, dijalankan per file: COMMAND <file>.
 * Tiga hasil dibedakan supaya pesannya tidak menyesatkan: belum rapi, tidak bisa di-parse (kode rusak,
 * bukan masalah format), dan skip kalau alatnya tidak bisa dijalankan.
 *
 * Deteksi "sudah gagal di HEAD" hanya jalan kalau `format.headProbe` dideklarasikan, karena caranya berbeda
 * per formatter. Untuk prettier: `npx prettier --stdin-filepath`, lalu bandingkan keluarannya dengan isi HEAD.
 */
function formatGate(files, config, ignorePatterns) {
  const command = config.commands?.format;
  if (!command) return { status: "skip", detail: "perintah format belum dideklarasikan di manifest" };

  const [bin, ...prefix] = command.split(" ").filter(Boolean);
  const headProbe = config.format?.headProbe ?? null;
  const targets = files
    .filter((file) => FORMAT_EXTENSIONS.includes(path.extname(file)))
    .filter((file) => !matchesAny(file, ignorePatterns))
    .filter((file) => fs.existsSync(path.join(ROOT, file)));
  if (targets.length === 0) return { status: "skip", detail: "tidak ada file yang perlu diformat" };

  const belumRapi = [];
  const tidakBisaDiParse = [];
  const sudahGagalDiHead = [];
  const catatan = [];

  for (const file of targets) {
    const result = run(bin, [...prefix, file]);
    if (result.status === 0) continue;
    if (result.error?.code === "ENOENT") {
      return { status: "skip", detail: `alat format tidak bisa dijalankan: ${command}` };
    }

    const output = `${result.stdout}${result.stderr}`;
    if (/SyntaxError|Cannot parse|Unexpected token|Unexpected keyword/i.test(output)) {
      tidakBisaDiParse.push(file);
      continue;
    }
    if (headProbe && sudahGagalDiHeadJuga(file, headProbe)) {
      sudahGagalDiHead.push(file);
      catatan.push(`${file}: sudah gagal format di HEAD, bukan regresi dari perubahan ini`);
      continue;
    }
    belumRapi.push(file);
  }

  if (tidakBisaDiParse.length > 0) {
    return {
      status: "fail",
      detail: `tidak bisa di-parse, ini bukan masalah format: ${tidakBisaDiParse.join(", ")}`,
      files: tidakBisaDiParse,
      notes: catatan,
    };
  }
  if (belumRapi.length > 0) {
    if (!headProbe) {
      catatan.push("kalau file di atas sudah gagal sebelum perubahan ini, tambahkan ke format.ignore atau set format.headProbe");
    }
    return { status: "fail", detail: `belum rapi: ${belumRapi.join(", ")}`, files: belumRapi, notes: catatan };
  }
  const detail =
    sudahGagalDiHead.length > 0
      ? `${targets.length} file, ${sudahGagalDiHead.length} sudah gagal di HEAD`
      : `${targets.length} file`;
  return { status: "pass", detail, notes: catatan };
}

/** Bandingkan hasil formatter atas isi HEAD dengan isi HEAD itu sendiri. */
function sudahGagalDiHeadJuga(file, headProbeCommand) {
  const head = git(["show", `HEAD:${file}`]);
  if (head.status !== 0) return false;
  const [bin, ...prefix] = headProbeCommand.split(" ").filter(Boolean);
  const result = runWithInput(bin, [...prefix, file], head.stdout);
  if (result.status !== 0 || result.stdout.length === 0) return false;
  return result.stdout !== head.stdout;
}

/** Ringkasan eslint gaya stylish: "✖ 14 problems (14 errors, 0 warnings)". */
function parseLintSummary(output) {
  const match = output.match(/✖\s*(\d+)\s*problems?\s*\((\d+)\s*errors?,\s*(\d+)\s*warnings?\)/);
  if (!match) return null;
  return { problems: Number(match[1]), errors: Number(match[2]), warnings: Number(match[3]) };
}

/** Error per file dari blok stylish: baris path absolut diikuti baris "12:3  error  pesan". */
function parseLintPerFile(output) {
  const counts = {};
  let current = null;
  for (const line of output.split("\n")) {
    if (line.startsWith("/")) {
      current = path.relative(ROOT, line.trim());
      continue;
    }
    if (current && /\s+error\s+/.test(line)) counts[current] = (counts[current] ?? 0) + 1;
    if (line.trim() === "") current = null;
  }
  return counts;
}

/* ---------------------------------------------------------------- parser lint
 * Dipilih lewat `lint.parser` di manifest:
 *   auto            coba eslint-json, lalu eslint-stylish (default)
 *   eslint-json     eslint dengan `--format json`; paling tahan terhadap perubahan format teks
 *   eslint-stylish  keluaran teks bawaan eslint
 *   exit-only       hanya exit code, tanpa rincian per file
 *   custom          modul di `lint.parserPath`, default export (output, ctx) => hasil
 *
 * Linter lain (biome, ruff, golangci-lint) tidak diparsing di sini. Pakai mode `custom` dengan
 * keluaran JSON dari linter itu, atau `exit-only` kalau rincian per file tidak dibutuhkan.
 */

/** eslint --format json: array hasil per file. */
function parseLintJson(candidates) {
  for (const raw of candidates) {
    if (!raw) continue;
    const start = raw.indexOf("[");
    if (start === -1) continue;
    // Kandidat akhir: sampai ujung keluaran, atau sampai bracket penutup terakhir.
    // Diperlukan karena stderr bisa ditempel setelah JSON (mis. baris "npm notice").
    for (const end of [raw.length, raw.lastIndexOf("]") + 1]) {
      if (end <= start) continue;
      try {
        const data = JSON.parse(raw.slice(start, end));
        if (!Array.isArray(data)) continue;
        const files = {};
        let errors = 0;
        let warnings = 0;
        for (const item of data) {
          const errorsHere = Number(item?.errorCount ?? 0);
          const warningsHere = Number(item?.warningCount ?? 0);
          errors += errorsHere;
          warnings += warningsHere;
          if (errorsHere > 0 && typeof item?.filePath === "string") {
            const file = path.relative(ROOT, item.filePath);
            files[file] = (files[file] ?? 0) + errorsHere;
          }
        }
        return { errors, warnings, files };
      } catch {
        // coba kandidat berikutnya
      }
    }
  }
  return null;
}

async function parseLintCustom(output, parserPath) {
  try {
    const module = await import(pathToFileURL(path.join(ROOT, parserPath)).href);
    const parse = module.default ?? module.parse;
    if (typeof parse !== "function") return null;
    const result = parse(output, { root: ROOT, relative: (p) => path.relative(ROOT, p) });
    if (!result || typeof result !== "object") return null;
    return {
      errors: Number(result.errors ?? 0),
      warnings: Number(result.warnings ?? 0),
      files: result.files ?? {},
    };
  } catch {
    return null;
  }
}

function emptyParse(mode) {
  return { mode, errors: null, warnings: null, files: {} };
}

/** Buang file yang tidak relevan (mis. artefak workflow atau clone paket) dari perbandingan per file. */
function filterIgnoredFiles(parsed, ignorePatterns) {
  const kept = {};
  let ignored = 0;
  for (const [file, count] of Object.entries(parsed.files ?? {})) {
    if (matchesAny(file, ignorePatterns)) ignored += 1;
    else kept[file] = count;
  }
  return { ...parsed, files: kept, ignoredFiles: ignored };
}

async function parseLint(output, config, stdout) {
  const strategy = config.lint?.parser ?? "auto";

  const asJson = () => {
    const parsed = parseLintJson([stdout, output]);
    return parsed ? { mode: "eslint-json", ...parsed } : null;
  };
  const asStylish = () => {
    const summary = parseLintSummary(output);
    const files = parseLintPerFile(output);
    if (summary === null && Object.keys(files).length === 0) return null;
    return {
      mode: "eslint-stylish",
      errors: summary?.errors ?? null,
      warnings: summary?.warnings ?? null,
      files,
    };
  };

  if (strategy === "exit-only") return emptyParse("exit-only");
  if (strategy === "eslint-json") return asJson() ?? emptyParse("none");
  if (strategy === "eslint-stylish") return asStylish() ?? emptyParse("none");
  if (strategy === "custom") {
    if (!config.lint?.parserPath) return emptyParse("none");
    const custom = await parseLintCustom(output, config.lint.parserPath);
    return custom ? { mode: "custom", ...custom } : emptyParse("none");
  }
  return asJson() ?? asStylish() ?? emptyParse("none");
}

function compareLintPerFile(nowCounts, baselineCounts, scopedFiles) {
  const regressions = [];
  const preExisting = [];
  for (const [file, count] of Object.entries(nowCounts)) {
    const before = baselineCounts[file] ?? 0;
    if (count <= before) {
      preExisting.push(`${file} (${count}, baseline ${before})`);
      continue;
    }
    // Tanpa scope, regresi tidak bisa dibedakan dari kondisi awal. Dilaporkan sebagai catatan saja.
    const touched = scopedFiles.length > 0 && matchesAny(file, scopedFiles);
    if (touched) regressions.push(`${file} naik dari ${before} ke ${count}`);
    else preExisting.push(`${file} (di luar scope, ${count}, baseline ${before})`);
  }
  return { regressions, preExisting };
}

async function main() {
  parseArgs(process.argv.slice(2));
  const config = manifest();
  const gates = [];
  const notes = [];
  const problems = [];
  const previous = readJson(RESULT_PATH, {});

  const branch = git(["branch", "--show-current"]).stdout.trim() || "(tanpa branch)";
  const head = git(["rev-parse", "--short", "HEAD"]).stdout.trim();
  const changed = changedFiles();

  const declaredGates = Object.entries(config.commands ?? {}).map(([name, command]) => ({
    name,
    command,
    enabled: Boolean(command) && (name !== "build" || options.withBuild),
  }));

  if (options.listGates) {
    const lines = [`# gate yang dideklarasikan (${config.projectName}, skema ${config.schemaVersion})`];
    for (const gate of declaredGates) {
      lines.push(`  ${gate.name.padEnd(10)} ${gate.enabled ? "aktif " : "skip  "} ${gate.command ?? "(null)"}`);
    }
    console.log(lines.join("\n"));
    process.exit(0);
  }

  // 1. Scope
  const scope = options.scope.length > 0 ? options.scope : (config.scope?.paths ?? []);
  const always = config.scope?.always ?? [];
  if (scope.length === 0) {
    gates.push({ name: "scope", status: "skip", detail: "tidak ada scope yang diberikan" });
  } else {
    const outside = changed.filter((file) => !matchesAny(file, scope) && !matchesAny(file, always));
    if (outside.length === 0) {
      gates.push({ name: "scope", status: "pass", detail: `${scope.length} path disetujui, ${changed.length} file berubah` });
    } else {
      gates.push({ name: "scope", status: "fail", detail: `di luar scope: ${outside.join(", ")}` });
      problems.push("scope");
    }
  }

  // 2. Bersihkan artefak build sebelum gate yang membaca tipe.
  cleanup(config.cleanupPaths ?? [], notes);

  // 3. Format
  const formatIgnore = config.format?.ignore ?? [".pi/**"];
  const formatResult = formatGate(changed, config, formatIgnore);
  gates.push({ name: "format", ...formatResult });
  if (formatResult.status === "fail") problems.push("format");
  for (const note of formatResult.notes ?? []) notes.push(note);

  // 4. Typecheck
  const typecheck = config.commands?.typecheck;
  if (!typecheck) {
    gates.push({ name: "typecheck", status: "skip", detail: "perintah belum dideklarasikan di manifest" });
  } else {
    const result = run(typecheck.split(" ")[0], typecheck.split(" ").slice(1));
    if (result.status === 0) gates.push({ name: "typecheck", status: "pass", detail: "exit 0" });
    else {
      const samples = `${result.stdout}${result.stderr}`
        .split("\n")
        .filter((line) => line.includes("error TS"))
        .slice(0, 5);
      gates.push({ name: "typecheck", status: "fail", detail: `exit ${result.status}`, samples });
      problems.push("typecheck");
    }
  }

  // 5. Lint, dibandingkan per file.
  const lint = config.commands?.lint;
  let lintBaseline = null;
  if (!lint) {
    gates.push({ name: "lint", status: "skip", detail: "perintah belum dideklarasikan di manifest" });
  } else {
    const result = run(lint.split(" ")[0], lint.split(" ").slice(1));
    const output = `${result.stdout}${result.stderr}`;
    const ignoreFiles = config.lint?.ignoreFiles ?? [".pi/**"];
    const parsed = filterIgnoredFiles(await parseLint(output, config, result.stdout), ignoreFiles);
    const perFile = parsed.files;
    const ignoredNote = parsed.ignoredFiles > 0 ? `; ${parsed.ignoredFiles} file diabaikan oleh lint.ignoreFiles` : "";
    const summary = parsed.errors === null ? null : { errors: parsed.errors, warnings: parsed.warnings ?? 0 };
    const parserNote = ["exit-only", "custom", "none"].includes(parsed.mode) ? `; parser ${parsed.mode}` : "";

    // Angka baseline adalah fakta terukur, jadi yang berwenang adalah verification.json.
    // manifest.json hanya dipakai sebagai nilai awal saat project baru dikonfigurasi.
    const measured = previous?.baseline ?? null;
    const baseline = {
      errors: measured?.errors ?? config.lint?.baseline?.errors ?? null,
      warnings: measured?.warnings ?? config.lint?.baseline?.warnings ?? null,
      files: measured?.files ?? config.lint?.baseline?.files ?? {},
      head: measured?.head ?? config.lint?.baseline?.head ?? null,
    };
    const comparison = compareLintPerFile(perFile, baseline.files, scope);

    lintBaseline = {
      errors: summary?.errors ?? Number(baseline.errors ?? 0),
      warnings: summary?.warnings ?? Number(baseline.warnings ?? 0),
      files: perFile,
      measuredAt: new Date().toISOString().slice(0, 10),
      head,
    };

    if (parsed.mode === "none") {
      gates.push({
        name: "lint",
        status: result.status === 0 ? "pass" : "warn",
        detail: `hasil tidak terbaca (exit ${result.status}); set lint.parser: auto | eslint-json | eslint-stylish | exit-only | custom`,
        parser: parsed.mode,
      });
    } else if (parsed.mode === "exit-only") {
      const status = result.status === 0 ? "pass" : "warn";
      gates.push({
        name: "lint",
        status,
        detail: `exit ${result.status}; perbandingan per file tidak tersedia${parserNote}`,
        parser: parsed.mode,
      });
      lintBaseline = {
        errors: Number(baseline.errors ?? 0),
        warnings: Number(baseline.warnings ?? 0),
        files: perFile,
        measuredAt: new Date().toISOString().slice(0, 10),
        head,
      };
    } else if (baseline.errors === null && Object.keys(baseline.files).length === 0) {
      // Baseline belum pernah diukur: belum ada pembanding, jadi tidak boleh disebut regresi.
      const total = summary ? `${summary.errors} error, ${summary.warnings} warning` : "tidak terbaca";
      gates.push({
        name: "lint",
        status: "warn",
        detail: `${total}; baseline belum tercatat, jalankan --refresh-baseline${parserNote}${ignoredNote}`,
        parser: parsed.mode,
        samples: Object.entries(perFile)
          .slice(0, 5)
          .map(([file, count]) => `${file}: ${count} error`),
      });
    } else if (comparison.regressions.length > 0) {
      gates.push({
        name: "lint",
        status: "fail",
        detail: `error baru: ${comparison.regressions.join("; ")}${ignoredNote}`,
        parser: parsed.mode,
        samples: comparison.preExisting.slice(0, 3),
      });
      problems.push("lint");
    } else {
      const total = summary ? `${summary.errors} error, ${summary.warnings} warning` : "tidak terbaca";
      gates.push({
        name: "lint",
        status: "warn",
        detail: `${total}; baseline ${baseline.errors ?? "belum tercatat"}${parserNote}${ignoredNote}`,
        parser: parsed.mode,
        samples: comparison.preExisting.slice(0, 3),
      });
    }
  }

  // 6. Test (opsional)
  const test = config.commands?.test;
  if (!test) {
    gates.push({ name: "test", status: "skip", detail: "project ini belum punya gate test" });
  } else {
    const result = run(test.split(" ")[0], test.split(" ").slice(1));
    if (result.status === 0) gates.push({ name: "test", status: "pass", detail: "exit 0" });
    else {
      gates.push({ name: "test", status: "fail", detail: `exit ${result.status}` });
      problems.push("test");
    }
  }

  // 7. Build (hanya dengan --with-build)
  const build = config.commands?.build;
  if (!build) {
    gates.push({ name: "build", status: "skip", detail: "perintah belum dideklarasikan di manifest" });
  } else if (!options.withBuild) {
    gates.push({ name: "build", status: "skip", detail: "dilewati, jalankan dengan --with-build" });
  } else {
    const result = run(build.split(" ")[0], build.split(" ").slice(1));
    if (result.status === 0) gates.push({ name: "build", status: "pass", detail: "exit 0" });
    else {
      gates.push({ name: "build", status: "fail", detail: `exit ${result.status}` });
      problems.push("build");
    }
    cleanup(config.cleanupPaths ?? [], notes);
  }

  const ok = problems.length === 0;

  // Tulis hasil. Baseline per file hanya diperbarui saat diminta, supaya run biasa tidak menghapus jejak.
  const next = {
    ...previous,
    projectName: config.projectName,
    head,
    scope,
    gates,
    ok,
    checkedAt: new Date().toISOString(),
  };
  // Baseline per file hanya diperbarui saat diminta, dan hanya kalau hasil lint benar-benar terbaca.
  // Menulis baseline dari hasil yang tidak terbaca akan mencatat 0 error, dan itu menyesatkan.
  const lintGate = gates.find((gate) => gate.name === "lint");
  const baselineBisaDipercaya = ["eslint-json", "eslint-stylish", "custom"].includes(lintGate?.parser);
  if (options.refresh && lintBaseline && baselineBisaDipercaya) next.baseline = lintBaseline;
  else if (options.refresh) notes.push("baseline tidak diperbarui: hasil lint belum bisa dibaca");
  fs.writeFileSync(RESULT_PATH, `${JSON.stringify(next, null, 2)}\n`);

  if (options.json) {
    console.log(JSON.stringify({ ok, head, scope, gates, baseline: next.baseline ?? null }, null, 2));
  } else {
    const lines = [`== ${config.projectName} (HEAD ${head}, branch ${branch}) ==`];
    for (const gate of gates) {
      lines.push(`  ${gate.status.toUpperCase().padEnd(5)} ${gate.name.padEnd(10)} ${gate.detail ?? ""}`);
      for (const sample of gate.samples ?? []) lines.push(`        ${sample}`);
    }
    for (const note of notes) lines.push(`  catatan: ${note}`);
    lines.push("");
    lines.push(ok ? "  hijau, tidak ada regresi" : `  PERLU DIPERBAIKI: ${problems.join(", ")}`);
    if (options.refresh) lines.push("  baseline diperbarui di verification.json");
    console.log(lines.join("\n"));
  }

  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
