# Mode: integration

Mengganti data mock dengan data nyata. UI yang sudah disetujui tidak dirombak.

Dipakai juga kalau UI-nya sudah ada dari pekerjaan lain dan yang kurang hanya data atau endpoint.

## Wajib ada di laporan pra-ACC

- Endpoint dan data layer yang akan dibuat atau dipakai, mengikuti urutan lapisan di `architecture.md`
  pack. Sebutkan untuk tiap lapisan: file dan tanggung jawabnya.
- Bentuk data yang dikembalikan: field apa saja, dihitung dari mana, dan gate auth atau role-nya. Kalau ada
  angka turunan (total, status, "aktif"), jelaskan definisinya di `domain.md` atau angkat sebagai keputusan
  yang perlu ADR. Jangan serahkan ke tebakan.
- Perubahan minimum di UI: sumber data, state loading, kosong, dan error, plus file mock yang dihapus atau
  diubah.
- Celah schema yang ditemukan saat slicing: angkat sebagai keputusan. Perubahan schema atau migrasi butuh
  izin eksplisit, jangan dikerjakan sendiri.
- Kompatibilitas: kontrak API yang sudah dipakai pemakai lain, data yang sudah tersimpan, dan pemakai lain
  dari fungsi atau komponen yang berubah.

## Verifikasi tambahan

- Endpoint benar-benar mengembalikan bentuk dan angka yang diharapkan, diuji dengan request nyata atau
  lewat halaman, bukan dari membaca kode.
- State loading, kosong, dan error terlihat benar, bukan hanya jalur sukses.
- Data mock benar-benar tidak dipakai lagi: buktikan dengan pencarian di kode, jangan dari ingatan.
- Pemakai lain dari komponen bersama tidak ikut berubah perilakunya.

## Jangan

- Merombak tata letak, teks, atau struktur komponen yang sudah disetujui di fase sebelumnya. Kalau memang
  perlu, angkat dulu sebagai keputusan.
- Meninggalkan data mock sebagai fallback diam-diam. Kalau sengaja dipertahankan, sebutkan di laporan.
- Menambah field atau kolom yang tidak dipakai UI hanya karena kelihatannya perlu.
