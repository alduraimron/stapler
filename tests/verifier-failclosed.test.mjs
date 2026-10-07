import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function fixture(t, { git = true, script, parser = "eslint-json", commands = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stapler-failclosed-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, ".pi/stapler"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "templates/pack/verification.mjs"), path.join(root, ".pi/stapler/verification.mjs"));
  fs.writeFileSync(path.join(root, ".pi/stapler/manifest.json"), JSON.stringify({
    schemaVersion: 1, projectName: "failclosed",
    commands: { format: null, typecheck: null, lint: script ? "node .pi/stapler/lint.mjs" : null, test: null, build: null, ...commands },
    lint: { parser }, scope: { always: [".pi/**"] },
  }));
  if (script) fs.writeFileSync(path.join(root, ".pi/stapler/lint.mjs"), script);
  if (git) assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
  const run = (args = []) => spawnSync(process.execPath, [".pi/stapler/verification.mjs", ...args], { cwd: root, encoding: "utf8" });
  return { root, run };
}

const zero = 'console.log(JSON.stringify([{filePath:process.cwd()+"/app.js",errorCount:0,warningCount:0}]));';

test("Git failure is not an empty changed-file list or a scope PASS", (t) => {
  const { root, run } = fixture(t, { git: false });
  fs.writeFileSync(path.join(root, "outside.js"), "outside\n");
  const result = run(["--scope", "app.js", "--json"]);
  assert.equal(result.status, 1);
  const data = JSON.parse(result.stdout);
  assert.equal(data.ok, false);
  assert.equal(data.gates.find(g => g.name === "scope").status, "fail");
  assert.match(data.gates.find(g => g.name === "scope").detail, /git status gagal/);
});

test("Git failure also prevents format PASS when no scope was supplied", (t) => {
  const { run } = fixture(t, { git: false, commands: { format: "unavailable-formatter" } });
  const result = run(["--json"]);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).gates.find(g => g.name === "format").status, "fail");
});

test("uncommitted Git root checks untracked Unicode/space/quote paths exactly", (t) => {
  const { root, run } = fixture(t);
  const name = 'ruang "uji"-é.js';
  fs.writeFileSync(path.join(root, name), "export const x = 1;\n");
  const result = run(["--scope", name, "--json"]);
  assert.equal(result.status, 0);
  const scope = JSON.parse(result.stdout).gates.find(g => g.name === "scope");
  assert.equal(scope.status, "pass");
  assert.match(scope.detail, /3 file berubah/); // App plus the two parent-owned fixture pack files.
});

test("rename scope includes both deletion source and destination", (t) => {
  const { root, run } = fixture(t);
  fs.writeFileSync(path.join(root, "old.js"), "export const x = 1;\n");
  const git = (args) => spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd: root });
  assert.equal(git(["add", "old.js"]).status, 0);
  assert.equal(git(["commit", "-qm", "fixture"]).status, 0);
  assert.equal(git(["mv", "old.js", "new.js"]).status, 0);
  const denied = run(["--scope", "new.js", "--json"]);
  assert.equal(denied.status, 1);
  assert.match(JSON.parse(denied.stdout).gates[0].detail, /old\.js/);
  assert.equal(run(["--scope", "old.js,new.js"]).status, 0);
});

for (const script of [
  'console.error("configuration broken"); process.exit(2);',
  'console.log("[]"); process.exit(2);',
  'console.log("[]"); process.exit(1);',
  'console.log(JSON.stringify([{filePath:"app.js",errorCount:2,warningCount:0}])); process.exit(2);',
  'console.log(JSON.stringify([{filePath:"app.js",errorCount:-1,warningCount:0}])); process.exit(2);',
]) {
  test(`failed linter cannot hide behind output/baseline: ${script}`, (t) => {
    const { root, run } = fixture(t, { script });
    fs.writeFileSync(path.join(root, ".pi/stapler/verification.json"), JSON.stringify({ baseline: { errors: 0, warnings: 0, files: {} } }));
    const result = run(["--scope", "app.js", "--refresh-baseline", "--json"]);
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    assert.equal(data.ok, false);
    assert.equal(data.baselineUpdated, false);
    assert.equal(data.gates.find(g => g.name === "lint").status, "fail");
    assert.deepEqual(data.baseline, { errors: 0, warnings: 0, files: {} });
  });
}

