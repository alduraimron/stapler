<!-- MANUAL. Play khas project. Isi saat init, lengkapi seiring waktu. -->

# Play: API dan data layer

Server dulu: schema kalau perlu, lalu lapisan berikutnya sesuai `architecture.md`, diuji lewat request nyata
sampai hijau. UI tidak disentuh sama sekali; itu fase terpisah dengan ACC sendiri.

Dipakai kalau user meminta urutan backend lebih dulu, atau saat pekerjaannya memang murni API dan logika
server.

## Urutan lapisan

[ISI: urutan lapisan project ini, dari `architecture.md`, mis. schema -> repository -> service -> validator ->
route. Sebutkan untuk tiap lapisan: file dan tanggung jawabnya.]

## Wajib ada di laporan pra-ACC

- Tujuan API: endpoint apa (method dan path), siapa pemakainya, masalah apa yang diselesaikan.
- Kontrak endpoint: query dan body, bentuk response termasuk definisi angka turunan, status code, dan gate
  auth atau role-nya.
- Acceptance yang bisa dicek lewat request, plus rencana uji berurutan: happy path, validasi gagal, gate
  (tanpa login dan role salah), dan satu kasus bisnis yang membedakan aturan baru dari yang lama.
- Kalau menyentuh schema: sebutkan eksplisit, minta izin perintah migrasi, dan catat konsekuensinya ke
  environment lain.
- Kompatibilitas: kontrak yang sudah dipakai pemakai lain, data tersimpan, pemakai lain dari fungsi yang
  diubah.
- Satu baris soal fase UI yang menyusul, supaya kontrak tidak ditutup terlalu cepat.

## Verifikasi tambahan

- Klaim hasil dari response nyata, bukan dari membaca kode.
- Kalau schema berubah: jalankan perintah generate dan migrasi **setelah izin**, lalu perbarui artefak
  diagram atau dokumentasi schema kalau project memilikinya.
- Jalur gagal wajib diuji: 401, 403, 422, 404 sesuai kontrak.

## Jangan

- Menyentuh file UI sedikit saja. Itu fase berikutnya.
- Mengklaim endpoint jalan hanya karena build hijau.
- Menambah kolom atau field yang tidak dipakai kontrak hanya karena kelihatannya perlu.
- Menjalankan migrasi atau perintah yang mengubah data tanpa izin eksplisit di sesi itu.
