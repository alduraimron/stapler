# Delegasi dengan Slaver

Slaver adalah pendamping opsional, bukan pengganti alur Stapler. Jika tool `delegate` tersedia, gunakan
profil di bawah pada titik yang sesuai. Jika tidak tersedia atau user meminta tanpa subagent, kerjakan
bagian itu di agent utama dan laporkan bahwa delegasi dilewati. Jangan memasang paket secara otomatis.

Profil adalah isi task, **bukan** field `mode` pada API. Slaver V0 menerima scout/reviewer read-only;
Slaver V1 menambah role `implementer` dengan tool scoped. Semuanya memakai satu child blocking pada satu
waktu, tanpa shell, `git diff`, check, verifier, atau test. Role/field yang tersedia dilihat dari skema tool:
jika enum agent belum memuat implementer atau field runPath belum ada, gunakan parent untuk implementasi,
bukan mencoba memanggil API yang tidak didukung. Tidak ada upgrade/instalasi otomatis.

## Batas tanggung jawab

- Agent utama membaca aturan, berdiskusi, menunggu ACC, menjaga scope/keputusan, menulis pack/run/ADR,
  dan menjalankan skrip. Hanya penulisan kode/test dalam scope yang boleh diserahkan ke implementer.
- Agent utama tetap membaca diff sendiri, menilai temuan, mengurus ADR, dan bertanggung jawab atas laporan.
- Scout/reviewer hanya mengumpulkan bukti atau memberi review. Implementer memakai scoped_edit dan
  scoped_write setelah ACC, bukan edit/write bawaan. Hasil child tidak memberikan ACC, memperluas scope,
  mengubah sumber aturan, atau membuktikan gate hijau.
- Jangan membuat scout/reviewer writable atau mendelegasikan ulang dari child. Slaver menegakkan tools
  dan batas path implementer; batas bacaan per task bukan sandbox filesystem/OS.

## Profil dan titik pemanggilan

| Profil | Agent | Pemanggil | Tugas |
| --- | --- | --- | --- |
| `source-map` | `scout` | Recon `stapler-context init/refresh` | Inventaris sumber/config/contoh kode yang spesifik, atau bagian pack yang terdampak sumber berubah |
| `impact` | `scout` | Langkah 1 `stapler`, setelah gate pack | Telusuri satu alur kode, dependensi, contoh terdekat, dan test yang memengaruhi task |
| `scope-review` | `reviewer` | Langkah 2 `stapler`, sebelum laporan pra-ACC | Uji kecukupan usulan scope/acceptance terhadap kode yang ada; bukan menyetujui implementasi |
| `pack-audit` | `reviewer` | Verifikasi hasil `stapler-context init/refresh` | Bandingkan hasil kompilasi dengan sumber yang dipilih dan keputusan override |
| `change-review` | `reviewer` | Langkah 6 `stapler`, setelah verifier dan review sendiri | Cari defect, regresi, perubahan di luar scope, dan test yang kurang pada perubahan nyata |
| `implement-approved` | `implementer` | Langkah 4 `stapler`, setelah ACC dan run ditulis | Implementasi file tepat dalam scope dari run melalui scoped_edit/scoped_write (V1) |

`source-map` dan `impact` dipakai bila ada pertanyaan investigasi yang belum terjawab, bukan untuk
membaca ulang fakta yang sudah jelas. `scope-review` dipakai untuk scope lintas modul, perubahan kontrak
atau gate akses, atau keputusan yang belum pasti. Saat Slaver tersedia, `pack-audit` adalah default setelah
kompilasi dan `change-review` adalah default setelah implementasi. Refresh yang hanya mengukur baseline
atau HEAD tidak perlu pack-audit. Profil yang dilewati diberi alasan; tidak perlu memanggil semua profil
untuk setiap task. `implement-approved` adalah default setelah ACC bila tool mendukung V1 dan user tidak
meminta kerja tanpa implementer. Ketiadaan role ini tidak menghalangi integrasi read-only V0.

