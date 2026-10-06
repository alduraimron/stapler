<!--
GENERATED oleh stapler-context. Jangan diedit tangan.
Perubahan deviasi butuh keputusan user, bukan kesimpulan compiler.
-->

# Deviasi dari standar tim

| Topik | Standar tim | Yang dipakai | Alasan | Risiko | Terlihat tim | Penegak |
| ----- | ----------- | ------------ | ------ | ------ | ------------ | ------- |
| [ISI] | [ISI: path] | [ISI: path aturan pengganti, atau "tidak dipakai"] | [ISI satu baris] | [rendah / sedang / tinggi] | [ya, di mana / tidak] | [ci / review / none] |

Catatan risiko: deviasi pada output yang dibaca tim (kontrak, format commit, teks PR) berisiko tinggi,
karena dampaknya terlihat di luar sesi ini. Deviasi pada detail internal berisiko rendah.

## Safety floor (tidak bisa dideviasi oleh pack)

1. Jangan mencatat kredensial, token, atau data sensitif ke kode, log, atau laporan.
2. Jangan melemahkan pemeriksaan supaya hijau.
3. Jangan melewati atau melonggarkan gate auth dan otorisasi.
4. Jangan menaruh nilai kredensial asli di file yang ter-track Git.
5. Jangan menjalankan aksi destruktif tanpa izin eksplisit di sesi itu.
6. Jangan commit atau push kecuali user meminta eksplisit di sesi itu.
