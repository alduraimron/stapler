# Mode: refactor

Merapikan atau mengganti struktur. Jangan mengasumsikan perilaku tidak berubah.

## Wajib ada di laporan pra-ACC

- Outcome yang diinginkan dan alasan refactor-nya.
- Risk tolerance user: seberapa besar perubahan yang boleh dalam satu langkah.
- Apakah perilaku boleh berubah, dan perubahan mana yang disepakati, atau harus identik.
- Batas cleanup: file dan lapisan mana yang masuk, mana yang tidak.
- Pemanggil dan kontrak yang tersentuh: siapa yang memanggil, apa yang bisa pecah.
- Langkah kecil yang tiap langkahnya masih bisa diverifikasi.

## Verifikasi tambahan

- Bukti perilaku tetap: jalur yang sama seperti sebelum refactor, manual atau lewat perintah.
- Kalau ada perubahan perilaku yang disepakati: tulis eksplisit di acceptance dan uji manualnya.
- Kalau project punya test, jalankan sebelum dan sesudah, dan bandingkan hasilnya.

## Jangan

- Mencampur refactor dengan fitur atau perbaikan bug dalam satu langkah.
- Mengubah perilaku, termasuk urutan efek samping, format response, atau pesan error, tanpa menyebutkannya
  di acceptance.
