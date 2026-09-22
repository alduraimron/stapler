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

## Decision records

Keputusan project yang bertahan. Wajib ada di setiap plan; isi `Tidak ada.` kalau memang tidak ada. Cara
menentukan dan menulisnya ada di [bagian 3](#3-adr-memori-keputusan-project).

### Existing
- `.pi/adr/<NNNN-slug>.md` - membatasi apa di task ini (bukan sekadar "terkait")
  (atau `Tidak ada.`)

### Created
- `.pi/adr/<NNNN-slug>.md` - <keputusan dalam satu baris>
  (atau `Tidak ada.`)

### Superseded
- `.pi/adr/<lama>.md` -> `.pi/adr/<baru>.md` - <kenapa berubah>
  (atau `Tidak ada.`)

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

## Decision records

Keputusan project yang bertahan. Wajib ada di setiap plan; isi `Tidak ada.` kalau memang tidak ada. Cara
menentukan dan menulisnya ada di [bagian 3](#3-adr-memori-keputusan-project).

### Existing
- `.pi/adr/<NNNN-slug>.md` - membatasi apa di task ini (bukan sekadar "terkait")
  (atau `Tidak ada.`)

### Created
- `.pi/adr/<NNNN-slug>.md` - <keputusan dalam satu baris>
  (atau `Tidak ada.`)

### Superseded
- `.pi/adr/<lama>.md` -> `.pi/adr/<baru>.md` - <kenapa berubah>
  (atau `Tidak ada.`)

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

## 3. ADR (memori keputusan project)

ADR menyimpan **kenapa** sebuah keputusan diambil, alternatif yang ditolak, dan konsekuensi yang diterima.
Bukan langkah implementasi, bukan backlog, bukan status pekerjaan. Hasil akhirnya: sesi berikutnya bisa
menjawab "kenapa dulu begini" dari riwayat, bukan menebak dari kode.

Ditulis di sesi `plan-task` setelah keputusan benar-benar disetujui. Sesi `implement-task` hanya membaca dan
mematuhi.

### 3.1 Lokasi dan nomor

- File: `.pi/adr/NNNN-<slug>.md` - `NNNN` empat digit berurutan (`0001`, `0002`, ...).
- Nomor berikutnya = nomor tertinggi yang ada + 1. Gap boleh; nomor **tidak pernah** dipakai ulang dan ADR
  lama **tidak pernah** dinomori ulang.
- Slug pendek dan deskriptif, huruf kecil, dipisah `-`.
- Direktori `.pi/adr/` dibuat saat ADR pertama benar-benar perlu ditulis. Jangan dibuat di muka.

### 3.2 Index `.pi/adr/README.md`

Pintu masuk satu-satunya. Sesi berikutnya membaca index ini dulu, lalu membuka hanya ADR yang relevan. Jaga
supaya tetap ringkas.

```markdown
# Project Decision Records

| ADR | Decision | Topic | Status |
| --- | --- | --- | --- |
| [0001](0001-use-uuid-identifiers.md) | Use UUID for domain identifiers | database | Accepted |
| [0002](0002-standard-api-error-envelope.md) | Standard API error envelope | api | Accepted |
| [0003](0003-use-rotating-refresh-tokens.md) | Use rotating refresh tokens | authentication | Superseded by [0011](0011-store-refresh-tokens-in-postgresql.md) |
```

Status yang dipakai: `Proposed`, `Accepted`, `Rejected`, `Superseded`, `Deprecated`. Jangan pakai
`Selesai`/`Completed`/`Done`: ADR adalah status keputusan, bukan progres task.

### 3.3 Template file ADR

```markdown
# ADR NNNN: <keputusan dalam satu frasa>

- **Status:** Proposed | Accepted | Rejected | Superseded | Deprecated
- **Date:** <YYYY-MM-DD>
- **Topic:** <topik singkat, mis. authentication>
- **Related plan:** `<path plan>` atau None
- **Supersedes:** ADR-NNNN (hanya kalau ada)

## Context
<masalah, batasan, dan fakta yang diketahui saat keputusan diambil. Jangan ditulis ulang di kemudian hari>

## Decision
<apa yang diputuskan; cukup konkret sehingga sesi lain bisa menilai apakah perubahan baru bertentangan>

## Rationale
<kenapa opsi ini dipilih. Sebab-akibat, bukan manfaat generik>

## Alternatives considered

### <alternatif>
<kenapa tidak dipilih. Alternatif tidak harus buruk, cukup tidak dipilih>

## Consequences

### Positive
- ...

### Negative / trade-offs
- ...

## History
- <YYYY-MM-DD> - Decision accepted.

## Corrections
None.
```

Kalau project sudah punya ADR dengan judul section lain, ikuti yang sudah ada. Isi ADR ditulis dalam bahasa
project/user, jangan dipaksa mengikuti bahasa dokumentasi Stapler.

### 3.4 Riwayat bersifat append (jangan menulis ulang sejarah)

| Yang terjadi | Yang dilakukan |
| --- | --- |
| Ada informasi tambahan, keputusan tidak berubah | tambah baris di `## History` |
| Fakta di ADR lama ternyata salah | tambah entri bertanggal di `## Corrections`; klaim lama **tetap ada** |
| Keputusan yang bertahan berubah | buat ADR baru + tandai ADR lama `Superseded by ADR-NNNN` |

Contoh `## Corrections`:

```markdown
## Corrections

### 2026-10-14

Konteks awal menyebut `users.institution` tidak terpakai. Penelusuran lanjutan menemukan field itu diakses
lewat `InstitutionRepository`. Koreksi ini tidak mengubah keputusan.
```

Sebutkan bukti yang mengubah pemahaman dan apakah keputusannya ikut berubah. Jangan mengubah paragraf lama
menjadi sesuatu yang tidak diketahui saat itu.

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
- ADR: `.pi/adr/NNNN-<slug>.md` (index di `.pi/adr/README.md`)
- Desain: `.pi/design/<fitur>/*.png`

## Perintah verifikasi wajib sebelum commit
<contoh: npx tsc --noEmit ; npx eslint <file diubah> ; npm run build>

## Larangan untuk agent
- <contoh: `npm run db:push`, `git commit`, `git push`>
- tidak mengubah `AGENTS.md`
- tidak menyentuh modul di luar scope plan tanpa izin

## Bahan wajib dibaca per jenis tugas
- Selalu: `AGENTS.md`, `.pi/rules.md`, index ADR `.pi/adr/README.md` (kalau ada; ADR dibuka hanya yang relevan)
- UI/desain: `.pi/design/<fitur>/*.png` (dibaca di sesi plan, hasilnya ditranskrip ke plan)
- Backend: `docs/standards/backend-architecture.md`
- Perubahan skema: `prisma/schema.prisma`

## Catatan lokal
- <contoh: dokumen standar sebagian usang, ikuti kode; lihat ADR 0006/0007>
```
