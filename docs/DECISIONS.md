# Keputusan: Desain Alur Plan lalu Implement

Konteks: sesi 2026-09-14/15 (di project e-Kerjasama Blitar). Ide awalnya memisahkan sesi diskusi (master)
dari sesi eksekusi (worker) supaya context tidak terpakai dua kali. Setelah dibuat, ditemukan sistem
`feature-workflow` yang sudah ada dan lebih lengkap, sehingga versi ini dijadikan versi ringan/referensi.

Tabel: keputusan desain, statusnya di `feature-workflow`, dan catatan.

| # | Keputusan | Status di `feature-workflow` | Catatan |
| --- | --- | --- | --- |
| D1 | Dua sesi: master menyusun, worker mengeksekusi, artefak plan sebagai kontrak | **Ada** | `workflow-feature`/`-bugfix`/`-refactor` (tidak menyentuh kode) + `workflow-implement approve` |
| D2 | Cukup 2 skill dengan mode feature/bugfix di argumen | **Berbeda** | `feature-workflow` memilih dipisah fisik. Untuk perbaikan: pertahankan pemisahan itu, tapi jaga template spec tunggal |
| D3 | Dipicu manual, bukan otomatis | **Ada** | Semua skill memakai `disable-model-invocation: true` |
| D4 | Artefak disimpan di project, bukan di folder skill | **Ada, beda bentuk** | `feature-workflow`: satu `.pi/workflow/current-work.md` (satu work item aktif + arsip `history/`). Stapler: plan bertanggal di `.pi/plans/` |
| D5 | Aturan personal dipisah dari aturan tim (`AGENTS.md`) dan prioritasnya eksplisit | **Belum ada** | Kandidat perbaikan: file config personal (usulan `.pi/rules.md`) yang dibaca semua command |
| D6 | Aset desain dibaca di sesi master lalu ditranskrip ke plan | **Belum ada** | Tidak ada instruksi soal gambar/PNG. Kandidat: langkah + field `## Design references` di template spec |
| D7 | ADR sebagai memori keputusan project: `plan-task` yang membuat, mengoreksi, men-`Supersede`, dan memperbarui index; `implement-task` hanya membaca, mematuhi, dan boleh menambah `History` yang tidak mengubah keputusan | **Belum ada** | `feature-workflow` tidak mengenal ADR. Di stapler: `.pi/adr/NNNN-<slug>.md` + index `.pi/adr/README.md`, dibuat saat keputusan pertama perlu dicatat. Worker yang butuh mengubah keputusan berhenti dan minta revisi plan, bukan memutuskan sendiri |
| D8 | Perubahan kecil tidak lewat sistem; `implement` wajib punya plan | **Ada** | `workflow-implement` menolak tanpa spec yang di-approve |
| D9 | Larangan: `db:push`/commit/push oleh user, tidak menyentuh `AGENTS.md`, tanpa force push | **Ada, lebih ketat** | `feature-workflow` juga menolak branch protected, dependency/manifest, docs, CI, dan operasi git apa pun kecuali commit final |

## Yang lebih baik dari `feature-workflow` (diakui)

1. **Gerbang teknis berupa script** (`validate-work.mjs`, `check-workflow-scope.mjs`,
   `commit-approved-work.mjs`) sehingga aturan tidak bergantung pada kepatuhan model.
2. **Lifecycle status** satu work item (`draft` -> `awaiting_spec_approval` -> `implementing` ->
   `qa_pending` -> `ready_for_commit` -> `awaiting_commit_approval` -> `idle`/`archived`).
3. **Gerbang QA manual terpisah** dan **commit dua tahap** (paket review dulu, commit setelah approval).
4. **Arsip otomatis** ke `.pi/workflow/history/`.
5. **Preflight** branch/worktree bersih sebelum implementasi dan sebelum commit.

## Cara memvalidasi QA (praktik yang disepakati)

Pada praktiknya, gerbang QA di `feature-workflow` dijalankan dengan pola berikut:

1. Setelah implementasi, model menulis **checklist QA langkah demi langkah** (aksi yang harus dilakukan
   user + hasil yang diharapkan), tanpa mengklaim "sudah lolos".
2. User menjalankan sendiri di browser/terminal dan melaporkan hasilnya, termasuk langkah yang **tidak bisa
   dijalankan** (mis. butuh device tertentu).
3. Baru setelah laporan itu, status dinaikkan ke `ready_for_commit`.

Aturan penting: model **tidak boleh** menandai QA lulus tanpa bukti dari user, dan langkah QA harus bisa
direproduksi (sebutkan URL, akun, langkah klik), bukan kalimat umum seperti "pastikan fitur berjalan".
