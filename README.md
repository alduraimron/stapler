# Stapler

Dua skill untuk satu alur kerja:

- **`stapler`** - proses kerja: baca context pack, inspeksi, tanya semua ambiguitas sekaligus, tunggu ACC,
  implementasi, verifikasi deterministik, lapor. Tidak tahu apa pun tentang project tertentu.
- **`stapler-context`** - compiler: membaca sumber project (standar tim, aturan pribadi, konfigurasi, kode),
  lalu menghasilkan context pack di `.pi/stapler/`.

Prinsipnya satu: **proses portabel, fakta selalu milik project.** Skill tidak pernah menuliskan nama
folder, perintah build, atau angka baseline. Semua itu ada di pack.

## Riwayat

| Versi | Isi |
| --- | --- |
| `v0.3.0` | Desain context pack: skill proses plus compiler `.pi/stapler/`, kontrak verifier, `deviations.md`, `runs/`. Menggantikan desain `plan-task` + `implement-task` yang dihapus dari `main` |
| `v0.2.0` | Memori keputusan lewat `.pi/adr` pada desain plan/implement |
| `v0.1.0` | Paket pertama, skill `plan-task` dan `implement-task` |

Alasan penggantian dan perbandingannya ada di [docs/PROPOSAL-context-pack.md](docs/PROPOSAL-context-pack.md).
Riwayat desain lama tetap bisa dibaca lewat tag `v0.2.0` atau branch `legacy/plan-implement`.

## Install

```bash
pi install /home/alduraimron/code/stapler
```

Atau tanpa install, untuk iterasi saat mengembangkan skillnya, tambahkan ke
`~/.pi/agent/settings.json`:

```json
{ "skills": ["/home/alduraimron/code/stapler/skills"] }
```

Sesudah dipasang, hapus skill project-local dengan nama yang sama (mis. `.pi/skills/stapler/`), karena Pi
memakai skill pertama yang ditemukan saat namanya bertabrakan.

## Pakai

```text
/skill:stapler-context init       # siapkan .pi/stapler untuk repo ini
/skill:stapler-context check      # cek apakah pack masih akurat
/skill:stapler-context refresh    # kompilasi ulang yang berubah
/skill:stapler <mode>             # kerjakan task
```

Setelah pull, satu perintah:

```bash
node .pi/stapler/check.mjs --post-pull
```

Ia memeriksa kebasian pack **dan** mencetak langkah konkret yang perlu dijalankan: `npm install` bila
`package.json` berubah, `npm run db:generate` plus sinkronisasi DB bila schema berubah, `--refresh-baseline`
untuk mengukur ulang angka lint, dan `stapler-context refresh` bila ada sumber aturan yang berubah.

Sebelum commit:

```bash
node .pi/stapler/verification.mjs --scope-from .pi/stapler/runs/<file run>.json
```

Scope dibaca dari artefak run yang berisi daftar file yang disetujui, dan hasil verifikasi ditulis balik ke
artefak itu. Angka baseline punya riwayat, jadi kenaikan error setelah pull tetap terlihat.

## Isi paket

```text
skills/stapler/            alur kerja + mode proses (feature, bugfix, refactor, integration)
skills/stapler-context/    compiler + mode (init, check, refresh)
templates/pack/            kerangka context pack: manifest, rules, deviations, verifier, check, provenance
templates/plays/           kerangka konvensi kerja khas project yang disalin ke pack
templates/tasks/           kerangka laporan pra-ACC dan artefak run (JSON)
prompts/stapler-kickoff.md prompt mulai sesi (nama sengaja diberi awalan `stapler-` supaya tidak bertabrakan dengan prompt project bernama `kickoff`)
docs/design.md             kontrak desain: istilah, precedence, struktur pack, kontrak verifier
```

## Kontrak singkat

1. `stapler` hanya mengambil aturan dari `.pi/stapler/`. Pengecualian resmi: file konteks yang di-inject
   harness (`AGENTS.md` global dan project) dan pembacaan sumber mentah lewat pintu indeks.
2. Kalau pack belum ada atau basi, `stapler` tidak mengimplementasi. Yang boleh hanya recon dan laporan.
3. Setiap pack menyimpan `provenance.json` berisi hash sumber, jadi kebasian bisa dideteksi, bukan dihindari.
4. Penyimpangan dari standar tim dinyatakan resmi di `manifest.json`, lalu dikompilasi menjadi
   `deviations.md` yang muncul di setiap laporan pra-ACC.
5. Verifikasi lewat satu kontrak CLI: `node .pi/stapler/verification.mjs`, dengan `--scope`, `--with-build`,
   `--json`, dan `--refresh-baseline`.

Detail lengkapnya di [docs/design.md](docs/design.md).
