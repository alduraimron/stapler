# Mode: feature

Fitur atau halaman baru yang dikerjakan dari nol, biasanya bertahap.

Kalau UI-nya sudah ada dari fase slicing, jangan pakai mode ini: lanjutkan dengan mode `integration`.

## Wajib ada di laporan pra-ACC

- Tujuan: siapa yang memakai, masalah apa yang diselesaikan.
- Pecah jadi fase yang masing-masing bisa dites sendiri. Pola umum yang dipakai berulang: fase UI dengan
  data mock, fase API dan data layer, lalu fase integrasi. Play di pack yang menentukan bentuk tiap fase
  untuk project ini.
- Lapisan yang tersentuh, mengikuti `architecture.md` di pack. Jangan mengarang urutan sendiri.
- Untuk tiap fase: file, acceptance, dan cara mengujinya.
- Fase mana yang dikerjakan sekarang, mana yang ditunda. Jangan dicampur dalam satu task.

## Kompatibilitas

Sebelum ACC, sebutkan kalau perubahan menyentuh salah satu dari ini, dan sertakan cara mengujinya:
kontrak API yang sudah dipakai pemakai lain, schema dan data yang sudah tersimpan, env var atau config, dan
pemakai lain dari fungsi atau komponen yang diubah.

## Verifikasi tambahan

- Halaman baru: metadata benar, dan route terdaftar setelah gate build.
- Endpoint baru: gate auth dan role sesuai akses yang disepakati, dan diuji dengan request nyata, bukan
  hanya dengan build hijau.
- Kalau fase ini menghasilkan mock: sebutkan bentuk mock-nya dan dari mana nilainya.

## Jangan

- Menambah dependency, model schema, atau migrasi tanpa membahasnya di laporan pra-ACC.
- Mencampur fase berikutnya "sekalian" karena sedang di file yang sama.
