# Template: Laporan Akhir Sesi Implementasi

Dipakai oleh skill `implement-task` di akhir pekerjaan. Tulis di chat (bukan file), kecuali user meminta
disimpan.

```markdown
## Ringkasan
<1-3 baris: apa yang dikerjakan, plan mana yang dieksekusi>

## Perubahan
| File | Aksi | Isi |
| --- | --- | --- |
| `<path>` | baru / diubah / dihapus | <ringkas> |

## Verifikasi
| Pemeriksaan | Hasil |
| --- | --- |
| <perintah 1 dari plan/rules> | exit code / jumlah |
| <perintah 2> | ... |
| Uji manual | <apa yang dites; kalau belum, tulis "belum diuji" + langkahnya> |

## Deviasi dari plan
- <poin yang berbeda dari plan + alasannya> (tulis "tidak ada" kalau memang tidak ada)

## Keputusan (ADR)
| ADR | Aksi |
| --- | --- |
| `.pi/adr/<file>.md` | dibaca; tidak diubah / `## History` ditambah 1 baris bertanggal |

Tulis `Tidak ada.` kalau plan tidak menyentuh ADR. Kalau implementasi butuh menyimpang dari ADR `Accepted`,
jangan dicatat di sini: hentikan pekerjaan dan laporkan konflik (lihat `SKILL.md` bagian 4).

## Temuan di luar scope (tidak dikerjakan)
- `path:baris` - <masalah, dampak, ukuran>

## Butuh tindakan user
- <pull sebelum push, commit/push oleh user, db:push, keputusan yang tertunda>

## Saran commit
`<type>(<scope>): <pesan singkat>`
```

Aturan laporan:

1. **Angka, bukan klaim.** Tulis exit code dan jumlah isu, bukan "sudah saya pastikan aman".
2. **Jujur soal uji.** Kalau sesuatu butuh database/akun/alur manual yang tidak dijalankan, tulis "belum
   diuji" + langkahnya.
3. **File di luar scope tidak disembunyikan.** Kalau ada temuan, tulis di bagian temuan, jangan diabaikan dan
   jangan dikerjakan diam-diam.
4. **Sertakan angka baseline kalau relevan.** Misal skor audit tool atau jumlah isu repo, supaya jelas mana
   isu baru dari pekerjaan ini dan mana yang sudah ada sebelumnya.
5. **Saran commit maksimal 1 baris** (mengikuti standar project), tanpa menambahkan co-author.
6. **Konflik keputusan tidak diselesaikan diam-diam.** Kalau implementasi butuh melanggar atau mengganti ADR
   `Accepted`, hentikan pekerjaan dan laporkan; jangan membuat ADR baru, `Corrections`, atau `Supersede`
   sendiri. Yang boleh hanya menambah `## History` yang tidak mengubah keputusan.
