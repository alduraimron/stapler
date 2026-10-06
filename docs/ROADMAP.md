# Roadmap Stapler

Status: `Belum` / `Dikerjakan` / `Selesai (tanggal)`. Diperbarui 2026-10-06, setelah pemakaian pertama di task
nyata dan setelah desain context pack menggantikan desain plan/implement (lihat `docs/DECISIONS.md`).

## Prinsip

Menambah fitur bukan tujuan. Yang diukur cuma dua: apakah stapler mencegah kesalahan, dan apakah biayanya
sepadan. Item yang tidak pernah mencegah kesalahan sebaiknya dihapus, bukan dipertahankan.

## Prioritas saat ini

| #   | Usulan                                                                 | Kenapa                                                                                     | Ukuran | Status                 |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ | ---------------------- |
| S1  | Artefak run JSON plus `--scope-from` di verifier                       | Scope yang di-ACC harus sama dengan yang digerbang, dan jejak task jadi bahan evaluasi       | M      | Selesai (2026-10-06)   |
| S2  | `check.mjs --post-pull`                                                | Setelah pull harus ada satu pintu yang menyebut perintah konkret                             | S      | Selesai (2026-10-06)   |
| S3  | Riwayat baseline dan laporan delta                                     | Pengukuran ulang setelah pull tidak boleh menyembunyikan kenaikan error                      | S      | Selesai (2026-10-06)   |
| S4  | Skrip `stats.mjs` yang membaca `runs/*.json`                           | Menjawab langkah mana yang paling sering gagal: ACC diulang, gate merah, temuan di luar scope | M      | Belum                  |
| S5  | Penegakan safety floor di `check.mjs` plus tesnya                      | Klaim "compiler menolak menimpa safety floor" masih prosa, bukan pemeriksaan                  | S      | Belum                  |
| S6  | `check.pathIgnore` atau penanda `HISTORIS:`                            | Catatan tentang path yang salah (kasus ADR 0019) jangan dianggap rujukan yang hilang          | S      | Belum                  |
| S7  | Template `standards/*.md` per stack                                    | Mengurangi ketergantungan pada penilaian agent saat `init`, hasil kompilasi lebih seragam    | M      | Belum                  |
| S8  | Tes validasi frontmatter skill dan rujukan antar berkas                | Mencegah skill rusak diam-diam setelah diedit                                                | S      | Belum                  |
| S9  | Uji coba play: satu task backend dan satu task slicing UI              | Play belum pernah dipakai; baru mode bugfix yang teruji di task nyata                        | M      | Belum                  |
| S10 | Mode pemasangan untuk iterasi (path lokal versus tag)                  | Setiap perubahan paket butuh tag baru dan install ulang, memperlambat pengembangan           | S      | Belum                  |

## Selesai sebelumnya

| #                        | Item                                                       | Status                                                                          |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| R2, R4, R7, R10          | Perintah verifikasi, aturan personal, laporan baku, tes     | Selesai di v0.3.0                                                               |
| R9                       | Satukan posisi dengan sistem lain                          | Selesai: desain plan/implement dihapus di v0.3.0                                 |
| R11                      | Adapter linter selain ESLint                               | Sebagian: mode `custom` dan `exit-only` tersedia; adapter bawaan baru ESLint     |
| R12                      | Self-test skill                                            | Sebagian: 30 tes untuk verifier, check, dan provenance; validasi frontmatter (S8) belum |

## Item lama yang saya sarankan dibuang

| Item                           | Alasan                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| R1 validasi asumsi plan        | Sudah tercakup langkah 1 stapler: cek path dan nama sebelum menulis kode                       |
| R3 transkrip aset desain       | Sudah diatur `design.md` pack dan play `ui-slicing`; langkah baku tambahan hanya menambah upacara |
| R6 handoff ke subagent         | Belum ada bukti kebutuhan; tunggu sampai ada task yang memang panjang                          |
| Desain plan/implement (D1-D3)  | Dihapus di v0.3.0; riwayat dan alasannya tetap ada di `docs/DECISIONS.md` dan tag v0.2.0        |
