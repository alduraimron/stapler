# Stapler: kontrak desain

Dokumen ini adalah kontrak, bukan catatan. Skill, template, dan verifier harus mengikuti isi dokumen ini.
Kalau ada yang berbeda, dokumen ini yang menang, atau dokumen ini yang harus diubah lebih dulu.

Status: v0.1. Berlaku untuk `schemaVersion: 1` pada context pack.

---

## 1. Tujuan

Memisahkan **proses** dari **fakta project**:

- Proses (fase kerja, protokol ACC, format laporan, invariant) hidup di skill dan tidak boleh menyebut
  project tertentu.
- Fakta project (perintah verifikasi, urutan lapisan, path, angka baseline, gate akses, konvensi data)
  hidup di context pack dan tidak boleh hidup di skill.

Efek yang diinginkan: satu paket skill dipakai di repo mana pun tanpa sunting, dan satu project bisa
berganti konvensi tanpa menyentuh skill.

## 2. Istilah

| Istilah    | Arti                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| source     | bahan yang ditulis manusia: standar tim, aturan pribadi, ADR, konfigurasi, kode, desain    |
| compiler   | skill `stapler-context`                                                                   |
| pack       | artifact hasil kompilasi di `.pi/stapler/**`                                              |
| consumer   | skill `stapler`                                                                           |
| play       | konvensi kerja khas project, diedit tangan, disimpan di `plays/`                          |
| run        | artefak satu task di `runs/`, memuat scope, acceptance, keputusan, dan angka verifikasi   |
| safety floor | daftar larangan minimum milik skill yang tidak bisa dimatikan pack                      |

## 3. Tiga lapisan

```text
~/code/stapler/          lapisan 1: skill, portabel, tidak tahu project
        |  kontrak (dokumen ini)
        v
<project>/.pi/stapler/   lapisan 2: context pack, fakta project, hasil kompilasi
        |  menunjuk
        v
sumber project           lapisan 3: standar tim, aturan pribadi, ADR, desain, kode
```

Pack adalah **artefak hasil kompilasi**, bukan indeks pasif. Karena itu pack wajib membawa provenance dan
wajib bisa diperiksa kebasiannya. Menyalin fakta tidak dilarang; menyalin fakta tanpa jejak turunan yang
bisa diverifikasi itu yang dilarang.

## 4. Empat kelas pembacaan

| Kelas | Contoh                                              | Siapa yang memuat                        | Di pack                     |
| ----- | --------------------------------------------------- | ---------------------------------------- | --------------------------- |
| A     | File konteks harness: `~/.pi/agent/AGENTS.md`, `AGENTS.md`, `AGENTS.override.md` | runtime, selalu, tidak bisa dimatikan skill | penunjuk + hash, isi tidak disalin |
| B     | Hasil kompilasi: `rules.md`, `standards/**`, `architecture.md`, `domain.md`, `adr-index.md` | pack                            | isi pack                    |
| C     | Sumber mentah sesuai kebutuhan: ADR tertentu, steering mentah, contoh kode lama | skill, hanya lewat pintu indeks (`rawReads`) | indeks + kebijakan       |
| D     | Objek kerja: file yang diubah, test, fixture, riwayat git | skill, bebas                       | tidak, hanya scope di `runs/` |

Kelas D bukan konteks kebijakan. Membaca file kerja bukan pelanggaran; mengambil aturan baru dari sana
tanpa lewat pintu C itu pelanggaran.

## 5. Precedence

Urutan menang, dari yang tertinggi:

1. `safety-floor` - ada di skill, tidak bisa ditimpa siapa pun.
2. `harness-injected` - instruksi pribadi/global yang di-inject runtime (kelas A).
3. `pack` - aturan project hasil kompilasi (kelas B).
4. `indexed-raw` - detail dari sumber mentah (kelas C). Melengkapi, tidak menimpa.
5. `general-practice` - pengetahuan umum dan kebiasaan model.

Konflik karena **kebasian** bukan urusan precedence. Kalau `check` menyatakan pack basi, `stapler` berhenti
dan tidak mengimplementasi. Jadi urutan di atas hanya dipakai saat semuanya dalam keadaan segar.

