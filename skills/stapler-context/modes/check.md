# Mode: check

Memeriksa apakah pack masih akurat. Read-only: tidak menulis file apa pun.

Aman dijalankan sesering apa pun, dan ini yang dipanggil `stapler` di langkah 0.

## Prosedur

Bagian mekanisnya sudah jadi skrip: `node .pi/stapler/check.mjs` (atau `--json` untuk mesin). Jalankan itu
dulu, lalu kerjakan bagian yang tidak bisa diotomatiskan: menilai dampak temuan dan memutuskan refresh atau
tidak.

Yang dikerjakan skrip:

1. `schemaVersion` dan kelengkapan pack.
2. Sumbu dokumen: hash tiap sumber yang dikompilasi, termasuk isi file di dalam direktori sumber.
3. Sumbu kelas A: hash file konteks harness yang diawasi.
4. Path yang dirujuk pack: harus ada.
5. Integritas index ADR: setiap file ADR punya baris di index.
6. Deviasi: standar tim yang berubah sejak kompilasi memunculkan `DEVIATION-STALE`.
7. Sumbu kode: HEAD bergerak, baseline ketinggalan, dan pengingat pasca-pull (`npm install` bila `package.json` berubah, `npm run db:generate` dan sinkronisasi DB bila schema berubah).

Yang kamu kerjakan setelahnya:

- Periksa tiap `STALE` dan tentukan file pack mana yang terdampak (lihat `compiledInto`).
- Periksa `HARNESS-CHANGED`: apakah isi baru di file konteks itu mengubah aturan yang berlaku.
- Periksa `MISS`: mana yang perlu ditambahkan ke pack, dan mana yang perlu diperbaiki di sumber oleh user.
- Kelompokkan temuan jadi rekomendasi: `refresh`, perbaikan di sumber, atau tidak ada tindakan.

Pemeriksaan hash tidak butuh membaca isi secara semantik. Cukup bandingkan hash, jadi murah.

## Bentuk laporan

Skrip sudah mencetak baris per temuan. Kamu menambahkan ringkasan dampak, misalnya:

```text
STALE           docs - berubah sejak kompilasi; terdampak: domain.md
MISS            .pi/adr/0019-....md - ADR ada tetapi belum terdaftar di index
WARN            baseline diukur di HEAD 67c6d47, sekarang 4 commit lebih baru

rekomendasi: refresh untuk docs/domain.md; perbaikan index ADR butuh keputusan user
```

Urutkan dari yang paling perlu tindakan. Jangan mengulang isi file; cukup kode, path, dan satu baris
dampaknya.

## Exit code

- `0`: hanya `OK` dan `WARN`.
- `1`: ada `STALE`, `HARNESS-CHANGED`, `MISS`, atau `DEVIATION-STALE`.

## Jangan

- Menulis atau memperbaiki apa pun, termasuk file GENERATED. Perbaikan adalah tugas `refresh`.
- Menghitung ulang baseline. Itu tugas `verification.mjs --refresh-baseline`.
- Melaporkan `OK` untuk pemeriksaan yang tidak bisa dijalankan. Laporkan `WARN` beserta alasannya.
