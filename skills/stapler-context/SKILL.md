---
name: stapler-context
description: "Compiler context pack: membaca sumber project (standar tim, aturan pribadi, ADR, konfigurasi, kode) lalu menghasilkan .pi/stapler/ yang dipakai skill stapler. Punya mode init, check, dan refresh. Pakai saat pengguna ingin menyiapkan atau memperbarui konteks project untuk agent."
disable-model-invocation: true
---

# Compiler context pack

## Objective

Mengubah sumber project menjadi satu context pack di `.pi/stapler/` yang bisa dibaca `stapler` tanpa
menyentuh sumber mentah. Skill ini tidak pernah menulis kode aplikasi dan tidak pernah mengerjakan task
fitur. Keluarannya hanya file di dalam `.pi/stapler/`, dan dengan ACC, satu baris penunjuk di file konteks
harness.

Kontrak lengkap ada di `docs/design.md` paket ini. Kalau ada yang berbeda, dokumen itu yang menang.

## Batas wewenang

- Menulis hanya di dalam `.pi/stapler/`.
- Boleh mengusulkan satu baris penunjuk ke `.pi/stapler/index.md` untuk file konteks harness, dan hanya
  mengubahnya setelah ACC.
- Tidak menyentuh standar tim, ADR, kode, atau konfigurasi. Kalau menemukan kekurangan di sana, laporkan
  sebagai temuan.
- Tidak menjalankan aksi destruktif, tidak menjalankan migrasi, tidak mengubah schema.

## Mode

| Mode | File | Kapan dipakai |
| --- | --- | --- |
| init | [modes/init.md](modes/init.md) | pack belum ada, atau user ingin menyusun ulang dari nol |
| check | [modes/check.md](modes/check.md) | memeriksa apakah pack masih akurat, tanpa menulis apa pun |
| refresh | [modes/refresh.md](modes/refresh.md) | sumber berubah dan pack perlu dikompilasi ulang |

Tentukan mode dari argumen. Kalau kosong: jalankan `check` lebih dulu, lalu sarankan `init` atau `refresh`
sesuai temuan.

## Slaver (opsional)

Jika tool `delegate` tersedia, pakai `scout` profil `source-map` untuk pertanyaan recon yang belum terjawab
pada init/refresh, dan `reviewer` profil `pack-audit` setelah hasil kompilasi lolos check. **Baca
[kontrak delegasi](../../docs/slaver.md) sebelum pemanggilan pertama.** Profil dikirim lewat field API yang
ada, bukan field `mode` atau role baru. Check mekanis tetap dijalankan compiler, bukan child.

Child read-only: compiler utama tetap memilih sumber bersama user, menunggu ACC, menulis pack, dan
menjalankan provenance/check/verifier. Batas pembacaan sumber untuk compiler tidak memperluas hak consumer
`stapler`. Jika tool tidak tersedia atau user meminta tanpa subagent, lakukan fase itu sendiri dan laporkan
skip. Kegagalan tidak di-retry otomatis; pembatalan menunggu arahan user. Jangan menulis catatan sebelum ACC;
compiler cukup melaporkan profil, ID, status, dan penilaiannya di chat, tanpa membuat run task.

## Sumber dan status

Setiap sumber punya `role` di `manifest.json`:

| role | Arti | Disalin ke pack |
| --- | --- | --- |
| `authoritative` | standar yang mengikat | ya, disaring |
| `reference-only` | dikompilasi sebagai konteks, tapi tidak mengikat | ya, sebagai catatan |
| `ignored` | tidak dipakai | tidak |
| `personal` | aturan pribadi untuk repo ini | ya |
| `harness-injected` | sudah masuk otomatis lewat runtime | tidak, hanya penunjuk dan hash |

Override dilakukan per topik, bukan per dokumen:

```json
{
  "path": ".kiro/steering/git-commit.md",
  "role": "reference-only",
  "override": {
    "commit-format": {
      "useSource": ".pi/personal/commit.md",
      "reason": "preferensi pribadi",
      "enforcedBy": "review"
    }
  }
}
```

- `reason` wajib diisi. Satu baris.
- `enforcedBy` wajib kalau topiknya punya penegak: `ci`, `review`, atau `none`. Kalau `ci`, cari buktinya di
  konfigurasi CI dan catat path-nya.
- `safety floor` milik skill `stapler` tidak bisa ditimpa. Kalau manifest mencoba, tolak dan laporkan.

