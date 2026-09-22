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
3. `.pi/adr/README.md` kalau ada - untuk tahu ADR mana yang relevan.

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

## 6. Tulis plan

- Lokasi: ikut `.pi/rules.md`. Kalau tidak didefinisikan, pakai `.pi/plans/<YYYY-MM-DD>-<slug>.md`.
- Struktur: [references/plan-format.md](references/plan-format.md).
- Wajib memuat: ruang lingkup, file yang disentuh, acceptance criteria, perintah verifikasi, dan daftar di
  luar scope.
- Plan tanpa langkah + acceptance + perintah verifikasi = **belum selesai**. Jangan menutup sesi master
  sebelum itu ada.

## 7. ADR

Tulis/perbarui ADR kalau ada keputusan yang bertahan: arsitektur, kebijakan, deviasi standar, atau
alternatif penting yang ditolak. Lokasi dan index ikut `.pi/rules.md` atau `AGENTS.md`. Kalau project tidak
punya mekanisme ADR, keputusan cukup ditulis di plan.

Waktu menulis ADR:
- **Sesi master (sekarang):** saat keputusan diambil, status `Diusulkan` atau `Diterima`.
- **Sesi implement (nanti):** hanya memperbarui status + catatan implementasi. Kalau worker menemukan
  keputusan baru yang layak jadi ADR, dia berhenti dan tanya.

## 8. Tutup sesi

Keluarkan ringkas: (1) path plan, (2) 3-6 baris ringkasan keputusan, (3) blok kickoff siap tempel:

```
/skill:implement-task .pi/plans/<file>.md
```

Jangan lanjut menulis kode walau user terlihat ingin lanjut. Sarankan tetap memakai
`/skill:implement-task` supaya context sesi master ini tidak terpakai untuk implementasi.
