# Template: Plan, ADR, dan Aturan Lokal

Dipakai oleh skill `plan-task`. Salin strukturnya, buang bagian yang tidak relevan, jangan menambah bagian
kosong tanpa isi.

---

## 1. Plan mode `feature`

Lokasi: `.pi/plans/<YYYY-MM-DD>-<slug>.md`

```markdown
# Plan: <judul>

- **Status**: Diusulkan | Dikerjakan | Selesai (tanggal)
- **Tipe**: feature
- **Tanggal**: <YYYY-MM-DD>
- **Bergantung pada**: <plan/ADR lain, kalau ada>

## Tujuan
<1-3 baris: siapa yang memakai, masalah apa yang diselesaikan>

## Ruang lingkup per fase
| Fase | Isi | Bisa dites sendiri? |
| --- | --- | --- |

## Keputusan
| Topik | Keputusan | Alternatif yang ditolak + alasan |
| --- | --- | --- |

## Pertanyaan terbuka
- (harus kosong saat sesi master ditutup)

## File yang dibuat/diubah
| Fase | File | Perubahan |
| --- | --- | --- |

## Referensi
- Desain: `<path>` (fakta yang sudah ditranskrip: ukuran, token warna, teks copy, state)
- ADR: `<path>`
- Standar: `<path>`

## Acceptance criteria
- [ ] <kondisi yang bisa diperiksa>

## Rencana uji
- Manual: <langkah + hasil yang diharapkan>
- Perintah verifikasi: <dari `.pi/rules.md`>

## Di luar scope
- <yang sengaja tidak dikerjakan>

## Risiko
- <risiko + mitigasi>

## Kickoff
/skill:implement-task .pi/plans/<file>.md
```

---

## 2. Plan mode `bugfix`

Lokasi: `.pi/plans/<YYYY-MM-DD>-<slug>.md`

```markdown
# Plan: <judul bug>

- **Status**: Diusulkan | Dikerjakan | Selesai (tanggal)
- **Tipe**: bugfix
- **Tanggal**: <YYYY-MM-DD>

## Gejala
<apa yang dilihat user, kapan terjadi>

## Langkah reproduksi
1. ...
2. ...
<hasil sekarang vs yang seharusnya>

## Bukti
| Sumber | Isi |
| --- | --- |
| `path:baris` | <kutipan kode yang relevan> |
| log/console | <pesan kalau ada> |

## Akar masalah
<bukan gejala. Jelaskan mekanismenya: kenapa bug ini terjadi>

## Perbaikan yang diusulkan
<perubahan paling kecil yang menyelesaikan akar masalah>

| Alternatif | Alasan ditolak |
| --- | --- |

## Dampak & regression risk
- Terpengaruh: ...
- Perlu dicek ulang: ...

## Acceptance criteria
- [ ] Gejala hilang: <langkah reproduksi di atas menghasilkan perilaku yang benar>
- [ ] Tidak ada regresi di: <daftar>

## Rencana uji
- Manual: ...
- Perintah verifikasi: <dari `.pi/rules.md`>

## Di luar scope
- <temuan lain yang sengaja tidak diperbaiki>

## Kickoff
/skill:implement-task .pi/plans/<file>.md
```

Kalau investigasi belum cukup untuk menulis "Akar masalah" atau "Perbaikan yang diusulkan", tulis plan apa
adanya (status `Diusulkan`, bagian berisi "belum diketahui") + daftar informasi yang masih dibutuhkan, lalu
tutup sesi. Jangan mengarang perbaikan.

---

## 3. Template ADR

Lokasi: ikut `.pi/rules.md` / `AGENTS.md` (mis. `.pi/adr/00NN-<slug>.md`), plus baris baru di index.

```markdown
# ADR 00NN: <keputusan dalam satu frasa>

- **Status**: Diusulkan | Diterima | Ditolak | Selesai (tanggal)
- **Tanggal**: <YYYY-MM-DD>
- **Konteks fitur**: <plan terkait>
- **File terkait**: `<path>`

## Konteks
<masalah + batasan yang ada saat keputusan diambil>

## Keputusan
<apa yang dipilih, cukup spesifik>

## Alasan
<kenapa itu yang dipilih, 2-4 poin>

## Konsekuensi
**Positif**
- ...

**Negatif / utang teknis**
- ...

## Alternatif yang ditolak
| Alternatif | Alasan ditolak |
| --- | --- |

## Referensi
- <standar/plan/commit terkait>
```

---

## 4. Template `.pi/rules.md` (aturan personal, bootstrap)

Dibuat sekali per project oleh skill `plan-task` kalau belum ada. Isinya **bukan** standar kode (itu urusan
`AGENTS.md`), tapi cara kerja personal.

```markdown
# Aturan Lokal (personal, tidak untuk tim)

Prioritas: file ini menang untuk **workflow**; `AGENTS.md` + `docs/standards/` menang untuk
**standar kode**. Kalau bertentangan di hal lain: berhenti dan tanya user.

## Artefak
- Plan: `.pi/plans/<YYYY-MM-DD>-<slug>.md`
- ADR: `.pi/adr/` (index di `README.md`)
- Desain: `.pi/design/<fitur>/*.png`

## Perintah verifikasi wajib sebelum commit
<contoh: npx tsc --noEmit ; npx eslint <file diubah> ; npm run build>

## Larangan untuk agent
- <contoh: `npm run db:push`, `git commit`, `git push`>
- tidak mengubah `AGENTS.md`
- tidak menyentuh modul di luar scope plan tanpa izin

## Bahan wajib dibaca per jenis tugas
- Selalu: `AGENTS.md`, `.pi/rules.md`
- UI/desain: `.pi/design/<fitur>/*.png` (dibaca di sesi plan, hasilnya ditranskrip ke plan)
- Backend: `docs/standards/backend-architecture.md`
- Perubahan skema: `prisma/schema.prisma`

## Catatan lokal
- <contoh: dokumen standar sebagian usang, ikuti kode; lihat ADR 0006/0007>
```