Kalau user memilih `ignored` atau `reference-only` untuk sebuah standar, itu bukan pelanggaran: itu deviasi
resmi yang harus muncul di `deviations.md` dengan alasan, risiko, dan penegaknya.

## Aturan kompilasi

| Wajib verbatim | Boleh diringkas |
| --- | --- |
| Kalimat larangan | Narasi arsitektur |
| Perintah dan flag | Latar belakang domain |
| Path, nama fungsi, nama script | Alasan historis |
| Angka baseline dan ambang | Ringkasan ADR lama |
| Gate akses, konvensi data, definisi angka turunan | Catatan proses kerja |

Verbatim berlaku untuk butir dan fakta, bukan seluruh dokumen. Isi file kelas A (harness) tidak pernah
disalin, hanya dicatat keberadaannya dan hash-nya.

## File pack: tanda dan anggaran

| File | Tanda | Anggaran |
| --- | --- | --- |
| `index.md` | MANUAL | 25 baris |
| `manifest.json` | MANUAL | - |
| `verification.mjs` | MANUAL | - |
| `check.mjs` | MANUAL | - |
| `provenance.mjs` | MANUAL | - |
| `plays/*.md` | MANUAL | 40 sampai 120 baris |
| `rules.md` | GENERATED | 80 baris |
| `deviations.md` | GENERATED | 40 baris |
| `standards/*.md` | GENERATED | 40 sampai 120 baris |
| `architecture.md` | GENERATED | 120 baris |
| `domain.md` | GENERATED | 120 baris |
| `adr-index.md` | GENERATED | 80 baris |
| `design.md` | GENERATED | 40 baris |
| `provenance.json` | GENERATED | - |
| `verification.json` | GENERATED | - |
| `runs/*.md` | GENERATED | 40 baris |

Aturan:

1. File GENERATED wajib diawali banner: pembuat, versi, waktu, dan daftar sumber.
2. File MANUAL tidak pernah ditimpa. Perubahan diusulkan sebagai diff dan menunggu ACC.
3. Kalau isi sebuah topik melebihi anggaran, potong dan tunjuk sumbernya. Pack bukan tempat detail.

## Protokol wawancara

1. Recon read-only dulu, sampai kamu bisa menyebut sumber mana yang ada dan mana yang tidak.
2. Kirim semua pertanyaan sekaligus, masing-masing dengan opsi dan rekomendasi. Pertanyaan yang tidak
   mengubah hasil tidak perlu ditanyakan.
3. Sertakan rencana file: dibuat, diubah, dan yang tidak disentuh.
4. Sertakan daftar deviasi yang akan dicatat, beserta risiko dan penegaknya.
5. Baris terakhir: status ACC. Tidak menulis apa pun sebelum ACC untuk scope yang persis itu.

## Kesegaran

Dua sumbu, jangan disatukan:

- Aturan dan dokumen: berubah kalau isi sumber berubah. Deteksi dengan hash di `provenance.json`.
- Fakta dari kode: berubah walau dokumen tetap. Deteksi dengan HEAD dan pengukuran ulang.

Kode temuan `check`: `STALE`, `HARNESS-CHANGED`, `DEVIATION-STALE`, `MISS`, `WARN`, `OK`. Exit code `1` kalau
ada `STALE`, `HARNESS-CHANGED`, `MISS`, atau `DEVIATION-STALE`; `0` kalau hanya `OK` dan `WARN`.

## Berhenti dan lapor kalau

- Ada dua standar yang setara dan saling bertentangan, dan user belum memilih.
- Sumber yang wajib tidak bisa dibaca atau tidak ada.
- Manifest versi lama mencoba menimpa safety floor.
- Perubahan yang diminta menyentuh file di luar `.pi/stapler/`.

## Completion criteria

- Pack lengkap sesuai daftar file, dengan tanda GENERATED dan MANUAL yang benar.
- `provenance.json` memuat hash semua sumber yang dikompilasi dan semua file kelas A yang diawasi.
- Semua gate yang dideklarasikan sudah dijalankan minimal sekali, dan hasilnya tercatat di
  `verification.json`.
- `check` bersih setelah kompilasi.
- Laporan menyebut: file yang dibuat, sumber yang dikompilasi, deviasi yang dicatat, temuan, yang belum
  bisa diverifikasi, dan hasil delegasi atau alasan skip/fallback.
