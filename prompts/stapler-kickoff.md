---
description: Mulai sesi kerja dengan alur stapler - pastikan context pack siap, lalu tunggu task
argument-hint: "[task]"
---

Baca `SKILL.md` milik skill `stapler`, lalu jalankan alurnya mulai dari langkah 0:

1. Baca `.pi/stapler/index.md`, `manifest.json`, `rules.md`, dan `deviations.md`.
2. Jalankan pemeriksaan kebasian pack (skill `stapler-context` mode `check`, atau versi minimalnya secara
   manual kalau skill itu tidak tersedia).
3. Kalau pack basi atau belum ada: berhenti, laporkan temuan dan perintah yang perlu aku jalankan. Jangan
   menyiapkan rencana implementasi untuk scope apa pun.

Kalau pack bersih, laporkan ringkas dalam bahasa Indonesia:

- mode dan play apa yang kamu pilih untuk task ini, beserta alasannya;
- aturan berlaku: butir dari `rules.md`, file konteks harness yang relevan, dan deviasi aktif;
- bahan bacaan tambahan yang kamu pilih beserta alasannya, dengan `path:baris` untuk implementasi terdekat;
- pertanyaan yang belum bisa dijawab dari pack (kalau ada);
- delegasi Slaver pada tahap inspeksi/scope-review sesuai kontrak skill: profil, ID, status, dan penilaian
  agent utama, atau alasan skip/fallback. Jangan mendelegasikan check, ACC, atau penulisan file.

Lalu berhenti: jangan mengubah file apa pun dan jangan mulai implementasi sebelum aku bilang ACC.

Task dari aku (kalau kosong, tunggu sampai aku sebutkan): ${ARGUMENTS:-belum ada}