## 6. Status sumber dan override

Setiap sumber di `manifest.json` punya `role`:

| role               | Arti                                                        | Disalin ke pack?            |
| ------------------ | ----------------------------------------------------------- | --------------------------- |
| `authoritative`    | standar yang mengikat                                       | ya, disaring                |
| `reference-only`   | tetap dikompilasi sebagai konteks, tapi tidak mengikat       | ya, sebagai catatan         |
| `ignored`          | tidak dipakai sama sekali                                   | tidak                       |
| `personal`         | aturan pribadi untuk repo ini                               | ya                          |
| `harness-injected` | sudah masuk otomatis lewat runtime                          | tidak, hanya penunjuk + hash |

Override dilakukan **per topik**, bukan per dokumen, supaya mengganti satu kebiasaan tidak membuang seluruh
standar:

```json
{
  "path": ".kiro/steering/git-commit.md",
  "role": "reference-only",
  "override": {
    "commit-format": {
      "useSource": ".pi/personal/commit.md",
      "reason": "preferensi pribadi",
      "enforcedBy": "review"
    }
  }
}
```

- `reason` wajib. Satu baris, supaya enam bulan lagi masih jelas.
- `enforcedBy` wajib kalau topiknya punya penegak: `ci`, `review`, atau `none`. Kalau `ci`, compiler wajib
  mencari buktinya di konfigurasi CI dan menyalin path-nya ke catatan deviasi.
- Compiler **menolak** manifest yang mencoba menimpa `safety-floor`.

## 7. Struktur pack

