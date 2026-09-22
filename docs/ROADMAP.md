# Roadmap Perbaikan

Prioritas dari yang paling murah/berdampak. Status: `Belum` / `Dikerjakan` / `Selesai (tanggal)`.

| # | Usulan | Kenapa | Ukuran | Status |
| --- | --- | --- | --- | --- |
| R1 | Tambah langkah "validasi cepat asumsi plan" di `implement-task`: cek path, nama fungsi/endpoint, dan perintah verifikasi benar-benar ada sebelum menulis kode | Kalau plan salah alamat, baru ketahuan di tengah implementasi | S | Belum |
| R2 | Dukung **perintah verifikasi tambahan** selain lint/typecheck (mis. `react-doctor`, `eslint <file>`, uji migrasi) sebagai daftar di plan/config | Di project nyata, gerbang verifikasi lebih dari 2 perintah dan berbeda antar project | S | Belum |
| R3 | Langkah **transkrip aset desain** ke plan (khusus UI) + bagian `## Referensi desain` | Aset desain butuh model bervisi; kalau sesi master yang membaca lalu menuliskan fakta (ukuran, token warna, teks copy, state), sesi worker bisa jalan tanpa gambar dan hemat context | S | Belum |
| R4 | **Aturan personal vs aturan tim** yang eksplisit (usulan: `.pi/rules.md`, atau perluas config) berisi prioritas + daftar bahan bacaan per jenis tugas | Command tidak boleh mengubah file tim, tapi belum ada tempat resmi untuk preferensi workflow personal | M | Belum |
| R5 | Integrasi **ADR** sebagai memori keputusan project: `.pi/adr/` opsional dengan index `README.md` ringkas; `plan-task` membaca index lalu hanya ADR yang relevan dan mencatat keputusan yang sudah disetujui; riwayat append (`History`, `Corrections`, ADR baru + `Superseded`); `implement-task` mematuhi ADR yang disebut plan dan berhenti kalau butuh mengubah keputusan | Di project yang memakai ADR, keputusan sesi master perlu terekam supaya sesi berikutnya bisa menjawab kenapa, bukan menebak dari kode | S | Selesai (2026-09-22) |
| R6 | **Handoff ke subagent**: mode di `implement-task` yang menyerahkan eksekusi plan ke subagent | Plan sudah self-contained (langkah, path, acceptance, verifikasi), jadi siap; butuh aturan kapan aman dipakai | M | Belum |
| R7 | **Laporan akhir baku** untuk `implement-task` (perubahan, hasil verifikasi berupa angka, deviasi, temuan di luar scope, saran commit) | Supaya hasil tiap kerja konsisten dan mudah dibandingkan | S | Belum |
| R8 | Opsi bahasa artefak: rencana/spec bahasa Indonesia, bukan hanya Inggris | Kalau ada kebutuhan spec berbahasa Indonesia | S | Belum |
| R9 | Satukan kembali dengan `feature-workflow` atau tegaskan posisinya (kalau `feature-workflow` sudah dipakai harian, stapler bisa jadi tempat uji coba perubahan sebelum dipindah) | Dua sistem yang hidup bersamaan berisiko drift | M | Belum |
| R10 | Tambah `tools/` untuk self-test sederhana (validasi frontmatter skill + cek rujukan `references/` tidak menggantung) | Mencegah skill rusak diam-diam setelah diedit | S | Belum |