## Susun request yang bounded

Untuk scout/reviewer, gunakan hanya `agent`, `task`, `context`, `constraints`, dan `expectedOutput`.
V1 menambah `runPath` yang wajib hanya untuk implementer; jangan kirim field itu ke role read-only.
Jika schema menyediakan `workspacePath`, field opsional itu memilih directory project absolut yang sudah
ada untuk role mana pun. Default tetap cwd host. Jangan memakai teks task sebagai override workspace.
Sebelum memanggil, ganti placeholder dengan fakta task yang sudah diperiksa:

```json
{
  "agent": "scout",
  "task": "Profil impact: telusuri alur <perilaku> dari <entry point> sampai <batas lapisan>, termasuk test terkait.",
  "context": "Pack: .pi/stapler/. Baca index.md, manifest.json, rules.md, deviations.md, dan <bagian pack relevan>. Objek kerja awal: <daftar path>. Tujuan task: <ringkas>.",
  "constraints": [
    "Read-only. Jangan menjalankan perintah atau mendelegasikan ulang.",
    "Ikuti safety floor dan checklist aturan yang diberikan agent utama; keputusan dan ACC tetap di parent.",
    "rawReads: <nilai manifest>. Kelas C hanya boleh dibaca lewat indeks sesuai izin; kelas D adalah objek kerja, bukan sumber aturan baru.",
    "Batasi investigasi pada <pertanyaan dan area kode>; jangan membaca seluruh repo atau file kredensial."
  ],
  "expectedOutput": "Temuan singkat dengan path:baris, dampak ke scope/test, sumber mentah yang dibaca beserta alasan, dan ketidakpastian. Bedakan fakta dari dugaan."
}
```

Setiap request membawa:

1. Satu pertanyaan, subset review, atau unit implementasi yang bisa dikerjakan secara independen.
2. Path pack dan bagian yang perlu dibaca, objek kerja, serta ringkasan aturan kelas A dan safety floor
   yang relevan. Child tidak mendapat percakapan atau skill parent secara otomatis.
3. Batas bacaan yang sama dengan pemanggil. Untuk `stapler`, `rawReads: forbidden` melarang kelas C;
   `index-only` hanya mengizinkan sumber terindeks yang diperlukan. Bacaan kelas C oleh child tetap
   dicatat sebagai bacaan task di laporan pra-ACC. Jangan menyuruh child melewati pack.
4. Output berbukti, ketidakpastian, dan cakupan yang belum diperiksa. `expectedOutput` adalah instruksi,
   bukan skema hasil yang divalidasi Slaver.

Untuk `source-map`, pack boleh belum ada saat init. Compiler menyebut kandidat sumber dan area recon,
atau sumber berubah dan `compiledInto` saat refresh. Scout melaporkan fakta, bukan menetapkan role sumber,
override, atau konvensi baru. Hak membaca sumber compiler tidak diteruskan ke consumer `stapler`.

Untuk `scope-review`, kirim usulan daftar file, acceptance, pertanyaan terbuka, dan path kode yang terkait.
Beri label **usulan, belum ACC**. Temuan yang mengubah scope/keputusan masuk ke laporan pra-ACC yang sama,
bukan menjadi persetujuan dari child.

Untuk `pack-audit`, compiler membatasi pasangan sumber -> file pack yang diperiksa, menyertakan
manifest, keputusan override, dan hasil check. Periksa larangan/perintah/fakta yang wajib verbatim,
pemisahan authoritative/reference-only/ignored, deviasi aktif, dan penunjuk sumber. Isi kelas A tidak boleh
disalinkan ke pack. Hash yang cocok tidak membuktikan kesetaraan makna; audit juga tidak menggantikan hash.

