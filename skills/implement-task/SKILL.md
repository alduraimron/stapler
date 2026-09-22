---
name: implement-task
description: Sesi WORKER untuk mengeksekusi file plan dari .pi/plans (feature atau bugfix) sampai terverifikasi. Pakai saat pengguna menyebut "kerjakan plan", "implement plan", atau memberi path plan. Wajib ada file plan.
disable-model-invocation: true
---

# Sesi Worker: Eksekusi Plan

Input: **path file plan** (dari argumen). Kalau tidak ada, tanya. Tanpa file plan, skill ini tidak dipakai -
untuk perubahan kecil, cukup kerja biasa tanpa skill ini.

## 1. Baca (berurutan, seperlunya)

1. `AGENTS.md` - aturan tim. **Baca saja, jangan pernah mengubahnya.**
2. `.pi/rules.md` - aturan personal: perintah verifikasi, larangan, lokasi artefak.
3. **File plan** - sumber kebenaran untuk scope, keputusan, dan langkah.
4. ADR yang **disebut di bagian `## Decision records`** plan, plus file lain yang disebut plan. Jangan
   memindai seluruh `.pi/adr/`: kalau plan tidak menyebut ADR, tidak ada yang perlu dibaca. ADR berstatus
   `Accepted` adalah keputusan project yang **wajib dipatuhi**, bukan saran.

Jangan menjelajahi seluruh repo: path, nama fungsi, dan pola yang dibutuhkan sudah ada di plan. Kalau perlu
tahu sesuatu yang tidak ada di plan, tanya dulu.

## 2. Validasi cepat sebelum menulis kode (2-5 menit)

- Semua path di plan benar-benar ada?
- Nama fungsi/tipe/endpoint/komponen yang disebut plan benar?
- Perintah verifikasi di plan bisa dijalankan di project ini?
- Asumsi plan masih sesuai dengan kode sekarang (mis. setelah pull terbaru)?

Kalau ada yang tidak cocok: **berhenti dan lapor ke user**. Jangan improvisasi dan jangan menyelaraskan plan
diam-diam.

## 3. Eksekusi

- Ikuti urutan langkah di plan.
- Patuhi aturan project: struktur lapisan, penamaan identifier, bahasa komentar, guardrail.
- Perubahan sesempit mungkin: jangan menyentuh file di luar daftar plan tanpa persetujuan.
- Tidak memperbaiki masalah lain yang kebetulan terlihat. Catat sebagai temuan di laporan.
- Komentar kode: hanya yang menjelaskan WHY, singkat. Jangan menulis alasan keputusan bisnis atau merujuk
  dokumen internal yang tidak ikut ter-commit.
- Tandai status plan: `Dikerjakan` saat mulai, `Selesai (tanggal)` saat semua acceptance terpenuhi.

## 4. Konflik keputusan: berhenti, jangan putuskan sendiri

Detail implementasi biasa - nama helper, struktur fixture test, urutan langkah, refactor kecil lokal -
**selesaikan sendiri**. Tidak perlu berhenti dan tidak perlu ADR.

Tapi kalau menyelesaikan plan butuh salah satu dari ini:

- melanggar ADR `Accepted`;
- mengganti keputusan project yang bertahan;
- mengubah alasan/arsitektur yang sudah disepakati di sesi plan;
- memunculkan keputusan yang bertahan dan belum ada di plan;

maka **berhenti**. Jangan mengambil keputusan itu diam-diam, jangan menulis ADR sendiri, jangan mengubah ADR
yang ada supaya cocok dengan implementasi.

Laporkan singkat, lalu kembalikan ke sesi plan/user:

- **ADR terkait**: `<path>` (atau "tidak ada di plan, tapi ini keputusan baru yang bertahan")
- **Temuan implementasi**: apa yang ditemukan di kode/kenyataan yang membuat plan tidak bisa diikuti apa
  adanya
- **Kenapa ini bukan detail implementasi**: apa yang berubah kalau keputusan itu diambil
- **Yang perlu diputuskan ulang**: pertanyaan konkret untuk user

Task ini butuh revisi plan (`/skill:plan-task`) sebelum lanjut. Jangan menandai plan `Selesai`.

## 5. Verifikasi

- Jalankan perintah verifikasi dari plan (atau `.pi/rules.md` kalau plan tidak menyebut).
- **Bugfix**: buktikan gejala di plan hilang (ulangi langkah reproduksi) + cek jalur berdekatan yang disebut
  di bagian regression risk.
- **Feature**: periksa acceptance criteria per fase yang dikerjakan.
- Ada yang merah: perbaiki akar masalahnya. Jangan menonaktifkan pemeriksaan, jangan melemahkan aturan,
  jangan menambah pengecualian tanpa izin.
- Kalau butuh database/akun/alur manual yang tidak bisa dijalankan: katakan **belum diuji** dengan jujur, dan
  sertakan langkah ujinya untuk user.

## 6. Perbarui dokumentasi yang disebut plan

- Plan: status + catatan deviasi.
- ADR, yang **boleh**: menambah **satu baris bertanggal di `## History`** berisi temuan implementasi atau
  pengetahuan tambahan, dan hanya kalau keputusan yang berlaku tidak berubah.
- ADR, yang **tidak boleh**: membuat ADR baru, mengubah `Decision`, menulis ulang `Context`/`Rationale`
  seolah pengetahuan sekarang sudah ada sejak dulu, mengubah status, membuat entri `Corrections`, atau
  men-`Supersede` ADR. Kalau salah satunya dibutuhkan: berhenti dan lapor konflik (bagian 4).

## 7. Laporan akhir

Pakai [references/done-report.md](references/done-report.md). Isi minimal: apa yang dikerjakan, hasil
verifikasi berupa angka/exit code, deviasi dari plan + alasannya, yang belum dikerjakan, dan hal yang butuh
tindakan user (pull, commit, push, db:push, keputusan). Sertakan saran pesan commit sesuai standar project.

## Larangan (default; `.pi/rules.md` bisa mempersempit atau menambah)

- Tidak menjalankan `db:push`, `git commit`, `git push` kecuali user meminta eksplisit di sesi ini.
- Tidak mengubah `AGENTS.md`.
- Tidak memakai `git push --force`.
- Tidak menyentuh modul di luar scope plan tanpa izin.
- Tidak membuat ADR, tidak mengubah keputusan/status/`Corrections`/`Supersede` ADR. Satu-satunya perubahan
  ADR yang boleh: menambah baris `## History` yang tidak mengubah keputusan (bagian 6).
