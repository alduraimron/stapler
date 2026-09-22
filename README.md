# stapler

Kumpulan skill Pi untuk alur kerja **plan lalu implement**: satu sesi mendiskusikan dan menulis file plan,
sesi lain mengeksekusinya tanpa perlu mengulang diskusi. Dipisah dari sistem lain supaya bisa dipakai lintas
project dan dikembangkan sendiri di repo ini.

## Isi

| Path | Fungsi |
| --- | --- |
| `skills/plan-task/` | Sesi MASTER: baca aturan project, tanya ambiguitas sekaligus, tulis plan. Tidak menulis kode |
| `skills/implement-task/` | Sesi WORKER: eksekusi satu file plan sampai terverifikasi, lalu lapor |
| `package.json` | Manifest paket Pi; skill di-expose lewat `pi.skills` |
| `docs/DECISIONS.md` | Kenapa desainnya begini, alternatif yang ditolak, dan perbandingan dengan `feature-workflow` |
| `docs/ROADMAP.md` | Rencana perbaikan + statusnya |

## Instalasi (project-local)

Stapler dipasang sebagai paket Pi **per project**, bukan global. Paketnya hanya berisi skill, jadi tidak perlu
menyalin apa pun ke `.pi/skills/`.

```bash
cd project-kamu
pi install -l --approve git:github.com/alduraimron/stapler@v0.1.0
pi
```

- `-l` menulis deklarasi paket ke `.pi/settings.json` project itu saja; `~/.pi/agent/settings.json` tidak
  berubah.
- Pi meng-clone paket ke cache-nya (`.pi/git/github.com/alduraimron/stapler/`) dan memuat skill dari sana.
  Skill tetap membaca dan menulis artefak di project kamu (`.pi/plans/`, `.pi/rules.md`, `AGENTS.md`).
- Ref tag bersifat pinned: `pi update --extensions` tidak memindahkannya ke versi lebih baru. Pindah versi
  dengan memasang ulang, mis. `pi install -l --approve git:github.com/alduraimron/stapler@v0.1.1`.
- Project yang punya `.pi/settings.json` perlu di-trust. Pi menanyakannya saat start; `--approve` pada
  perintah `pi install` hanya berlaku untuk perintah itu sendiri.
- Cek hasilnya dengan `pi list`. Restart Pi setelah memasang supaya skill dipindai ulang.

## Cara pakai

Keduanya dipicu manual (`disable-model-invocation: true`):

```
/skill:plan-task feature <permintaan>
/skill:plan-task bugfix <gejala bug>
/skill:implement-task .pi/plans/<file>.md
```

Aturan project dibaca dari `AGENTS.md` (aturan tim, tidak boleh diubah) dan `.pi/rules.md` (aturan personal).
Kalau `.pi/rules.md` belum ada, `plan-task` menawarkan membuatkannya.

## Artefak di project

| Path | Isi |
| --- | --- |
| `.pi/plans/` | Plan task: apa yang dikerjakan, langkah, acceptance, perintah verifikasi |
| `.pi/adr/` | Keputusan project yang bertahan: **kenapa** dipilih, alternatif yang ditolak, konsekuensinya |

ADR opsional dan tidak dibuat di muka: direktori `.pi/adr/` muncul saat keputusan pertama yang benar-benar
bertahan perlu dicatat. Yang dibaca lebih dulu selalu index `.pi/adr/README.md` (tabel nomor, keputusan,
topik, status), lalu hanya ADR yang relevan dengan task - bukan seluruh direktori.

Aturan singkatnya:

- ADR menyimpan **why**, bukan langkah implementasi. Rename fungsi, tambah test, atau satu endpoint tidak
  perlu ADR. Kalau masih perlu diketahui setelah task selesai, itu layak jadi ADR.
- ADR ditulis di sesi `plan-task` setelah keputusannya benar-benar disetujui, bukan dari opsi yang cuma
  sempat dipertimbangkan model.
- Riwayat bersifat append: informasi baru ditambah di `History`, fakta lama yang ternyata salah ditambah di
  `Corrections` (klaim lama tetap ada), dan keputusan yang berubah dibuatkan ADR baru yang men-`Supersede`
  ADR lama. Sejarah tidak pernah ditulis ulang.
- Status ADR adalah status keputusan (`Proposed`, `Accepted`, `Rejected`, `Superseded`, `Deprecated`), bukan
  progres task.
- `implement-task` membaca dan mematuhi ADR yang disebut plan. Kalau implementasi butuh menyimpang dari ADR
  `Accepted`, sesi itu berhenti dan meminta revisi plan, bukan memutuskan sendiri.
- Bahasa ADR mengikuti project yang memakainya, bukan bahasa dokumentasi Stapler.

Format plan, ADR, dan index-nya ada di
[`skills/plan-task/references/plan-format.md`](skills/plan-task/references/plan-format.md).

## Hubungan dengan `feature-workflow`

`feature-workflow` (di `~/.pi/agent/skills/`) lebih lengkap: ada gerbang berbasis script, lifecycle status satu
work item, QA manual terpisah, dan commit dua tahap. `stapler` sengaja lebih ringan: dua skill, plan markdown
di `.pi/plans/`, tanpa script dan tanpa state machine.

Perbandingan detailnya ada di `docs/DECISIONS.md`, termasuk daftar hal dari stapler yang bisa diambil untuk
memperbaiki `feature-workflow` (di `docs/ROADMAP.md`).

## Status

Eksperimen/referensi. Belum jadi alur harian; `feature-workflow` masih acuan utama.