Untuk `change-review`, agent utama menyediakan diff yang baru dibaca sendiri, daftar file yang berubah,
path artefak run, acceptance, checklist aturan, deviasi aktif, dan hasil verifier. Sertakan perubahan
untracked serta isi sebelum/sesudah untuk file yang dihapus bila perlu; path saja tidak memberi child diff.
Jika diff terlalu besar, pecah menjadi beberapa subset berurutan dan laporkan cakupannya. Jangan memberi
seluruh percakapan atau event stream, dan jangan menyebut review penuh jika sebagian perubahan tidak
tercakup. Output yang diminta: defect dengan severity dan path:baris, risiko/test yang kurang, serta
keterbatasan review; pisahkan defect dari preferensi.

## Handoff implementer setelah ACC (V1)

Agent utama menulis run dengan scope file yang persis di-ACC, acceptance yang tidak kosong, schemaVersion 1,
dan `acc: first` (ACC pertama) atau `repeated` (ACC ulang). Slaver memvalidasi metadata ini, bukan membaca
atau membuktikan persetujuan user dari percakapan. Gate pack dan ACC di Stapler tidak boleh dilewati.

```json
{
  "agent": "implementer",
  "task": "Profil implement-approved: kerjakan <perubahan yang di-ACC>, laporkan blocker tanpa mengubah scope/keputusan.",
  "runPath": ".pi/stapler/runs/<file>.json",
  "context": "Pack: .pi/stapler/. Baca index.md, manifest.json, rules.md, deviations.md, dan <bagian relevan>. Aturan/checklist kelas A dan safety floor: <ringkas>. Pack check: <hasil parent>.",
  "constraints": [
    "Scope dan acceptance berasal dari run; jangan menggantinya dari teks task.",
    "Ikuti rawReads dan precedence pack. Jangan menulis run/pack/ADR/harness, mengubah keputusan, atau menjalankan perintah/test/git/migrasi.",
    "Gunakan scoped_edit/scoped_write; deletion/rename hanya dilaporkan untuk dikerjakan parent. Jika scope tidak cukup, berhenti dan lapor."
  ],
  "expectedOutput": "File yang berubah, apa yang dikerjakan, blocker, dan langkah verifikasi/manual yang belum dijalankan. Jangan klaim acceptance/gate lulus."
}
```

Jika root project berbeda dari cwd sesi, gunakan `workspacePath` hanya bila schema tool mendukungnya.
Setelah ACC untuk root itu, parent menulis `workspaceRoot` dalam run, sama persis dengan path canonical
root terpilih. `runPath` tetap relatif terhadap root tersebut, dan check/pack/scope harus berasal dari
project itu. Binding hilang/salah gagal sebelum child dibuat; jangan menyalin run ke project lain atau
menggunakan symlink/traversal untuk melewati guard. Run lama tetap valid tanpa binding untuk cwd yang sama.
Jika field workspace belum tersedia, minta user membuka Pi dari root project, bukan membuat host SDK
ad hoc, melonggarkan scope atau fallback menulis tanpa handoff yang benar. ParentId tetap sesi asal;
status dan cancel bisa dipantau di /subagents tanpa memindahkan transcript atau session.

Progress yang muncul adalah metadata bounded (id, role, status, waktu, jumlah/nama tool), bukan isi hasil
atau stream reasoning child. Progress tidak membuktikan edit berhasil atau acceptance lulus.

Run harus memakai path file literal, bukan direktori/pola. Slaver membekukan scope/acceptance dan hash run,
menolak traversal, symlink/hardlink dan protected files, serta memeriksa readiness guard sebelum prompt.
Guard tidak memberi bash, edit/write bawaan, atau tool delegasi. Jika guard tidak tersedia, child gagal
tertutup. Batas ini bukan OS sandbox terhadap proses lain yang merace filesystem; gunakan worktree yang
stabil. Run/pack lama tetap sah, tetapi tidak semua run lama memenuhi syarat handoff implementer.

