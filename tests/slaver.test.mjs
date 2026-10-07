// Tes statis kontrak instruksi, bukan bukti bahwa model selalu mematuhi workflow.
// Slaver tetap diuji di repo sendiri; tidak perlu memasang dependency Pi untuk tes ini.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "docs/slaver.md");
const CONTRACT = fs.readFileSync(CONTRACT_PATH, "utf8");
const SKILLS = ["skills/stapler/SKILL.md", "skills/stapler-context/SKILL.md"];

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(full) : entry.name.endsWith(".md") ? [full] : [];
  });
}

test("kedua skill tetap manual dan merujuk kontrak Slaver yang sama", () => {
  for (const relative of SKILLS) {
    const text = read(relative);
    assert.match(text, /^---\n[\s\S]*?disable-model-invocation: true\n---/);
    const link = text.match(/\[kontrak delegasi\]\(([^)]+)\)/);
    assert.ok(link, `${relative} tidak menunjuk kontrak delegasi`);
    assert.equal(path.resolve(ROOT, path.dirname(relative), link[1]), CONTRACT_PATH);
    assert.match(text, /tool `delegate` tersedia/);
  }
});

test("rujukan markdown lokal dari skill dan kontrak tidak menggantung", () => {
  const files = [...markdownFiles(path.join(ROOT, "skills")), CONTRACT_PATH, path.join(ROOT, "docs/design.md"), path.join(ROOT, "README.md")];
  for (const full of files) {
    const text = fs.readFileSync(full, "utf8");
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
      const resolved = path.resolve(path.dirname(full), target);
      assert.ok(fs.existsSync(resolved), `${path.relative(ROOT, full)}: rujukan hilang ${target}`);
    }
  }
});

test("profil memilih role yang tepat dan memisahkan compiler dari consumer", () => {
  const rows = [...CONTRACT.matchAll(/^\| `([a-z-]+)` \| `(scout|reviewer|implementer)` \| ([^|]+) \|/gm)];
  assert.deepEqual(rows.map((row) => [row[1], row[2]]), [
    ["source-map", "scout"],
    ["impact", "scout"],
    ["scope-review", "reviewer"],
    ["pack-audit", "reviewer"],
    ["change-review", "reviewer"],
    ["implement-approved", "implementer"],
  ]);
  for (const row of rows) {
    assert.equal(row[3].includes("stapler-context"), ["source-map", "pack-audit"].includes(row[1]));
  }
  const consumer = read(SKILLS[0]);
  for (const profile of ["impact", "scope-review", "change-review", "implement-approved"]) assert.ok(consumer.includes(`\`${profile}\``));
  assert.doesNotMatch(consumer, /`source-map`|`pack-audit`/);
  assert.match(read("skills/stapler-context/modes/init.md"), /`source-map`[\s\S]*`pack-audit`/);
  assert.match(read("skills/stapler-context/modes/refresh.md"), /`source-map`[\s\S]*`pack-audit`/);
});

test("contoh request mempertahankan API read-only dan membatasi runPath ke implementer V1", () => {
  const examples = [...CONTRACT.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
  const requests = examples.filter((example) => "task" in example);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    const fields = ["agent", "constraints", "context", "expectedOutput", "task"];
    if (request.agent === "implementer") {
      fields.push("runPath");
      assert.match(request.runPath, /^\.pi\/stapler\/runs\/[^/]+\.json$/);
    }
    assert.deepEqual(Object.keys(request).sort(), fields.sort());
    assert.ok(["scout", "reviewer", "implementer"].includes(request.agent));
    for (const field of ["task", "context", "expectedOutput"]) assert.ok(typeof request[field] === "string" && request[field].trim());
    assert.ok(Array.isArray(request.constraints) && request.constraints.every((item) => typeof item === "string" && item.trim()));
    assert.match(request.constraints.join("\n"), /rawReads/);
    if (request.agent !== "implementer") assert.match(request.constraints.join("\n"), /Read-only/);
  }
});

test("kontrak outcome tidak mengubah completion atau cancellation menjadi approval", () => {
  assert.match(CONTRACT, /`completed`:[\s\S]*bukan\*\* task, acceptance, atau audit lulus/);
  assert.match(CONTRACT, /`failed`[\s\S]*Jangan retry otomatis/);
  assert.match(CONTRACT, /`cancelled`: laporkan pembatalan dan tunggu arahan user/);
  assert.match(CONTRACT, /`skipped`[\s\S]*bukan status session Slaver/);
  assert.match(CONTRACT, /rawReads: forbidden[\s\S]*melarang kelas C/);
  assert.match(CONTRACT, /jangan menulis artefak dulu/);
  assert.match(CONTRACT, /Field `verification` tetap ditulis hanya oleh verifier/);
});

test("handoff implementer terjadi setelah ACC dan tidak memperbarui run selama child aktif", () => {
  const consumer = read(SKILLS[0]);
  const execution = consumer.slice(consumer.indexOf("### 4. Execute"), consumer.indexOf("### 5. Verify"));
  assert.match(execution, /`implement-approved` sebagai default setelah ACC dan run ditulis/);
  assert.match(execution, /Jangan memperbarui run atau menjalankan verifier selama child aktif/);
  assert.match(execution, /Jangan rollback, retry, atau fallback menulis secara otomatis/);
  assert.match(CONTRACT, /enum agent belum memuat implementer[\s\S]*gunakan parent/);
});

test("workspace lintas cwd membutuhkan binding root dan tidak mendorong SDK ad hoc", () => {
  const consumer = read(SKILLS[0]);
  for (const token of ["workspacePath", "workspaceRoot", "canonical"]) assert.ok(consumer.includes(token));
  assert.match(CONTRACT, /Binding hilang\/salah gagal sebelum child dibuat/);
  assert.match(CONTRACT, /Run lama tetap valid tanpa binding untuk cwd yang sama/);
  assert.match(CONTRACT, /host SDK[\s\S]*ad hoc/);
  assert.match(CONTRACT, /Progress[\s\S]*bukan[\s\S]*reasoning child/);
});

test("run baru menyediakan jejak delegasi kosong tanpa mengarang hasil verifier", () => {
  const run = JSON.parse(read("templates/tasks/run-log.json"));
  assert.equal(run.schemaVersion, 1);
  assert.deepEqual(run.delegations, []);
  assert.equal(run.verification, null);
  assert.ok(Array.isArray(run.scope) && run.scope.length > 0);
});

test("laporan delegasi pra-ACC tidak menggantikan gate ACC terakhir", () => {
  const report = read("templates/tasks/pra-acc.md");
  assert.match(report, /## Delegasi[\s\S]*Hasil child bukan ACC/);
  assert.match(report, /Menunggu ACC untuk scope ini\.[\s\S]*balas `default ok`\.\s*$/);
  assert.ok(report.indexOf("## Delegasi") < report.indexOf("Menunggu ACC"));
});
