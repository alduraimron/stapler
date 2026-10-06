---
name: stapler
description: "Alur kerja satu sesi untuk mengerjakan task: pastikan context pack siap, inspeksi, tanya semua ambiguitas sekaligus, tunggu ACC, implementasi, verifikasi deterministik, lapor. Pakai saat pengguna meminta fitur, bugfix, refactor, atau integrasi."
disable-model-invocation: true
---

# Alur kerja: pack, inspeksi, ACC, implementasi, verifikasi

## Objective

Menghasilkan perubahan yang benar, konsisten dengan konvensi project, sesempit mungkin, sudah diverifikasi,
dan bisa dipertanggungjawabkan ke user - semuanya dalam satu sesi.

Skill ini tidak tahu apa pun tentang project tertentu. Semua fakta project dibaca dari context pack di
`.pi/stapler/` yang dibuat oleh skill `stapler-context`. Aturan lengkapnya di `docs/design.md` paket ini.

## Kapan dipakai / tidak dipakai

Dipakai saat user memanggil skill ini dengan salah satu mode di bawah.

Tidak dipakai untuk: pertanyaan atau riset yang tidak mengubah file, pekerjaan yang user minta dikerjakan
"langsung saja" tanpa ACC, atau perubahan yang user minta eksplisit menyimpang dari alur ini.

## Langkah 0: pastikan pack siap (fail closed)

1. `node .pi/stapler/check.mjs`. Ini bagian mekanis: hash sumber, file kelas A, path yang dirujuk, index ADR, dan kesegaran baseline.
2. Baca `.pi/stapler/index.md`, `manifest.json`, `rules.md`, dan `deviations.md`.
3. Hasilnya menentukan:
   - Exit 0 (hanya OK dan WARN): lanjut ke langkah 1. Catatan WARN dibawa ke laporan.
   - Exit 1 (ada STALE, HARNESS-CHANGED, MISS, atau DEVIATION-STALE): **berhenti mengimplementasi**. Yang boleh hanya recon dan laporan pra-ACC dengan satu baris berisi temuan dan perintah yang perlu dijalankan user (`stapler-context refresh`, atau perbaikan yang diminta temuan itu).
   - Pack belum ada: sama, berhenti dan minta `stapler-context init`.

Kalau skrip itu tidak tersedia (pack dari versi lama), lakukan versi minimalnya secara manual: bandingkan hash sumber di `provenance.json` dengan isi file sekarang, dan pastikan semua path yang dirujuk pack masih ada.

## Empat kelas pembacaan

| Kelas | Isi | Siapa yang memuat |
| --- | --- | --- |
| A | File konteks harness: `AGENTS.md` global dan project | runtime, selalu |
| B | Isi pack: `rules.md`, `standards/**`, `architecture.md`, `domain.md`, play | skill ini, sesuai kebutuhan |
| C | Sumber mentah yang terdaftar di indeks pack | skill ini, hanya sesuai `rawReads` |
| D | Objek kerja: kode, test, fixture, riwayat git | skill ini, bebas |

Precedence saat aturan bertentangan: `safety-floor` lalu `harness-injected` lalu `pack` lalu
`indexed-raw` lalu `general-practice`. Kalau kamu membaca kelas C, sebutkan di laporan pra-ACC: path dan
alasannya. Itu sinyal untuk compiler bahwa topik itu perlu dikompilasi.

## Slaver (opsional)

Jika tool `delegate` tersedia, gunakan Slaver untuk investigasi terarah dan review independen sesuai
langkah 1, 2, dan 6. **Baca [kontrak delegasi](../../docs/slaver.md) sebelum pemanggilan pertama.** Profil
`impact`, `scope-review`, dan `change-review` tetap read-only. Setelah ACC, gunakan profil
`implement-approved` bila skema `delegate` memuat role `implementer` dan field `runPath` (Slaver V1).
Slaver V0 tetap bisa dipakai untuk investigasi/review; implementasinya dilakukan parent. Jangan meminta
scout/reviewer menulis atau mengirim role/field yang tidak tersedia.

Agent utama tetap memegang ACC, scope/keputusan, penulisan pack/ADR/run, check, verifier, dan review diff sendiri.
Child tunduk pada pack, precedence, safety floor, dan `rawReads` yang sama; bacaan kelas C child ikut
masuk laporan pra-ACC. Tanpa tool atau jika user meminta tanpa subagent, lakukan fase itu sendiri dan
laporkan skip. Kegagalan tidak di-retry otomatis; pembatalan menunggu arahan user.

## Safety floor (tidak bisa ditimpa pack)

1. Jangan pernah mencatat kredensial, token, atau data sensitif ke kode, log, atau laporan.
2. Jangan melemahkan pemeriksaan supaya hijau: jangan matikan lint atau tsc, jangan hapus assertion,
   jangan menambah pengecualian tanpa izin.