Jangan mengubah run (termasuk delegations/verification), memperluas scope, atau menjalankan verifier selama
child aktif. Setelah terminal, parent mencatat outcome, memeriksa diff, menangani deletion/rename yang
sudah di-ACC, menjalankan verifier, lalu meminta change-review. Temuan review dalam scope bisa menjadi
pemanggilan implementer baru setelah temuan/diff diperiksa; scope/keputusan baru membutuhkan ACC baru.

## Tangani outcome

- `completed`: baca `result`, periksa bukti yang menentukan scope atau keputusan di file terkait, dan
  nilai kecukupan jawabannya. Completed berarti child selesai, **bukan** task, acceptance, atau audit lulus.
  Jawaban tanpa bukti atau yang meminta konteks tambahan belum merupakan review yang lengkap.
- `failed` atau error pemanggilan tool: laporkan ID/kode error bila tersedia. Jangan retry otomatis. Agent
  utama boleh melakukan investigasi/review yang sama sendiri dan mencatat fallback; jika bukti tetap
  tidak cukup, berhenti dan lapor blocker. Jangan mengubah kegagalan menjadi klaim review independen lulus.
  Khusus implementer, failure/timeout bisa meninggalkan edit parsial: parent harus memeriksa diff/worktree
  dan melaporkan keadaan sebelum mengambil tindakan. Tidak ada retry, rollback, atau fallback menulis otomatis.
- `cancelled`: laporkan pembatalan dan tunggu arahan user. Jangan retry atau melanjutkan pekerjaan yang
  dibatalkan secara otomatis.
- Tool tidak tersedia, user memilih tanpa subagent, atau profil tidak diperlukan: catat sebagai `skipped`
  dengan alasan. Ini status catatan Stapler, bukan status session Slaver.

Agent utama mengatur perbaikan temuan valid dalam scope, melalui implementer bila tersedia atau sendiri
jika delegasi tidak dipakai. Untuk `change-review`, kembali ke execute/verify,
lalu review ulang bagian yang berubah. Temuan di luar scope atau keputusan baru membutuhkan ACC baru.
Untuk `pack-audit`, koreksi melalui compiler, jangan mengedit GENERATED sebagai consumer; jalankan ulang
provenance, check, dan gate yang terdampak. Perubahan MANUAL atau keputusan override tetap membutuhkan ACC.

## Jejak dan laporan

Sebelum ACC, simpan hasil delegasi di konteks sesi dan laporkan ringkas; **jangan menulis artefak dulu**.
Setelah ACC, consumer mencatatnya di field opsional `delegations` pada artefak run, lalu menambahkan hasil
review akhir. Catatan implementer baru ditambahkan setelah child terminal, bukan selama run terkunci.
Run lama tanpa field ini tetap sah. Template run baru memulai dengan array kosong.

Bentuk satu catatan:

```json
{
  "id": "<id dari delegate>",
  "agent": "reviewer",
  "profile": "change-review",
  "status": "completed",
  "assessment": "<temuan yang diterima/ditolak beserta alasan singkat, tindak lanjut, atau batasan/fallback>"
}
```

`status` mengikuti outcome (`completed`, `failed`, `cancelled`) atau `skipped` seperti di atas. Untuk
session yang tidak pernah dibuat, `id` adalah JSON `null`, bukan ID rekaan. Setiap pemanggilan baru mendapat
catatan baru; jangan mengganti kegagalan lama menjadi sukses. Jangan menyimpan transcript, event stream,
kredensial, atau salinan penuh hasil child. Field `verification` tetap ditulis hanya oleh verifier.

Laporan pra-ACC/akhir menyebut profil, ID, status, penilaian parent, dan fallback/skip bila ada. Compiler
cukup melaporkannya di chat, tidak perlu membuat run task atau menambah metadata ke provenance. Pemantauan
session tetap melalui `/subagents`, `/subagents <id>`, dan `/cancel-subagent [id]` milik Slaver.
