# Mode: check

Memeriksa apakah pack masih akurat. Read-only: tidak menulis file apa pun.

Aman dijalankan sesering apa pun, dan ini yang dipanggil `stapler` di langkah 0.

## Prosedur

1. Baca `.pi/stapler/manifest.json` dan `provenance.json`. Kalau salah satunya tidak ada: laporkan
   `MISS` dengan satu baris perintah yang perlu dijalankan user, lalu selesai.
2. Periksa `schemaVersion`. Kalau lebih baru dari yang didukung skill: laporkan `STALE` dan berhenti.
3. Sumbu dokumen: untuk tiap entri di `provenance.json` yang punya `compiledInto`, hitung hash isi file
   sumbernya sekarang dan bandingkan. Beda berarti `STALE` untuk file itu.
4. Sumbu kelas A: untuk tiap entri `watched`, pastikan file masih ada, dan hash-nya masih sama. Beda
   berarti `HARNESS-CHANGED`.
5. Sumbu kode: bandingkan HEAD sekarang dengan `provenance.json.head` dan dengan `lint.baseline.head` di
   manifest. Selisih berarti `WARN`, dan sebutkan berapa commit.
6. Path yang dirujuk: pastikan semua file yang disebut `rules.md`, `standards/**`, `architecture.md`, dan
   `adr-index.md` masih ada. Yang hilang berarti `MISS`.
7. Integritas indeks ADR: bandingkan file di folder ADR dengan baris di indeks. Yang tidak terdaftar berarti
   `MISS`.
8. Deviasi: untuk tiap baris di `deviations.md`, cek sumber standar tim yang digantikannya. Kalau sumber itu
   berubah sejak kompilasi, laporkan `DEVIATION-STALE` dengan catatan bahwa deviasinya mungkin tidak lagi
   relevan.
9. Fakta terukur: baca `verification.json`. Kalau gate terakhir dijalankan di HEAD yang jauh berbeda,
   laporkan `WARN`.

Pemeriksaan hash tidak butuh membaca isi secara semantik. Cukup bandingkan hash, jadi murah.

## Bentuk laporan

```text
OK      rules.md dan standards/* sinkron dengan 14 sumber
STALE   .kiro/steering/security.md berubah sejak kompilasi
        terdampak: rules.md bagian larangan, standards/security.md
WARN    baseline lint diukur di HEAD 67c6d47, sekarang 4 commit lebih baru
MISS    0019-sync-erd-vuerd-saat-ubah-schema.md belum ada di adr-index.md
DEV-STALE  commit-format: standar tim berubah, tinjau deviasi

rekomendasi: refresh (2 temuan wajib)
```

Urutkan dari yang paling perlu tindakan. Jangan mengulang isi file; cukup kode, path, dan satu baris
dampaknya.

## Exit code

- `0`: hanya `OK` dan `WARN`.
- `1`: ada `STALE`, `HARNESS-CHANGED`, `MISS`, atau `DEVIATION-STALE`.

## Jangan

- Menulis atau memperbaiki apa pun, termasuk file GENERATED. Perbaikan adalah tugas `refresh`.
- Menghitung ulang baseline. Itu tugas `verifier --refresh-baseline`.
- Melaporkan `OK` untuk pemeriksaan yang tidak bisa dijalankan. Laporkan `WARN` beserta alasannya.
