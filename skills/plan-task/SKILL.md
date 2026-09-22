---
name: plan-task
description: Sesi MASTER untuk berdiskusi dan menghasilkan file plan (feature atau bugfix) yang bisa dieksekusi di sesi terpisah. Pakai saat pengguna minta "buat plan", "rencanakan fitur", "analisa bug ini dulu", atau saat pekerjaan butuh keputusan sebelum implementasi. Sesi ini tidak menulis kode.
disable-model-invocation: true
---

# Sesi Master: Menyusun Plan

Tujuan: mengubah permintaan user menjadi **file plan** yang bisa dieksekusi di sesi lain tanpa diskusi
ulang. Sesi ini **tidak menulis kode** dan **tidak commit**.

## 0. Mode

Ambil dari argumen: `feature` atau `bugfix`. Kalau kosong, simpulkan dari kalimat user lalu konfirmasi satu
baris. Kalau tetap tidak jelas: tanya.

## 1. Baca aturan project (selalu, urut)

1. `AGENTS.md` - aturan tim. **Baca saja, jangan pernah mengubahnya.**
2. `.pi/rules.md` - aturan personal (workflow, lokasi artefak, perintah verifikasi, larangan).
3. `.pi/adr/README.md` kalau ada - index keputusan project. Baca **index-nya dulu**, lalu buka hanya ADR
   yang relevan dengan task ini (lihat bagian 7).

Aturan prioritas:

| Hal | Yang menang |
| --- | --- |
| Workflow (siapa commit, plan-first, perintah verifikasi, lokasi artefak) | `.pi/rules.md` |
| Standar teknis & kode (penamaan, arsitektur, design system, keamanan) | `AGENTS.md` + `docs/standards/` |
| Bertentangan di hal lain | Berhenti dan tanya user, jangan menebak |

Kalau `.pi/rules.md` belum ada: tanya 3 hal (lokasi plan, perintah verifikasi wajib, bahan bacaan tambahan
per jenis tugas), buatkan file itu, lalu lanjut. Template ada di
[references/plan-format.md](references/plan-format.md).

## 2. Bahan yang perlu dibaca

- Ikuti bagian "Bahan wajib dibaca" di `.pi/rules.md` sesuai jenis tugas.
- Aset desain (PNG/Figma): baca **di sesi ini**, lalu **transkrip** fakta yang dibutuhkan ke plan (ukuran,
  token warna, teks copy, urutan kolom, state kosong/loading). Sesi implement tidak perlu membaca ulang
  gambarnya.
- Baca kode seperlunya (read-only) supaya plan tidak mengarang: pastikan path file, nama fungsi, endpoint,
  dan pola yang sudah ada di project.

## 3. Mode bugfix: investigasi dulu, jangan langsung merencanakan

Wajib ada, berurutan:

1. **Gejala** yang dilihat user + **langkah reproduksi** yang pasti.
2. **Bukti** dari kode (`path:baris`) atau log. Bukan dugaan.
3. **Akar masalah**, bukan gejala.
4. Kalau tidak bisa direproduksi atau buktinya belum cukup: **jangan menyusun plan perbaikan**. Tulis plan
   berisi temuan + daftar informasi yang masih dibutuhkan, lalu berhenti.

## 4. Mode feature: pecah dulu, baru rencanakan

- Tujuan + siapa yang memakai + kenapa.
- Pecah jadi fase yang masing-masing bisa dites sendiri (contoh pola yang sudah terbukti: fase 1 slicing UI
  dengan data mock, fase 2 API, fase 3 integrasi).
- Sebutkan lapisan yang tersentuh mengikuti standar project (mis. validator -> service -> repository ->
  route, atau types -> service -> hooks -> komponen).

## 5. Tanya semua ambiguitas SEKALIGUS

- Kumpulkan seluruh pertanyaan dalam **satu batch**, masing-masing dengan opsi + rekomendasi.
- Jangan bertanya satu-satu, jangan berasumsi pada hal yang mengubah hasil.
- Jawaban user masuk ke bagian "Keputusan" di plan. Bagian "Pertanyaan terbuka" harus **kosong** saat sesi
  ditutup.
- Kalau arah yang diminta bertentangan dengan ADR `Accepted`, itu **wajib** masuk batch ini (bagian 7.4).

## 6. Tulis plan

- Lokasi: ikut `.pi/rules.md`. Kalau tidak didefinisikan, pakai `.pi/plans/<YYYY-MM-DD>-<slug>.md`.
- Struktur: [references/plan-format.md](references/plan-format.md).
- Wajib memuat: ruang lingkup, file yang disentuh, acceptance criteria, perintah verifikasi, **Decision
  records**, dan daftar di luar scope.
- Plan tanpa langkah + acceptance + perintah verifikasi + Decision records = **belum selesai**. Jangan
  menutup sesi master sebelum itu ada.

## 7. ADR: memori keputusan project

