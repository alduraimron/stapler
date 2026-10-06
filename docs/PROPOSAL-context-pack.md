# Usulan: context pack terpisah dari skill

Status: usulan di branch `feat/context-pack`. Belum diputuskan. `main` masih memakai desain
`plan-task` + `implement-task` (v0.2.0).

## Masalah yang ingin diselesaikan

Desain v0.2.0 menaruh fakta project di dalam skill dan di plan. Akibatnya skill ikut berubah ketika project
berganti konvensi, dan tidak ada tempat resmi untuk aturan pribadi yang berbeda dari standar tim.

Usulan ini memisahkan **proses** dari **fakta project**:

```text
paket skill (proses, portabel)  ->  .pi/stapler/ (context pack, fakta project)  ->  sumber project
```

`stapler` tidak menyebut project apa pun. Semua fakta dibaca dari pack yang dihasilkan compiler
`stapler-context` dari sumber: standar tim, aturan pribadi, ADR, konfigurasi, dan kode.

## Yang berbeda dari v0.2.0

| Aspek | v0.2.0 | Usulan ini |
| --- | --- | --- |
| Jumlah sesi | dua sesi: `plan-task` lalu `implement-task`, artefak plan sebagai kontrak | satu sesi dengan gerbang ACC, plus mode proses (feature, integration, bugfix, refactor) |
| Tempat fakta project | di dalam skill dan di plan | di `.pi/stapler/` hasil kompilasi, dengan provenance |
| Perintah verifikasi | dua perintah tetap | daftar perintah di `manifest.json`, dijalankan kontrak verifier |
| Aturan personal vs tim | belum ada | `role` per sumber plus override per topik, hasilnya `deviations.md` |
| Gerbang scope | disebut sebagai aturan | gate `scope` di verifier, memakai daftar file dari `runs/` |
| Memori keputusan | ADR dibaca `plan-task`, ditulis saat keputusan muncul | sama, ditambah `adr-index.md` hasil kompilasi dan temuan `MISS` untuk ADR yang belum terindeks |

## Kaitan dengan roadmap yang sudah ada

| Item | Status usulan ini |
| --- | --- |
| R2 perintah verifikasi tambahan sebagai daftar di config | tercakup: `commands` di `manifest.json` |
| R4 aturan personal vs tim yang eksplisit | tercakup: `sources[].role`, `deviations.md`, `standards/*.md` |
| R7 laporan akhir baku | tercakup: `templates/tasks/*.md` dan `runs/` |
| R10 self-test skill | tercakup sebagian: 13 tes kontrak verifier; validasi frontmatter belum |
| R1 validasi cepat asumsi plan | belum tercakup: tetap berguna sebagai langkah di mode |
| R9 satukan dengan sistem lain | jadi makin penting: sekarang ada tiga sistem, dan `main` belum diputuskan |

## Yang hilang kalau desain ini dipakai apa adanya

- Pemisahan sesi master dan worker (D1 sampai D3) tidak ada. Hemat konteks antar sesi hilang, dan artefak
  plan bertanggal di `.pi/plans/` tidak lagi menjadi kontrak.
- Lifecycle status dan gerbang QA manual (praktik yang sudah disepakati) belum dipindahkan.

Kalau pemisahan sesi dan gerbang QA itu tetap dipertahankan, bentuk yang paling masuk akal adalah
**menggabungkan**: `plan-task` dan `implement-task` tetap ada sebagai mode, sementara pack, verifier, dan
`deviations.md` menggantikan bagian yang sekarang menempel di skill.

## Batasan yang jujur dari usulan ini

1. Parser lint bawaan hanya ESLint (JSON dan teks stylish). Linter lain perlu parser `custom` atau mode
   `exit-only`, dan selama `exit-only` klaim "tidak ada regresi lint" belum bisa dibuktikan.
2. Pack bisa basi. Itu ditekan dengan `provenance.json` dan mode `check`, bukan dihilangkan.
3. `stapler` gagal-tertutup: tanpa pack, ia menolak mengimplementasi. Itu disengaja, tapi berarti repo baru
   harus menjalankan `stapler-context init` lebih dulu.