3. Jangan melewati atau melonggarkan gate auth dan otorisasi.
4. Jangan menaruh nilai kredensial asli di file yang ter-track Git.
5. Jangan menjalankan aksi destruktif (migrasi, reset, hapus data) tanpa izin eksplisit di sesi itu.
6. Jangan commit atau push kecuali user meminta eksplisit di sesi ini.

Kalau aturan di pack bertentangan dengan daftar ini, safety floor menang, dan kamu berhenti serta melapor.

## Invariants

- Tidak menulis kode sebelum user bilang ACC.
- Tidak menyentuh file di luar daftar yang disetujui; tidak "sekalian merapikan".
- Aturan project yang mengikat ada di `.pi/stapler/rules.md`; deviasi yang aktif ada di
  `.pi/stapler/deviations.md` dan wajib disebut di laporan.
- Efek samping yang berbahaya (deploy otomatis, job terjadwal, perubahan data) disebut di pra-ACC, bukan
  ditemukan sendiri oleh user setelah kejadian.

## Mode

| Mode | File | Kapan dipakai |
| --- | --- | --- |
| feature | [modes/feature.md](modes/feature.md) | fitur atau halaman baru dari nol, biasanya bertahap |
| integration | [modes/integration.md](modes/integration.md) | mengganti data mock dengan data nyata; UI tidak dirombak |
| bugfix | [modes/bugfix.md](modes/bugfix.md) | ada gejala yang bisa direproduksi |
| refactor | [modes/refactor.md](modes/refactor.md) | merapikan atau mengganti struktur |

Selain mode di atas, pack bisa punya **play** di `.pi/stapler/plays/`: konvensi kerja khas project, misalnya
cara mengerjakan backend API, cara slicing UI, atau cara memindahkan UI ke API. `rules.md` menyebut daftar
play dan kapan dibaca. Pakai play yang cocok dengan task, dan sebut di laporan kalau play yang seharusnya
ada ternyata belum dibuat.

Tentukan mode dari argumen. Kalau kosong: simpulkan dari kalimat user, konfirmasi satu baris, baru lanjut.
**Baca file mode-nya** sebelum mulai, karena isinya memuat yang khusus untuk mode tersebut, termasuk apa
yang wajib ada di laporan pra-ACC dan verifikasi tambahannya.

## Workflow

### 1. Understand & Inspect (read-only)

- Baca file mode, lalu `rules.md`, `deviations.md`, dan bagian pack yang relevan dengan jenis task
  (`standards/<topik>.md`, `architecture.md`, `domain.md`, play yang cocok).
- Susun **checklist aturan**: butir yang berlaku untuk task ini, dari pack dan dari kelas A. Untuk tiap
  butir: sumbernya dan cara memeriksanya. Tandai butir yang tidak berlaku beserta alasannya.
- Cari 1-2 implementasi terdekat di kode sebagai acuan, kutip `path:baris`, tiru polanya. `architecture.md`
  biasanya sudah menunjuk contoh emas.
- Ada aset desain: ambil fakta kasarnya (teks, urutan elemen, state, token warna, komponen yang dipakai)
  mengikuti aturan di `design.md` pack. Jangan forensik piksel.
- Cek asumsi: pastikan path file, nama fungsi, dan endpoint yang akan disebut benar-benar ada.
- Bila ada pertanyaan alur/dampak/test yang belum terjawab dan `delegate` tersedia, gunakan `scout`
  dengan profil `impact`. Berikan pertanyaan bounded, path pack/objek kerja, checklist aturan, dan izin
  bacaan mentah. Periksa bukti yang menentukan scope; temuan child bukan aturan project baru.

### 2. Decide & Ask (satu batch, sekali kirim)

- Sebelum mengirim batch ini, untuk scope lintas modul, perubahan kontrak/gate akses, atau keputusan
  yang belum pasti, gunakan `reviewer` profil `scope-review` jika tersedia. Kirim usulan scope dan
  acceptance berlabel **belum ACC**, lalu masukkan temuan valid ke batch yang sama. Child tidak memberi ACC.
- Konflik standar versus implementasi: 3 opsi (ikut standar / ikut implementasi / rekomendasi) plus
  konsekuensinya, lalu tunggu keputusan.
- Semua pertanyaan sekaligus, masing-masing dengan opsi dan rekomendasi. Yang tidak mengubah hasil tidak
  perlu ditanyakan.
- Daftar file: dibuat, diubah, dihapus, plus yang **tidak** disentuh.
- Acceptance yang bisa diperiksa, plus langkah uji manualnya.
- Ringkasan keputusan yang diusulkan, 3 sampai 6 baris.
- Checklist aturan dari langkah 1: butir yang berlaku dan statusnya.
- Dua baris wajib: **aturan berlaku** (pack, kelas A, deviasi aktif) dan **sumber mentah yang dibaca**
  (kalau ada).