for (const script of [
  'console.log("✖ 1 problem (1 error, 0 warnings)"); process.exit(1);',
  'console.log(process.cwd()+"/app.js"); console.log("  1:1  error  one issue  rule"); console.log("✖ 2 problems (2 errors, 0 warnings)"); process.exit(1);',
]) {
  test(`incomplete stylish reports cannot pass or record zero baseline: ${script}`, (t) => {
    const { root, run } = fixture(t, { script, parser: "eslint-stylish" });
    const result = run(["--scope", "app.js", "--refresh-baseline", "--json"]);
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    assert.equal(data.gates.find(g => g.name === "lint").status, "fail");
    assert.equal(data.baselineUpdated, false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, ".pi/stapler/verification.json"))).baseline, undefined);
  });
}

for (const report of [
  { filePath: "app.js", errorCount: -1, warningCount: 0, messages: [] },
  [{ filePath: "app.js", errorCount: -1, warningCount: 0, messages: [] }],
  { wrapper: { messages: [], result: [] } },
  [[]],
]) {
  test(`nested JSON arrays are not a top-level ESLint report: ${JSON.stringify(report)}`, (t) => {
    const script = `console.log(${JSON.stringify(JSON.stringify(report, null, 2))});`;
    const { run } = fixture(t, { script });
    const result = run(["--refresh-baseline", "--json"]);
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    assert.equal(data.gates.find(g => g.name === "lint").status, "fail");
    assert.equal(data.baselineUpdated, false);
    assert.equal(data.baseline, null);
  });
}

for (const report of [[[]], { messages: [], wrapper: { report: [] } }]) {
  test(`prefixed enclosing JSON cannot expose a nested empty report: ${JSON.stringify(report)}`, (t) => {
    const script = `console.log("report: " + ${JSON.stringify(JSON.stringify(report, null, 2))});`;
    const { run } = fixture(t, { script });
    const result = run(["--refresh-baseline", "--json"]);
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    assert.equal(data.gates.find(g => g.name === "lint").status, "fail");
    assert.equal(data.baselineUpdated, false);
  });
}

for (const output of [
  '"[]"',
  '[]\nnull',
  'true',
  'null',
  '123',
  '[]\n[{"filePath":"app.js","errorCount":1,"warningCount":0}]',
  '[]\n{"errors":"configuration failed","messages":[]}',
]) {
  test(`multiple JSON values cannot let an empty array mask later evidence: ${output}`, (t) => {
    const { run } = fixture(t, { script: `console.log(${JSON.stringify(output)});` });
    const result = run(["--refresh-baseline", "--json"]);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).baselineUpdated, false);
  });
}

test("whole JSON report survives command banners, quoted braces and nested messages", (t) => {
  const script = 'console.log("npm notice running eslint"); console.log(JSON.stringify([{filePath:process.cwd()+"/app.js",errorCount:0,warningCount:0,messages:[{message:"brace } and [ and escaped \\\"quote\\\""}]}],null,2)); console.log("npm notice finished");';
  const { run } = fixture(t, { script });
  const result = run(["--refresh-baseline", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.gates.find(g => g.name === "lint").status, "pass");
  assert.equal(data.baselineUpdated, true);
  assert.equal(data.baseline.errors, 0);
});

test("required JSON format cannot accept unstructured exit-zero output", (t) => {
  const { run } = fixture(t, { script: 'console.log("no structured per-file evidence");' });
  const result = run(["--json"]);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).gates.find(g => g.name === "lint").status, "fail");
});

