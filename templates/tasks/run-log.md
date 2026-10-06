<!--
GENERATED artefak satu task. Tulis setelah ACC, lengkapi saat melapor.
Scope di sini dipakai sebagai argumen --scope pada verifier, supaya invariant scope jadi gate.
-->

# Run: [tanggal] [slug singkat]

scope: [daftar file yang disetujui, satu per baris atau dipisah koma]

acceptance:

- [daftar yang bisa diperiksa]

aturan:

- pack: [butir yang relevan]
- harness: [file konteks]
- deviasi: [baris dari deviations.md yang relevan, atau tidak ada]

verifikasi:

- format: [status]
- typecheck: [status]
- lint: [angka, baseline]
- test: [status atau skip]
- build: [status atau skip]
- scope: [pass atau fail]

penyimpangan: [ada atau tidak, beserta alasannya]

kandidat ADR: [daftar, atau tidak ada]

ACC: [pertama | perlu diulang, alasan]
