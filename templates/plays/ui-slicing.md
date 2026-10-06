<!-- MANUAL. Play khas project. Isi saat init, lengkapi seiring waktu. -->

# Play: slicing UI

UI dulu dengan data mock, belum menyentuh API dan database.

Lanjutannya adalah play `ui-on-api` atau mode `integration`.

## Aturan

- Jangan membuat endpoint, model schema, migrasi, atau hook yang memanggil API.
- Data mock diletakkan di [ISI: lokasi mock di project ini], dengan komentar bahwa itu bukan data nyata.
- Komponen khusus satu halaman tinggal di [ISI: konvensi lokasi komponen project ini].
- Sumber utama adalah aset desain. Ambil fakta kasarnya: struktur, teks, state, hierarki, dan token warna.
  Jangan forensik piksel; aturan pembacaan aset ada di `design.md`.
- Kalau desain ambigu: ikuti implementasi terdekat di project, atau tanyakan.
- Interaksi yang belum punya backend disebut eksplisit di laporan, misalnya "submit hanya menutup dialog,
  belum menyimpan".

## Wajib ada di laporan pra-ACC

- Bagian desain mana yang dikerjakan sekarang, mana yang ditunda. Bagian yang bukan jobdesk ini disebutkan,
  bukan dikerjakan.
- Data mock: berapa baris, dan nilainya dari mana.
- Perilaku default tab dan state, kalau ada.
- Celah yang ditemukan di schema atau desain untuk fase berikutnya: catat, jangan dikerjakan.

## Verifikasi tambahan

- Pastikan teks dan markup penting benar-benar ter-render, bukan hanya tertulis.
- Tampilan dan interaksi tetap perlu dilihat user di browser: sebutkan sebagai belum diuji kalau belum.

## Jangan

- Mengarang data, tata letak, atau teks yang tidak ada di aset desain.
- Menyentuh API atau database sedikit saja. Itu bukan lagi slicing.
