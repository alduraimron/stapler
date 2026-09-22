# stapler

Kumpulan skill Pi untuk alur kerja **plan lalu implement**: satu sesi mendiskusikan dan menulis file plan,
sesi lain mengeksekusinya tanpa perlu mengulang diskusi. Dipisah dari sistem lain supaya bisa dipakai lintas
project dan dikembangkan sendiri di repo ini.

## Isi

| Path | Fungsi |
| --- | --- |
| `skills/plan-task/` | Sesi MASTER: baca aturan project, tanya ambiguitas sekaligus, tulis plan. Tidak menulis kode |
| `skills/implement-task/` | Sesi WORKER: eksekusi satu file plan sampai terverifikasi, lalu lapor |
| `docs/DECISIONS.md` | Kenapa desainnya begini, alternatif yang ditolak, dan perbandingan dengan `feature-workflow` |
| `docs/ROADMAP.md` | Rencana perbaikan + statusnya |

## Cara pakai

1. Pasang skill ke Pi (pilih salah satu):
   ```bash
   cp -r skills/plan-task skills/implement-task ~/.pi/agent/skills/
   # atau symlink
   ln -s ~/code/pi/stapler/skills/plan-task ~/.pi/agent/skills/plan-task
   ln -s ~/code/pi/stapler/skills/implement-task ~/.pi/agent/skills/implement-task
   ```
2. Restart Pi (skill dipindai saat startup).
3. Jalankan (keduanya dipicu manual, `disable-model-invocation: true`):
   ```
   /skill:plan-task feature <permintaan>
   /skill:plan-task bugfix <gejala bug>
   /skill:implement-task .pi/plans/<file>.md
   ```

Aturan project dibaca dari `AGENTS.md` (aturan tim, tidak boleh diubah) dan `.pi/rules.md` (aturan personal).
Kalau `.pi/rules.md` belum ada, `plan-task` menawarkan membuatkannya.

## Hubungan dengan `feature-workflow`

`feature-workflow` (di `~/.pi/agent/skills/`) lebih lengkap: ada gerbang berbasis script, lifecycle status satu
work item, QA manual terpisah, dan commit dua tahap. `stapler` sengaja lebih ringan: dua skill, plan markdown
di `.pi/plans/`, tanpa script dan tanpa state machine.

Perbandingan detailnya ada di `docs/DECISIONS.md`, termasuk daftar hal dari stapler yang bisa diambil untuk
memperbaiki `feature-workflow` (di `docs/ROADMAP.md`).

## Status

Eksperimen/referensi. Belum jadi alur harian; `feature-workflow` masih acuan utama.
