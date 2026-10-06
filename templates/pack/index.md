<!-- MANUAL. Pintu masuk context pack. Jaga tetap di bawah 25 baris. -->

# Context pack: [ISI: nama project]

Dibuat oleh `stapler-context` dari sumber project. Skill `stapler` hanya membaca aturan dari folder ini.

## Selalu dibaca

`rules.md`, `deviations.md`, `manifest.json`.

## Baca apa untuk task apa

| Jenis task              | Wajib                                        | Sesuai kebutuhan                                  |
| ----------------------- | -------------------------------------------- | ------------------------------------------------- |
| UI / slicing            | `standards/frontend.md`                      | `design.md`, `plays/ui-slicing.md`                |
| API / data layer        | `standards/backend.md`, `standards/security.md` | `architecture.md`, `domain.md`, `plays/backend-api.md` |
| UI di atas API          | `standards/frontend.md`, `standards/backend.md` | `plays/ui-on-api.md`                            |
| Bugfix / refactor       | `architecture.md`                            | `standards/<topik>.md` sesuai area yang disentuh  |
| Perubahan schema        | `standards/data.md`                          | `domain.md`, ADR terkait                          |

## Play yang tersedia

- [ISI: daftar play di `plays/`, satu baris masing-masing beserta kapan dipakai]

## Kalau pack dicurigai basi

Jalankan `stapler-context check`. `stapler` menolak mengimplementasi selama masih ada temuan `STALE` atau
`MISS`.