test("custom parser total must match per-file data before baseline measurement", (t) => {
  const { root, run } = fixture(t, { script: 'console.log("custom evidence");', parser: "custom" });
  const manifestPath = path.join(root, ".pi/stapler/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.lint.parserPath = ".pi/stapler/parser.mjs";
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.writeFileSync(path.join(root, manifest.lint.parserPath), 'export default () => ({errors:0,warnings:0,files:{"app.js":1}});');
  const result = run(["--refresh-baseline", "--json"]);
  assert.equal(result.status, 1);
  const data = JSON.parse(result.stdout);
  assert.equal(data.gates.find(g => g.name === "lint").status, "fail");
  assert.equal(data.baselineUpdated, false);
});

test("missing linter executable fails and never prints baseline updated", (t) => {
  const { run } = fixture(t, { commands: { lint: "stapler-no-such-linter" } });
  const result = run(["--refresh-baseline"]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /FAIL\s+lint/);
  assert.doesNotMatch(result.stdout, /baseline diperbarui di/);
});

test("zero-error parsed lint is PASS without an invented baseline", (t) => {
  const { root, run } = fixture(t, { script: zero });
  const result = run(["--json"]);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout);
  assert.equal(data.gates.find(g => g.name === "lint").status, "pass");
  assert.equal(data.baseline, null);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, ".pi/stapler/verification.json"))).baseline, undefined);
});

test("scope failure cannot refresh an otherwise valid baseline", (t) => {
  const { root, run } = fixture(t, { script: zero });
  fs.writeFileSync(path.join(root, "outside.js"), "outside\n");
  const result = run(["--scope", "app.js", "--refresh-baseline", "--json"]);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).baselineUpdated, false);
});

test("baseline-only does not run unrelated gates/cleanup and is explicitly measurement", (t) => {
  const { root, run } = fixture(t, { script: zero, commands: {
    format: "never-format", typecheck: "never-typecheck", test: "never-test", build: "never-build",
  } });
  const manifestPath = path.join(root, ".pi/stapler/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.cleanupPaths = [".pi/stapler/keep"];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  fs.mkdirSync(path.join(root, ".pi/stapler/keep"));
  const result = run(["--refresh-baseline", "--baseline-only", "--json"]);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout);
  assert.equal(data.mode, "baseline");
  assert.equal(data.baselineUpdated, true);
  assert.equal(data.baseline.errors, 0);
  for (const name of ["format", "typecheck", "test", "build"]) {
    const gate = data.gates.find(g => g.name === name);
    assert.equal(gate.status, "skip");
    assert.match(gate.detail, /mode pengukuran baseline/);
  }
  assert.equal(fs.existsSync(path.join(root, ".pi/stapler/keep")), true);
});

for (const args of [
  ["--baseline-only"],
  ["--baseline-only", "--refresh-baseline", "--with-build"],
  ["--baseline-only", "--refresh-baseline", "--scope-from", ".pi/stapler/runs/x.json"],
]) {
  test(`measurement cannot masquerade as task acceptance: ${args.join(" ")}`, (t) => {
    const { run } = fixture(t, { script: zero });
    const result = run(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /pengukuran bukan acceptance/);
  });
}

test("baseline-only without a linter cannot claim successful measurement", (t) => {
  const { run } = fixture(t);
  const result = run(["--refresh-baseline", "--baseline-only", "--json"]);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).baselineUpdated, false);
});

test("unreadable successful auto lint is a visible caveat, not an all-green summary", (t) => {
  const { run } = fixture(t, { script: 'console.log("no structured per-file evidence");', parser: "auto" });
  const result = run();
  assert.equal(result.status, 0);
  assert.match(result.stdout, /WARN\s+lint/);
  assert.match(result.stdout, /verifikasi selesai dengan catatan/);
  assert.doesNotMatch(result.stdout, /hijau, tidak ada regresi/);
});
