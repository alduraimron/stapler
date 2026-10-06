# Mode: refresh

Mengompilasi ulang pack setelah sumber berubah. Bekerja berdasarkan selisih hash, bukan menulis ulang
semuanya.

## 1. Tentukan yang berubah

1. Jalankan `node .pi/stapler/check.mjs` dulu, atau langsung bandingkan hash di `provenance.json` dengan isi sumber sekarang.
2. Kelompokkan temuan:
   - Sumber yang isinya berubah: perlu dikompilasi ulang.
   - File kelas A yang berubah: tidak dikompilasi, hanya perbarui hash dan nilai `watched`.
   - Fakta dari kode yang bergerak (HEAD, baseline): perlu diukur ulang, bukan dikompilasi.
   - Path yang hilang atau ADR yang tidak terindeks: perlu perbaikan indeks.
3. Untuk tiap sumber yang berubah, tentukan bagian pack mana yang terdampak. Ini yang membuat refresh
   selektif, bukan menulis ulang semua file.
4. Jika dampak semantik sumber yang berubah belum jelas dan tool `delegate` tersedia, gunakan `scout`
   profil `source-map` sesuai [kontrak delegasi](../../../docs/slaver.md). Batasi pada sumber berubah dan
   `compiledInto`; jangan meminta recon seluruh repo. Pilihan role/override tetap milik compiler dan user.

## 2. Usulkan diff dan tunggu ACC

Kirim ringkas:

- Sumber yang berubah, satu baris per file, beserta ringkasan perubahannya di tingkat aturan.
- File pack yang akan berubah, dan isi perubahannya.
- Dampak ke deviasi: mana yang masih relevan, mana yang perlu dicabut atau diubah.
- Pertanyaan baru, kalau perubahan sumber menimbulkan ambiguitas.

Jangan menulis apa pun sebelum ACC. Untuk perubahan yang murni hasil pengukuran (baseline, HEAD), tetap
sebutkan di ringkasan, tapi tidak perlu menunggu keputusan.

## 3. Tulis ulang

1. Perbarui hanya file GENERATED yang terdampak.
2. File MANUAL tidak pernah ditimpa. Untuk `manifest.json`, `verification.mjs`, dan `plays/`, tampilkan diff
   yang diusulkan dan biarkan user yang mengubah, atau minta izin eksplisit lebih dulu.
3. Perbarui `deviations.md` kalau ada deviasi yang dicabut atau ditambah. Setiap perubahan deviasi butuh
   keputusan user, bukan kesimpulan sendiri.
4. Perbarui `provenance.json` dengan menjalankan `node .pi/stapler/provenance.mjs`, jangan menghitung hash secara manual. `compiledInto` yang sudah ada akan dipertahankan.
5. Perbarui angka terukur lewat verifier `--refresh-baseline`, jangan menulis angka baseline secara manual.

## 4. Verifikasi

1. Jalankan `node .pi/stapler/check.mjs` lagi. Harus bersih dari `STALE`, `MISS`, dan `DEVIATION-STALE`.
2. Kalau masih ada `WARN`, jelaskan artinya, jangan diamkan.
3. Jika hasil kompilasi lolos check, gunakan `reviewer` profil `pack-audit` jika tersedia, hanya untuk
   pasangan sumber -> hasil kompilasi yang berubah. Refresh baseline/HEAD saja tidak memerlukan audit
   kompilasi. Perbaiki temuan valid melalui compiler dalam scope ACC, lalu ulangi provenance/check dan
   gate yang terdampak; perubahan MANUAL/keputusan baru butuh ACC. Tanpa Slaver, audit sendiri dan laporkan
   skip/fallback.
4. Laporkan: file yang berubah, aturan yang berubah, deviasi yang berubah, sisa temuan, serta profil,
   ID, status, dan penilaian delegasi atau alasan skip/fallback.

## Jangan

- Menulis ulang seluruh pack kalau hanya satu sumber yang berubah.
- Mencabut deviasi tanpa keputusan user. Deviasi itu kesepakatan, bukan efek samping kompilasi.
- Menghapus temuan yang belum bisa ditutup, misalnya ADR yang masih belum terindeks. Temuan itu menunggu
  user, bukan dihilangkan dari laporan.
- Mengubah isi `plays/` dari hasil kompilasi. Play adalah tulisan tangan; usulkan saja.