Tujuan ADR: sesi berikutnya bisa menjawab "kenapa dulu memilih ini dan kenapa alternatif lain ditolak"
tanpa menebak dari kode. ADR **bukan** daftar tugas, backlog, atau progres.

Kepemilikan: sesi ini (master) yang **menemukan, mendiskusikan, dan mencatat** keputusan. Sesi implement
hanya **membaca dan mematuhi**; kalau implementasi butuh menyimpang, worker berhenti dan kembali ke sesi ini.

### 7.1 Baca yang sudah ada (index dulu, jangan boros)

1. Kalau `.pi/adr/README.md` tidak ada: lanjut seperti biasa. Project tanpa ADR itu normal.
2. Kalau ada: baca **hanya index-nya**. Dari kolom Decision/Topic, tentukan ADR yang mungkin menyentuh
   task ini.
3. Buka hanya ADR yang lolos uji relevansi: **apakah ADR ini membatasi atau mengubah cara task ini
   dikerjakan?** Kalau tidak, jangan dibuka dan jangan dicantumkan di plan.
4. Jangan membaca beberapa ADR sekaligus dalam satu perintah (`cat .pi/adr/*.md`, `cat a.md b.md`, atau
   dump satu direktori). Satu file per pembacaan, hanya yang relevan.
5. `Accepted` = keputusan project yang berlaku. `Proposed` = belum final. `Superseded`/`Deprecated` = jangan
   dipakai sebagai dasar keputusan baru; sebutkan kalau task ini menggantikannya.

### 7.2 Kapan keputusan layak jadi ADR

Pertanyaan penentunya: **apakah ini masih perlu diketahui setelah task ini selesai?**

Layak: strategi auth/sesi, konvensi identifier (UUID vs sekuensial), strategi penyimpanan, konvensi
versioning API, konvensi penamaan lintas modul, batas antar-service, arah dependensi, format error response,
arsitektur deployment, kebijakan keamanan, deviasi sengaja dari standar, konvensi project-wide, trade-off
teknis yang disengaja, aturan produk yang nanti bisa "diperbaiki" orang lain karena terlihat seperti bug.

Tidak layak: rename fungsi, tambah unit test, bikin migrasi, satu endpoint, pindah helper, perbaikan typo,
refactor lokal, langkah task, acceptance criteria, perintah verifikasi. Itu milik plan atau kode.

Jangan membuat ADR secara mekanis. Kalau ragu: tanya user satu baris di batch pertanyaan.

### 7.3 Baru dicatat setelah keputusan benar-benar diambil

Opsi yang cuma sempat dipertimbangkan model **bukan** ADR. Tunggu sampai user menyetujui arahnya, baru tulis.
Alternatif yang ditolak boleh masuk bagian "Alternatives considered" di ADR, tapi eksplorasi saja tidak
menciptakan ADR.

### 7.4 Kalau task bertentangan dengan ADR `Accepted`

Jangan menimpa diam-diam. Angkat di batch pertanyaan: sebut ADR-nya, apa yang diminta task, dan apa yang
akan berubah. Kalau arah baru disetujui: buat ADR baru yang menjelaskan kenapa konteks/requirement berubah,
lalu tandai ADR lama `Superseded by ADR-NNNN`. ADR lama **tidak** ditulis ulang.

### 7.5 Menulis dan memperbarui

- Lokasi, nomor, index, dan struktur file: [references/plan-format.md](references/plan-format.md) bagian 3.
- Setiap ADR baru **wajib** ditambahkan ke `.pi/adr/README.md`.
- Bahasa: ikuti bahasa ADR yang sudah ada di project. Kalau belum ada, ikuti bahasa dominan artefak project
  dan diskusi dengan user. Jangan memaksa bahasa dokumentasi Stapler.
- Status ADR adalah status keputusan (`Proposed`, `Accepted`, `Rejected`, `Superseded`, `Deprecated`), bukan
  progres task. Jangan memakai `Selesai`/`Completed`/`Done`.

Tiga mekanisme riwayat - jangan pernah menulis ulang sejarah:

| Yang terjadi | Yang dilakukan |
| --- | --- |
| Ada informasi tambahan, keputusan tidak berubah | tambah baris di `## History` |
| Fakta di ADR lama ternyata salah | tambah entri bertanggal di `## Corrections`; klaim lama tetap ada |
| Keputusan yang bertahan berubah | buat ADR baru + `Superseded by ADR-NNNN` di ADR lama |

## 8. Tutup sesi

Keluarkan ringkas: (1) path plan, (2) 3-6 baris ringkasan keputusan, (3) ADR yang dibuat/digantikan (atau
"tidak ada"), (4) blok kickoff siap tempel:

```
/skill:implement-task .pi/plans/<file>.md
```

Jangan lanjut menulis kode walau user terlihat ingin lanjut. Sarankan tetap memakai
`/skill:implement-task` supaya context sesi master ini tidak terpakai untuk implementasi.
