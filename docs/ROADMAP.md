# Roadmap Perbaikan

Prioritas dari yang paling murah/berdampak. Status: `Belum` / `Dikerjakan` / `Selesai (tanggal)`.

> Diperbarui 2026-10-06 setelah `v0.3.0`: desain plan/implement dihapus, digantikan desain context pack
> (`docs/design.md`). Item di bawah yang sudah tercakup ditandai selesai beserta bentuknya yang baru.

| # | Usulan | Kenapa | Ukuran | Status |
| --- | --- | --- | --- | --- |
| R1 | Validasi cepat asumsi sebelum menulis kode: cek path, nama fungsi/endpoint, dan perintah verifikasi benar-benar ada | Kalau alamat salah, baru ketahuan di tengah implementasi | S | Belum (sekarang bagian dari langkah 1 `stapler`) |
| R2 | Dukung perintah verifikasi tambahan selain lint/typecheck sebagai daftar di config | Gerbang verifikasi berbeda antar project | S | Selesai (2026-10-06): `commands` di `manifest.json` plus kontrak verifier |
| R3 | Langkah transkrip aset desain ke artefak plan, bukan dikirim sebagai gambar ke sesi eksekusi | Hemat context dan cukup dibaca sekali | S | Selesai sebagian: aturan pembacaan ada di `design.md` pack dan play `ui-slicing`; belum ada langkah transkrip baku |
| R4 | Aturan personal vs aturan tim yang eksplisit, plus daftar bahan bacaan per jenis tugas | Preferensi personal perlu tempat resmi dan prioritas yang jelas | M | Selesai (2026-10-06): `sources[].role`, override per topik, `deviations.md`, dan tabel baca di `index.md` |
| R5 | Integrasi ADR sebagai memori keputusan project | Keputusan sesi sebelumnya perlu terekam | S | Selesai (2026-09-22), dipertahankan: `adr-index.md` hasil kompilasi plus temuan `MISS` untuk ADR yang belum terindeks |
| R6 | Handoff eksekusi ke subagent | Artefak yang self-contained siap diserahkan | M | Belum |
| R7 | Laporan akhir baku (perubahan, angka verifikasi, deviasi, temuan di luar scope, saran commit) | Hasil tiap kerja konsisten dan mudah dibandingkan | S | Selesai (2026-10-06): `templates/tasks/*.md` dan `runs/` |
| R8 | Opsi bahasa artefak | Kalau ada kebutuhan spec berbahasa Indonesia | S | Selesai (2026-10-06): skill, template, dan laporan memakai bahasa Indonesia |
| R9 | Satukan dengan `feature-workflow` atau tegaskan posisinya | Dua sistem yang hidup bersamaan berisiko drift | M | Selesai (2026-10-06): stapler menjadi sistem tunggal; desain plan/implement dihapus, `feature-workflow` tetap dinonaktifkan di settings |
| R10 | Self-test sederhana: validasi frontmatter skill dan cek rujukan tidak menggantung | Mencegah skill rusak diam-diam | S | Selesai sebagian (2026-10-06): 13 tes kontrak verifier; validasi frontmatter dan rujukan belum |
| R11 | Parser keluaran linter selain ESLint | Verifier harus jalan di stack lain | S | Selesai sebagian: mode `custom` dan `exit-only` tersedia; adapter bawaan baru ESLint JSON dan stylish |
| R12 | Isi contoh `standards/*.md` sebagai rujukan `init` | Compiler perlu contoh bentuk saringan | S | Belum |
