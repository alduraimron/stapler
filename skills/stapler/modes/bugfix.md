# Mode: bugfix

Ada gejala yang bisa direproduksi. Investigasi dulu, jangan langsung menyusun perbaikan.

## Wajib ada sebelum ACC

1. Gejala dan langkah reproduksi yang pasti, dari user, bukan karangan.
2. Bukti dari kode (`path:baris`) atau log dan console. Bukan dugaan.
3. Akar masalah, bukan gejala. Jelaskan mekanismenya: kenapa bug ini terjadi.
4. Perbaikan paling kecil yang menyelesaikan akar masalah, plus alternatif yang ditolak dan alasannya.
5. Regression risk: apa lagi yang menyentuh kode itu dan perlu diuji ulang.

Kalau bukti belum cukup: jangan menyusun perbaikan. Laporkan temuan dan daftar informasi yang masih
dibutuhkan, lalu berhenti.

## Verifikasi tambahan

- Buktikan gejalanya hilang: ulangi langkah reproduksi.
- Cek jalur berdekatan yang disebut di regression risk.
- Kalau butuh data, akun, atau alur manual yang tidak bisa dijalankan: katakan **belum diuji** dan sertakan
  langkah ujinya untuk user.

## Jangan

- Menutupi gejala alih-alih memperbaiki sebabnya, misalnya menambah pengecualian atau memperlebar kondisi
  if.
- Menyimpulkan akar masalah dari pola yang mirip; buktikan dari kode atau log.
- Memperbaiki temuan lain yang kebetulan terlihat; catat saja di laporan.
