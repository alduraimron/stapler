# Mode: init

Membuat context pack pertama kali di `.pi/stapler/`. Dipakai juga saat user ingin menyusun ulang dari nol.

Pack adalah artifact hasil kompilasi, jadi urutannya: recon, wawancara, ACC, tulis, ukur, verifikasi.

## 1. Recon (read-only)

Baca secukupnya, jangan seluruh repo. Yang dicari, dalam urutan ini:

| Bagian | Yang dicari | Untuk apa |
| --- | --- | --- |
| Manifest | `package.json` atau padanannya | perintah, stack, dependency test dan lint |
| Konfigurasi | `tsconfig.json`, config lint dan formatter | gate yang tersedia |
| CI | folder workflow CI | penegak aturan, dan gate yang harus sama dengan lokal |
| Schema | schema database dan folder migrasi | konvensi data, kerapuhan, izin khusus |
| Struktur | folder sumber utama, konvensi penamaan | `architecture.md` dan plays |
| Test | cara menjalankan test, ada atau tidak | gate `test` |
| Dokumen yang ada | `AGENTS.md`, `CLAUDE.md`, standar tim, folder ADR, `README.md`, `docs/` | sumber kelas A dan kelas B |
| Aturan pribadi lokal | mis. `.pi/` milik user | sumber `personal` |

Yang juga perlu dicatat: file konteks harness mana yang benar-benar dimuat runtime (global dan project),
beserta hash-nya, untuk dijadikan entri `watched`.

## 2. Wawancara (satu batch)

Kirim sekaligus, masing-masing dengan opsi dan rekomendasi:

1. Konfirmasi stack dan perintah gate: format, typecheck, lint, test, build. Yang tidak ada ditulis `null`.
2. Sumber mana yang `authoritative`, mana `reference-only`, mana `ignored`.
3. Topik yang mau dideviasi (mis. format commit pribadi, konvensi ikon, gaya penamaan), beserta alasannya.
   Untuk tiap deviasi, tanyakan penegaknya: `ci`, `review`, atau `none`.
4. Path yang selalu boleh berubah di luar scope (mis. folder artefak workflow).
5. Play yang perlu dibuat: backend API, slicing UI, UI di atas API, atau lain sesuai hasil recon.
6. Batas bacaan mentah: `index-only` atau `forbidden`.

Kalau user tidak tahu, ajukan default dan tandai sebagai default, supaya bisa dijawab `default ok`.

## 3. Rencana file dan ACC

Sertakan: daftar file yang akan dibuat, file MANUAL yang akan memakai template apa, daftar deviasi yang
akan dicatat, dan satu baris penunjuk untuk file konteks harness. Lalu berhenti dan tunggu ACC.

## 4. Tulis pack

Urutan penulisan:

1. `manifest.json` dari template, diisi hasil wawancara.
2. `verification.mjs` dari template yang paling dekat dengan stack. Sesuaikan hanya bagian yang memang khas
   project (mis. `cleanupPaths`), jangan ubah kontrak CLI.
3. `check.mjs` dan `provenance.mjs` dari template, apa adanya. Keduanya tidak perlu disesuaikan.
4. `rules.md`: larangan, gate, aturan komentar, dan batas scope. Verbatim untuk butir dan perintah.
5. `deviations.md` dari wawancara. Baris safety floor ikut dicetak di bawah tabel.
6. `standards/<topik>.md`: saring standar tim per topik. Sertakan `path:baris` pada butir yang penting.
7. `architecture.md`: urutan lapisan, batas antar lapisan, dan 1 sampai 3 contoh emas dengan `path:baris`.
8. `domain.md`: entitas penting, angka turunan beserta definisinya, gate akses, dan konvensi data.
9. `adr-index.md`: topik ke file ADR. Sekalian laporkan ADR yang tidak terdaftar di indeks sebagai `MISS`.
10. `design.md`: aturan membaca aset desain dan penunjuk foldernya. Jangan menyalin gambar.
11. `plays/*.md` dari template, diisi ringkas sesuai recon. Tandai bagian yang belum diputuskan user sebagai
    pertanyaan terbuka, bukan dikarang.
12. `index.md`: pintu masuk. Isinya: apa itu pack ini, urutan baca untuk tiap jenis task, dan daftar play.
13. Buat folder `runs/` kosong. Tempat artefak per task; skill `stapler` yang mengisinya, dan verifier yang
    menulis balik hasilnya ke sana.
13. Isi `compiledInto` untuk tiap sumber (file pack mana yang dipengaruhi sumber itu) di `provenance.json`,
    lalu tulis ulang dengan `node .pi/stapler/provenance.mjs --generated-by "stapler-context@<versi>"`.
    Jangan menghitung hash secara manual.

Setiap file GENERATED diawali banner: pembuat, versi skill, waktu, dan daftar sumber.

## 5. Ukur baseline

Jalankan gate yang tersedia dengan `--refresh-baseline`, seadanya dulu:

1. Sekali untuk melihat kondisi awal. Merah sebelum perubahan bukan kegagalan `init`; catat apa adanya.
2. Tulis angka baseline lint dan HEAD ke `verification.json` dan salin ke `manifest.json`.
3. Kalau gate `lint` merah karena file yang sudah ada sebelumnya, jangan diperbaiki. Catat di laporan
   sebagai kondisi awal, dan pastikan baseline-nya tercatat supaya tidak dianggap regresi nanti.

Gate build dijalankan hanya kalau user setuju, karena lambat.

## 6. Verifikasi hasil

1. Jalankan `node .pi/stapler/check.mjs` sampai bersih, kecuali temuan yang memang belum bisa ditutup. Sisa temuan dilaporkan.
2. Jalankan verifier sekali dengan `--scope` kosong untuk memastikan kontraknya jalan, dan laporkan exit
   code-nya.
3. Uji negatif yang murah: pastikan gate `scope` benar-benar bisa gagal. Cara aman: jalankan verifier dengan
   `--scope` yang menunjuk satu file yang tidak berubah, lalu pastikan hasilnya sesuai harapan, tanpa
   mengubah file apa pun.

## 7. Penunjuk dan laporan

Usulkan satu baris untuk file konteks harness, misalnya di `AGENTS.md`:

```md
Konteks kerja agent ada di `.pi/stapler/index.md` (dibuat `stapler-context`). Aturan dan deviasi aktif ada di sana.
```

Ubah file itu hanya setelah ACC, dan hanya satu baris itu.

Laporan akhir memuat:

- File yang dibuat dan template yang dipakai.
- Sumber yang dikompilasi, plus sumber kelas A yang diawasi beserta hash-nya.
- Deviasi yang dicatat, dengan risiko dan penegaknya.
- Baseline awal dan exit code tiap gate.
- Temuan: ADR tidak terindeks, standar yang bertentangan, path yang hilang, bagian yang belum diputuskan.
- Yang belum diverifikasi, misalnya gate build kalau tidak dijalankan.

## Jangan

- Menyalin isi standar tim seluruhnya. Saring.
- Mengarang konvensi yang tidak ada di kode atau di standar. Kalau ambigu, tanyakan atau tandai terbuka.
- Menyentuh `.pi/stapler/` milik project lain, atau file di luar folder itu tanpa ACC.
- Mengklaim pack siap kalau `check` masih menemukan `STALE` atau `MISS`.