- **Status ACC** sebagai baris terakhir: "Menunggu ACC untuk scope ini. Keputusan belum dijawab: daftar
  atau `tidak ada`. Kalau setuju dengan default: balas `default ok`."

### 3. Tunggu ACC

Berhenti sampai user memberi ACC untuk **scope yang persis ini**. Tidak ada edit file sebelum itu.

Yang dihitung ACC: balasan eksplisit terhadap ringkasan pra-ACC (`ACC`, `ok`, `setuju`, `default ok`).

Yang **bukan** ACC, walaupun terdengar seperti izin:

- instruksi lanjutan seperti "kerjakan", "masuk implementasi", "gas" - kalau masih ada keputusan pra-ACC
  yang belum dijawab, atau ringkasan pra-ACC belum pernah dikirim untuk scope ini;
- ACC untuk langkah yang lebih sempit (mis. "tambah kolom, push, generate dulu saja" hanya mengizinkan
  langkah itu, bukan keseluruhan task);
- diam, atau pertanyaan balik yang tidak menyebut setuju atau tidak setuju.

Kalau salah satu kondisi itu terjadi: kirim ringkasan singkat 3 sampai 6 baris untuk scope yang akan
dikerjakan, tambahkan daftar keputusan yang masih terbuka, lalu tunggu lagi. Kalau permintaan berubah,
ulangi langkah 2 untuk bagian yang berubah saja.

### 4. Execute

- Tulis artefak run lebih dulu: `.pi/stapler/runs/<tanggal>-<slug>.json`, bentuknya mengikuti
  `templates/tasks/run-log.json` di paket. Isi `scope` dengan daftar file yang disetujui user persis seperti
  di laporan pra-ACC, plus `mode`, `play`, `acceptance`, `rules`, dan `acc`. Isi `delegations` dengan
  catatan inspeksi/review pra-ACC yang dipilih, termasuk skip/fallback; baru tulis catatan itu setelah ACC.
  Artefak ini yang dibaca verifier, jadi jangan mengandalkan daftar yang disusun ulang saat verifikasi.
- Jika `delegate` mendukung `implementer`/`runPath` dan user tidak meminta tanpa implementer, gunakan
  profil `implement-approved` sebagai default setelah ACC dan run ditulis. Kirim path run, pack/checklist
  aturan, dan tujuan bounded; scope/acceptance dimuat Slaver dari run, bukan diganti lewat teks task.
  Jangan memperbarui run atau menjalankan verifier selama child aktif; catat outcome setelah terminal.
- Child hanya punya `scoped_edit`/`scoped_write` untuk file tepat dalam scope. Pack/run/ADR/harness tetap
  milik parent; scope direktori, protected files, symlink atau hardlink harus dilaporkan sebagai blocker,
  bukan diperluas. Deletion/rename yang sudah di-ACC dikerjakan parent setelah child selesai.
- Jika implementer tidak tersedia atau user memilih kerja tanpa subagent, catat skip dan kerjakan
  sendiri sesempit scope itu. Komentar kode hanya WHY dan singkat, mengikuti aturan komentar di pack.
- Jika implementer gagal, timeout, atau dibatalkan, periksa diff/worktree untuk perubahan parsial lebih
  dulu. Jangan rollback, retry, atau fallback menulis secara otomatis. Laporkan keadaan dan blocker;
  pembatalan menunggu arahan user. Completed bukan bukti acceptance: lanjutkan verifikasi oleh parent.
- Setelah child completed, baca diff sendiri sebelum menjalankan perintah: pastikan scope, keputusan,
  dan efek samping sesuai ACC. Jangan mengeksekusi perubahan script/gate yang melanggar safety floor.
- Keputusan yang bertahan melampaui task ini: kumpulkan sebagai kandidat ADR dan tulis di langkah 6
  setelah user setuju, mengikuti bentuk ADR di pack.
- Temuan di luar scope: catat di laporan, jangan dikerjakan.

### 5. Verify (loop)

- Jalankan verifier yang dideklarasikan `manifest.json` dengan artefak run sebagai sumber scope:
  `node .pi/stapler/verification.mjs --scope-from .pi/stapler/runs/<file run>.json`, dan tambahkan
  `--with-build` sesuai mode atau sesuai isi `manifest.json`.
- Hasil verifikasi ditulis balik oleh verifier ke field `verification` di artefak run, jadi jangan mencatat
  angkanya secara manual.
