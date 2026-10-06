# Stapler

Dua skill untuk satu alur kerja:

- **`stapler`** - proses kerja: baca context pack, inspeksi, tanya semua ambiguitas sekaligus, tunggu ACC,
  implementasi, verifikasi deterministik, lapor. Tidak tahu apa pun tentang project tertentu.
- **`stapler-context`** - compiler: membaca sumber project (standar tim, aturan pribadi, konfigurasi, kode),
  lalu menghasilkan context pack di `.pi/stapler/`.

Prinsipnya satu: **proses portabel, fakta selalu milik project.** Skill tidak pernah menuliskan nama
folder, perintah build, atau angka baseline. Semua itu ada di pack.

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

## Isi paket

```text
skills/stapler/            alur kerja + mode proses (feature, bugfix, refactor, integration)
skills/stapler-context/    compiler + mode (init, check, refresh)
templates/pack/            kerangka context pack: manifest, rules, deviations, verifier
templates/plays/           kerangka konvensi kerja khas project yang disalin ke pack
templates/tasks/           kerangka laporan pra-ACC dan artefak run
prompts/kickoff.md         prompt mulai sesi
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
