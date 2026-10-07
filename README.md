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
| `main` (versi tetap `0.5.1`, tanpa tag baru) | Integrasi Slaver opsional: investigasi/review, audit pack, implementer scoped setelah ACC (kontrak V1), dan jejak delegasi pada run |
| `v0.3.0` | Desain context pack: skill proses plus compiler `.pi/stapler/`, kontrak verifier, `deviations.md`, `runs/`. Menggantikan desain `plan-task` + `implement-task` yang dihapus dari `main` |
| `v0.2.0` | Memori keputusan lewat `.pi/adr` pada desain plan/implement |
| `v0.1.0` | Paket pertama, skill `plan-task` dan `implement-task` |

Alasan penggantian dan perbandingannya ada di [docs/PROPOSAL-context-pack.md](docs/PROPOSAL-context-pack.md).
Riwayat desain lama tetap bisa dibaca lewat tag `v0.2.0` atau branch `legacy/plan-implement`.

## Install

```bash
pi install /path/to/stapler
```

Atau tanpa install, untuk iterasi saat mengembangkan skillnya, tambahkan ke
`~/.pi/agent/settings.json`:

```json
{ "skills": ["/path/to/stapler/skills"] }
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

Pengukuran baseline terpisah dari acceptance:

```bash
node .pi/stapler/verification.mjs --refresh-baseline --baseline-only
```

Mode ini hanya mengukur lint, tidak menjalankan format/typecheck/test/build/cleanup dan tidak boleh
menimpa hasil run dengan `--scope-from`. Untuk project kosong, tunda baseline sampai toolchain tersedia;
jangan mengarang nol. Git gagal memeriksa perubahan atau linter gagal menjalankan pemeriksaan sekarang
menggagalkan verifikasi, bukan dianggap scope kosong atau baseline lama.

## Slaver (opsional)

Stapler memakai tool `delegate` dari [Slaver](https://github.com/alduraimron/slaver) jika tersedia. Tidak
ada dependency paket wajib; scout/reviewer tetap read-only, dan implementer tersedia jika Slaver mendukung
V1. Untuk memasang Slaver:

```bash
pi install git:git@github.com:alduraimron/slaver.git
```

Jalankan `/reload` atau restart Pi setelah memperbarui paket/skill. Perintah Stapler tetap sama:

- `stapler-context init/refresh`: scout membantu `source-map` bila perlu, reviewer melakukan `pack-audit`
  setelah kompilasi. Hash yang cocok belum membuktikan ringkasan aturan benar secara makna.
- `stapler`: scout membantu `impact` saat inspeksi, reviewer melakukan `scope-review` untuk usulan berisiko
  dan `change-review` setelah verifier serta review diff sendiri. Dengan Slaver V1, `implement-approved`
  menyerahkan coding setelah ACC memakai `runPath`; tools scoped dibatasi ke file tepat dari run.
- ACC, scope/keputusan, penulisan pack/run/ADR, check, verifier, dan laporan tetap milik agent utama.
  Child mendapat konteks bounded dari pack, bukan seluruh percakapan; agent utama menyediakan diff karena child tidak
  bisa menjalankan git atau test.
- Tanpa Slaver atau jika user meminta tanpa subagent, fase itu dilakukan sendiri dan skip dilaporkan.
  Slaver V0 tetap dipakai untuk read-only, dengan coding oleh parent. Kegagalan tidak di-retry otomatis;
  implementer yang gagal bisa meninggalkan edit parsial, sehingga perlu inspeksi tanpa rollback/fallback
  menulis otomatis. Pembatalan menunggu arahan user. Hasil child bukan bukti gate hijau.

Profil dikirim lewat `task`, `context`, `constraints`, dan `expectedOutput`, bukan parameter API `mode`.
V1 menambah `runPath` hanya untuk implementer. Dengan `workspacePath`, project di luar cwd sesi bisa
dipilih eksplisit tanpa host SDK kedua; implementer lintas cwd wajib memiliki binding `workspaceRoot`
pada run. Scope tetap file tepat di root itu, dan /subagents/cancel milik sesi asal. Progress hanya
metadata ringkas, bukan transcript atau bukti acceptance. Jejaknya dicatat setelah ACC pada field opsional
`delegations` di run; jangan menulis metadata run selama child aktif. Pack/run lama tetap kompatibel.
Pantau session dengan `/subagents` atau `/subagents <id>`. Implementer tersedia di `main` Slaver tanpa
bump versi paket; V1 adalah nama kontrak kapabilitas, bukan nomor rilis. Update pemasangan Git tanpa pin
agar memperoleh fix; tag lama tetap menunjuk kode sebelumnya. Hindari memuat sumber Git dan lokal bersamaan.
Kontrak lengkap: [docs/slaver.md](docs/slaver.md).

## Isi paket

```text
skills/stapler/            alur kerja + mode proses (feature, bugfix, refactor, integration)
skills/stapler-context/    compiler + mode (init, check, refresh)
templates/pack/            kerangka context pack: manifest, rules, deviations, verifier, check, provenance
templates/plays/           kerangka konvensi kerja khas project yang disalin ke pack
templates/tasks/           kerangka laporan pra-ACC dan artefak run (JSON)
prompts/stapler-kickoff.md prompt mulai sesi (nama sengaja diberi awalan `stapler-` supaya tidak bertabrakan dengan prompt project bernama `kickoff`)
docs/design.md             kontrak desain: istilah, precedence, struktur pack, kontrak verifier
docs/slaver.md             profil delegasi, batas konteks, outcome, fallback, dan jejak run
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