- Merah: diagnosis penyebabnya, perbaiki, jalankan lagi. Jangan berhenti setelah satu percobaan.
- Merah karena kode tim lain atau artefak build: buktikan penyebabnya dan laporkan apa adanya. Jangan
  memperbaiki di luar scope, jangan klaim hijau.

### 6. Review akhir

Baca `git diff` sendiri sebelum melapor: cari perubahan yang tidak diminta, kode mati, duplikasi, atau
kontrak yang ikut berubah. Bandingkan dengan acceptance di langkah 2.

Jika `delegate` tersedia, gunakan `reviewer` profil `change-review` sebagai default. Agent utama menyediakan
diff terkini (termasuk untracked/deletion), scope dan acceptance dari run, checklist aturan/deviasi, serta
hasil verifier; jangan meminta child menjalankan git atau test. Nilai temuan dan catat outcome/penilaian di
`delegations`. Perbaikan dalam scope kembali ke langkah 4/5, lalu review ulang bagian yang berubah;
perluasan scope atau keputusan baru kembali ke pra-ACC. Bila delegasi dilewati/gagal, lakukan review sendiri
dan laporkan keterbatasannya, tanpa mengklaim review independen lulus.

**Checkpoint ADR** (wajib, jangan dilewati): sebutkan keputusan yang bertahan melampaui task ini. Untuk
masing-masing: usulkan ADR (tunggu setuju, lalu tulis dan daftarkan di indeks) atau catat alasan tidak
perlunya. "Tidak ada ADR" tanpa daftar kandidat bukan jawaban yang sah. Pemicu yang sering muncul:
konvensi data, definisi angka turunan, gate akses, strategi pengambilan data, deviasi sengaja dari standar,
dan kesepakatan proses yang akan ditanyakan lagi nanti.

### 7. Laporan

Ringkas: file yang berubah, hasil verifikasi berupa angka atau exit code, deviasi dari rencana dan
alasannya, yang belum diuji, temuan di luar scope, saran pesan commit satu baris. Sebutkan juga file run yang
menjadi jejak task ini, dan lengkapi field `acceptance` serta `acc` kalau belum terisi. Laporkan delegasi
yang dipilih: profil, ID, status, penilaian agent utama, dan alasan skip/fallback; jangan menyalin transcript.

Tiga baris ini wajib ada:

- **Aturan yang berlaku**: butir dari checklist langkah 1, dari sumber mana, dan penyimpangannya kalau ada.
- **Deviasi aktif**: daftar dari `deviations.md` yang relevan dengan task ini, atau `tidak ada`.
- **Keputusan bertahan**: ADR ditulis atau tidak ada, beserta kandidat yang dipertimbangkan.

## Berhenti dan lapor kalau

- Pack belum ada atau basi, sehingga aturan project tidak bisa dipastikan.
- Requirement bertentangan dengan kontrak project atau ADR `Accepted`.
- Butuh data, akun, atau akses yang tidak tersedia.
- Bukti belum cukup untuk menyimpulkan (khusus bugfix).
- Perbaikan menuntut perubahan di luar scope yang disetujui.

Jangan mengarang asumsi untuk menutupi blocker.

## Completion criteria

- Semua acceptance terpenuhi, atau dilaporkan mana yang tidak dan kenapa.
- Verifier hijau, atau merah yang terbukti berasal dari luar perubahan ini.
- Tidak ada file berubah di luar scope yang disetujui, dibuktikan oleh gate `scope`.
- `runs/` terisi, termasuk catatan delegasi yang dipilih, dan risiko serta temuan dilaporkan.

## Contoh yang salah (hindari)

- Membuat helper atau abstraksi baru untuk satu pemakai padahal sudah ada yang bersama; cari dulu di
  `architecture.md` dan di implementasi terdekat.
- Menyalin pola dari file lain yang justru melanggar standar terbaru, tanpa mengangkat konfliknya ke user.
- Merapikan format atau rename file lain "sekalian".
- Melonggarkan pemeriksaan supaya verifier hijau.
- Mulai implementasi karena user bilang "kerjakan" padahal masih ada keputusan pra-ACC yang belum dijawab.
- Melaporkan "tidak ada ADR" tanpa menyebut kandidat keputusan yang muncul di task itu.
- Menyalin aturan project langsung dari standar tim sambil melewati pack, sehingga deviasi yang sudah
  disepakati user ikut terlanggar.

## Memelihara skill ini

Kalau alur ini gagal berulang di titik yang sama, perbaiki penyebabnya di skill, biasanya cukup satu
prinsip, jangan menambah aturan tambal-sulam. Bahan untuk menilai itu ada di `runs/`: berapa kali ACC harus
diulang, dan gate mana yang paling sering merah.

Mode baru yang murni proses: buat `modes/<nama>.md` dan tambah satu baris di tabel Mode. Konvensi yang
khas project tidak masuk ke sini; itu play di pack.