```text
.pi/stapler/
|- index.md            MANUAL    pintu masuk, 20 baris: isi pack + baca apa untuk apa
|- manifest.json       MANUAL    sumber, override, perintah, scope, lint baseline
|- verification.mjs    MANUAL    verifier project, kontrak CLI tetap
|- plays/              MANUAL    konvensi kerja khas project
|- provenance.json     GENERATED hash sumber, HEAD, waktu kompilasi
|- rules.md            GENERATED aturan mengikat, satu butir satu baris, ada anotasi sumber
|- deviations.md       GENERATED penyimpangan aktif dari standar tim
|- standards/          GENERATED saringan standar per topik
|- architecture.md     GENERATED urutan lapisan + contoh emas path:baris
|- domain.md           GENERATED entitas, angka turunan, gate akses, konvensi data
|- adr-index.md        GENERATED topik -> file ADR
|- design.md           GENERATED penunjuk aset desain + aturan pembacaannya
|- verification.json   GENERATED perintah, baseline, hasil run terakhir
`- runs/               GENERATED artefak per task
```

Aturan yang menempel:

1. File `GENERATED` tidak boleh diedit tangan. Kekurangan diperbaiki di sumber, lalu `refresh`.
2. `refresh` tidak boleh menimpa file `MANUAL`. Untuk `manifest.json`, `verification.mjs`, dan `plays/`,
   compiler hanya mengusulkan diff.
3. Setiap file `GENERATED` diberi banner di baris pertama: pembuat, versi, waktu, daftar sumber.
4. Anggaran baris untuk yang dibaca setiap sesi: `index.md` maksimal 25, `rules.md` maksimal 80,
   `deviations.md` maksimal 40. `standards/*` masing-masing 40 sampai 120. Total bacaan satu sesi biasa
   ditargetkan di bawah 400 baris. Kalau tidak muat, isinya detail dan tempatnya di sumber, bukan di pack.

## 8. Aturan kompilasi

| Wajib verbatim                                                     | Boleh diringkas                  |
| ------------------------------------------------------------------ | -------------------------------- |
| Kalimat larangan                                                    | Narasi arsitektur                |
| Perintah dan flag-nya                                               | Latar belakang domain            |
| Path file, nama fungsi, nama script                                 | Alasan historis                  |
| Angka baseline dan ambangnya                                        | Ringkasan ADR lama               |
| Gate akses, konvensi data, definisi angka turunan                   | Catatan proses kerja             |

Verbatim berlaku untuk butir dan fakta, bukan untuk seluruh dokumen. Isi file kelas A tidak pernah disalin.

## 9. `manifest.json`

```json
{
  "schemaVersion": 1,
  "projectName": "contoh-app",
  "stack": "next-prisma",
  "rawReads": "index-only",
  "precedence": ["safety-floor", "harness-injected", "pack", "indexed-raw", "general-practice"],
  "commands": {
    "format": "npx prettier --check",
    "typecheck": "npx tsc --noEmit",
    "lint": "npm run lint",
    "test": null,
    "build": "npm run build"
  },
  "cleanupPaths": [".next/types", ".next/dev/types"],
  "format": { "ignore": [".pi/**"], "headProbe": "npx prettier --stdin-filepath" },
  "lint": {
    "parser": "auto",
    "parserPath": null,
    "baseline": { "errors": null, "warnings": null, "measuredAt": null, "head": null },
    "ignoreFiles": []
  },
  "scope": { "paths": [], "always": [".pi/**", "AGENTS.md"] },
  "sources": [],
  "harnessInjected": [
    { "path": "~/.pi/agent/AGENTS.md", "scope": "global" },
    { "path": "AGENTS.md", "scope": "project" }
  ]
}
```

Catatan field:

- `rawReads`: `index-only` (default) atau `forbidden`.
- `commands`: nilai `null` berarti gate itu dilewati, dan verifier wajib melaporkannya sebagai `skip`
  beserta alasannya, bukan sebagai hijau. Khusus `format`, nilainya adalah awalan perintah yang dijalankan
  per file, misalnya `npx prettier --check` atau `npx biome format`.
- `cleanupPaths`: dibersihkan sebelum dan sesudah gate, untuk artefak build yang bisa memalsukan hasil
  typecheck.
- `format.ignore`: path yang dilewati gate format, default `.pi/**`. Artefak workflow, termasuk
  `verification.json` yang ditulis verifier sendiri, tidak perlu diformat dan tidak boleh membuat gate merah.
- `format.headProbe`: opsional. Awalan perintah yang membaca isi file dari stdin untuk memeriksa apakah
  file itu sudah gagal sebelum perubahan ini. Kosongkan kalau formatter tidak mendukung cara ini.
- `lint.parser`: cara membaca keluaran linter. `auto` (default) mencoba JSON lalu teks stylish; pilihan lain
  `eslint-json`, `eslint-stylish`, `exit-only`, dan `custom`. `exit-only` tidak bisa mendeteksi regresi per
  file, jadi hasilnya hanya `pass` atau `warn`, tidak pernah `fail` karena isi.
- `lint.parserPath`: dipakai saat `lint.parser` bernilai `custom`. Modulnya wajib punya default export
  `(output, ctx) => { errors, warnings, files }` atau `null` kalau keluarannya tidak bisa dibaca.
  `ctx.root` adalah akar project dan `ctx.relative(path)` mengubah path absolut menjadi relatif akar.
- `scope.always`: path yang selalu boleh berubah tanpa dianggap keluar scope.

## 10. `provenance.json`

```json
{
  "schemaVersion": 1,
  "generatedBy": "stapler-context@0.1.0",
  "generatedAt": "2026-10-02T09:14:00+07:00",
  "head": "67c6d47",
  "sources": [
    { "path": ".pi/rules.md", "sha256": "...", "compiledInto": ["rules.md", "standards/git.md"] },
    { "path": "~/.pi/agent/AGENTS.md", "sha256": "...", "watched": true },
    { "path": ".pi/stapler/verification.mjs", "manual": true }
  ]
}
```

- `compiledInto` untuk yang isinya memengaruhi pack.
- `watched` untuk file kelas A: diawasi, tidak disalin.
- `manual` untuk file yang sengaja tidak digenerate, supaya `check` tidak melaporkannya sebagai hilang.

## 11. `deviations.md`

```md
# Deviasi dari standar tim

| Topik         | Standar tim                    | Yang dipakai            | Alasan              | Risiko | Terlihat tim      | Penegak |
| ------------- | ------------------------------ | ----------------------- | ------------------- | ------ | ----------------- | ------- |
| commit-format | .kiro/steering/git-commit.md   | .pi/personal/commit.md  | preferensi pribadi  | rendah | ya, riwayat commit | review  |
```

Aturan:

1. Diklasifikasi menurut risiko pada **output yang dibaca tim**, bukan menurut selera: kontrak dan gate
   berisiko tinggi, format dan penamaan rendah, detail internal rendah.
2. Setiap baris muncul di laporan pra-ACC sebagai bagian wajib, dan di laporan akhir sebagai baris
   "deviasi aktif".
3. Kalau penegaknya `ci`, compiler menuliskan path buktinya. Contoh: alur CI yang menjalankan lint.
4. Deviasi tidak pernah menghapus baris `safety floor`; baris itu ikut dicetak di bawah tabel.

## 12. Kesegaran dua sumbu

| Sumbu           | Berubah kalau                        | Dideteksi dengan          |
| --------------- | ------------------------------------ | ------------------------- |
| Dokumen/aturan  | isi sumber berubah                   | hash isi file             |
| Fakta dari kode | kode berubah walau dokumen tetap     | HEAD dan pengukuran ulang |

Temuan `check`:

| Kode              | Arti                                                        | Tindakan  |
| ----------------- | ----------------------------------------------------------- | --------- |
| `STALE`           | hash sumber berbeda dari yang tercatat                      | refresh   |
| `HARNESS-CHANGED` | file kelas A berubah                                        | tinjau    |
| `DEVIATION-STALE` | standar tim berubah sehingga deviasi mungkin tidak relevan   | refresh   |
| `MISS`            | path yang dirujuk pack tidak ada, atau ADR tidak terindeks   | refresh   |
| `WARN`            | fakta terukur ketinggalan (mis. HEAD bergerak)               | verifikasi |
| `OK`              | tidak ada temuan                                             | -         |

Exit code `check`: `0` kalau hanya `OK` dan `WARN`, `1` kalau ada `STALE`, `HARNESS-CHANGED`, `MISS`, atau
`DEVIATION-STALE`. Dengan begitu `check` bisa dipakai sebagai gate di langkah 1 `stapler` maupun di CI.

## 13. Kontrak verifier

```text
node .pi/stapler/verification.mjs [--scope <path,...>] [--with-build] [--json] [--refresh-baseline] [--list-gates]
```

- Exit `0`: semua gate hijau, atau merah yang terbukti sudah ada sebelum perubahan ini.
- Exit `1`: ada regresi, atau ada file berubah di luar scope.
- `--json`: keluaran mesin, bentuknya:

```json
{
  "ok": true,
  "head": "67c6d47",
  "scope": ["src/app/dashboard/keuangan"],
  "gates": [{ "name": "lint", "status": "warn", "detail": "14 error, baseline 14" }],
  "baseline": { "errors": 14, "measuredAt": "2026-10-02", "head": "67c6d47" }
}
```

Aturan gate:

1. Gate `scope` gagal kalau ada file berubah di luar `--scope`, kecuali cocok dengan `scope.always`.
2. Gate `lint` dibandingkan **per file**, bukan hanya total. Error baru di file yang termasuk scope selalu
   dianggap regresi, walau totalnya turun karena error lama hilang di file lain.
3. Baseline yang belum pernah diukur tidak pernah dianggap regresi: gate dilaporkan `warn` dengan saran
   menjalankan `--refresh-baseline`. Tanpa scope, error yang ada hanya dilaporkan sebagai catatan, karena
   tidak ada dasar untuk menyebutnya regresi.
4. Error di file yang sudah pernah gagal sebelum perubahan dilaporkan sebagai `warn`, bukan `fail`.
5. Gate yang `null` di manifest dilaporkan `skip` beserta alasannya.
6. `--refresh-baseline` hanya menulis `verification.json`, tidak pernah menggagalkan gate.
7. Gate `format` melewati `format.ignore`, dan gate `scope` mengabaikan `scope.always`, sehingga hasil
   verifier sendiri tidak pernah dianggap perubahan.
8. Gate `format` memakai `commands.format` dari manifest sebagai awalan perintah, lalu dijalankan per file:
   `COMMAND <file>`. Tiga hasil dibedakan supaya pesannya tidak menyesatkan: `belum rapi`, `tidak bisa
   di-parse` (berarti kode rusak, bukan masalah format), dan `skip` kalau alatnya tidak bisa dijalankan.
9. Deteksi "sudah gagal di HEAD" bersifat opsional lewat `format.headProbe`, karena caranya berbeda tiap
   formatter. Untuk prettier: `npx prettier --stdin-filepath`; isi file dari HEAD dikirim ke stdin dan
   keluarannya dibandingkan dengan isi itu. Tanpa `headProbe`, file yang gagal dilaporkan sebagai regresi
   beserta saran menambahkannya ke `format.ignore`.

### Dukungan linter

Verifier hanya memarsing dua format secara bawaan, keduanya dari ESLint: JSON (`eslint --format json`) dan
teks stylish. Untuk linter lain, dua jalur yang disarankan:

| Linter | Cara yang disarankan |
| --- | --- |
| ESLint | `lint.parser: "eslint-json"` dengan perintah `npm run lint -- --format json`; ini yang paling tahan lama |
| Biome, Ruff, golangci-lint, lainnya | keluarkan JSON dari linter itu, lalu tulis parser `custom` yang membaca bentuk JSON tersebut |
| Linter apa pun tanpa rincian per file | `lint.parser: "exit-only"`; gate tidak akan pernah gagal karena isi, hanya melaporkan exit code |

Konsekuensinya harus dinyatakan jujur di laporan `init`: selama parser masih `exit-only`, klaim "tidak ada
regresi lint" tidak bisa dibuktikan, dan itu ditulis sebagai batasan, bukan sebagai hijau.

## 14. Play

Play adalah konvensi kerja khas project, misalnya cara mengerjakan backend API, cara slicing UI, atau cara
memindahkan UI dari mock ke API. Play bukan proses; prosesnya tetap milik mode di skill.

- Lokasi: `.pi/stapler/plays/<nama>.md`, ditandai `MANUAL`.
- Dibuat sekali oleh `init` dari template di paket, lalu diisi oleh compiler berdasarkan recon dan
  wawancara, atau ditulis tangan.
- `rules.md` menyebut daftar play beserta kapan dibaca; `stapler` memilih play berdasarkan jenis task.
- `refresh` tidak menimpa play; perubahan diusulkan sebagai diff.

## 15. Artefak run dan gate scope

Setiap task menulis satu file `runs/<tanggal>-<slug>.md`:

```text
scope:        daftar file yang disetujui
acceptance:   daftar yang bisa diperiksa
aturan:       sumber aturan yang berlaku (pack, harness, deviasi)
verifikasi:   angka hasil verifier per gate
penyimpangan: ada atau tidak, beserta alasannya
kandidat ADR: daftar atau tidak ada
ACC:          pertama | perlu diulang (alasan)
```

- `scope` dipakai sebagai argumen `--scope` saat verifikasi. Ini yang mengubah invariant "tidak menyentuh
  file di luar scope" dari niat menjadi gate.
- Isi `penyimpangan` dan `ACC` adalah bahan evaluasi untuk memelihara skill: titik yang berulang gagal
  diperbaiki di skillnya, bukan ditambal dengan aturan baru.

## 16. Versi dan kompatibilitas

- `schemaVersion` ada di `manifest.json` dan `provenance.json`.
- Skill menyatakan rentang skema yang didukung. Pack dengan skema lebih baru: `check` melaporkan `STALE`
  dan `stapler` berhenti.
- Perubahan yang menambah field opsional: naikkan versi minor paket.
- Perubahan yang mengubah arti field, menghapus field, atau mengubah bentuk keluaran verifier: naikkan
  versi mayor skema dan sediakan catatan migrasi di `docs/`.

## 17. Yang belum diputuskan

1. Apakah pack boleh di-commit saat tim mau berbagi, dan kalau ya, bagaimana memisahkan sumber pribadi
   (mis. `.pi/rules.md`) dari sumber tim.
2. Bentuk hash untuk dokumen besar: hash isi penuh, atau hash per bagian supaya `refresh` bisa lebih
   selektif.
3. Apakah `refresh` boleh berjalan otonom tanpa ACC untuk perubahan yang murni kosmetik.
4. Format tunggal untuk `runs/` supaya bisa direkap lintas task (hitung ACC yang perlu diulang, gate yang
   paling sering merah).
