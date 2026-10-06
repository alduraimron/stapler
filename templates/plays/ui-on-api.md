<!-- MANUAL. Play khas project. Isi saat init, lengkapi seiring waktu. -->

# Play: UI di atas API yang sudah selesai

UI halaman baru di atas API yang sudah terverifikasi. Alurnya tetap dua fase dengan ACC masing-masing:
slicing dulu dengan mock, baru integrasi.

Bedanya dengan slicing biasa: kontrak endpoint sudah final, jadi mock wajib meniru bentuk response asli, dan
fase integrasi tidak boleh mengubah kontrak. Kalau UI ternyata butuh field lain, itu task backend kecil
dengan ACC sendiri.

Dipakai kalau kontrak endpoint sudah ACC dan sudah diuji lewat request nyata, dan yang tersisa adalah
layarnya.

## Fase 0 (wajib, sebelum kode): peta komponen

- Tabel "elemen desain ke komponen existing" untuk semua yang bisa dipakai ulang, dengan `path`.
- Daftar komponen yang harus dibuat baru: alasan komponen existing tidak cukup, basisnya apa, dan statusnya
  page-local atau kandidat promosi ke komponen bersama.
- Keputusan struktural: struktur file, penamaan, pembagian komponen desktop, mobile, dan shared, serta
  mekanisme daftar (paginasi bernomor atau muat lainnya).
- Ukuran dan warna: cek skala aset desain dulu, lalu ukuran dibaca apa adanya; warna wajib memakai token.
- Daftar deviasi desain yang sudah disepakati, misalnya field read-only karena keputusan API.

## Fase 1: slicing

Ikuti play `ui-slicing`, dengan tambahan:

- Bentuk setiap baris mock sama dengan bentuk response endpoint asli: nama field, tipe, termasuk relasi.
- Paginasi dan pencarian disimulasikan di klien atas array mock.
- Jangan membuat service atau hook yang memanggil API.
- Tipe domain boleh dibuat di fase ini, mengikuti kontrak yang sudah diverifikasi.

## Fase 2: integrasi

Ikuti mode `integration`, dengan tambahan:

- Pekerjaannya hanya wiring: service klien, hook data, dan invalidasi cache. UI yang sudah disetujui tidak
  dirombak.
- Buktikan mock benar-benar hilang dengan pencarian di kode, bukan dari ingatan.
- Uji jalur gagal yang sudah ada di kontrak: 401, 403, 409, 422, 404.
- Kekurangan kontrak yang ditemukan di fase ini dilaporkan sebagai task backend kecil, jangan mengubah
  endpoint diam-diam.

Desktop dan mobile dikerjakan bersamaan per potongan, kecuali user meminta lain.

## Verifikasi tambahan

- Jalur gagal diuji, bukan hanya jalur sukses.
- State loading, kosong, dan error terlihat benar di kedua ukuran layar.
