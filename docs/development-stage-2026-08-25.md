# Tahap Pengembangan — Runtime Produksi, Dataset Training, dan Governance

**Tanggal:** 25 Agustus 2026  
**Batasan:** Snapshot historis dan konfigurasi kamera tidak diubah. Tidak ada akses ke `karya-1`, aktivasi capture, jadwal, atau cleanup otomatis.

## Ringkasan perubahan

| Prioritas | Implementasi | Bukti hasil |
| --- | --- | --- |
| P0 | Build production dijalankan dengan `NODE_ENV=production`; tujuh rute utama diuji pada port terisolasi. | Semua rute HTTP 200; `/src/App.tsx` tidak menyajikan isi `.tsx`. |
| P1 | Lazy route, Leaflet/Command Center, serta `hls.js` dipisah dari entry awal. | Entry turun dari sekitar **1,71 MB / 476 kB gzip** ke **696,60 kB / 205,80 kB gzip**; HLS menjadi chunk on-demand 184,89 kB gzip. |
| P1 | Pipeline YOLO: anotasi admin, split deterministik, quality gate, manifest, dan ZIP siap-training. | Struktur `images/`, `labels/`, `dataset.yaml`, class map, dan manifest dihasilkan tanpa mutasi snapshot sumber. |
| P1 | Availability capture tujuh hari dan alert coverage menurun. | Tampil pada Ringkasan dan detail CCTV, termasuk HLS transien serta kegagalan pipeline. |
| P2 | Kamus menu utama diseragamkan ke Bahasa Indonesia; Gallery meneruskan kamera/tanggal/waktu ke Ekspor. | Navigasi menampilkan Ringkasan, Pusat Komando, Registri Kamera, Galeri Dataset, Ekspor, dan Pengaturan. |
| P2 | Audit ekspor serta kebijakan retensi tersimpan. | Audit menyimpan aktor, waktu, filter, mode, berkas, status; retensi tidak melakukan penghapusan atau scheduler. |

## Bukti visual

| Rute | Bukti yang terlihat setelah perubahan |
| --- | --- |
| `/` | Panel availability HLS tujuh hari dan alert coverage di bawah status registri. |
| `/cameras/jati` | Badge coverage, metrik availability, jumlah HLS transien, dan timestamp capture terakhir. |
| `/dataset` | Filter kamera/tanggal/waktu, tombol **Ekspor pilihan**, serta status anotasi per snapshot. |
| `/exports` | Pilihan JPEG mentah/siap-training, batas waktu, dan readiness quality gate. |
| `/settings` | Class map, retensi non-destruktif, dan tabel audit ekspor admin. |

## Validasi

| Pemeriksaan | Hasil |
| --- | --- |
| Regresi penuh | 41 file / 111 test lulus |
| TypeScript | `pnpm check` lulus |
| Bundle produksi | `pnpm build` lulus; `dist/index.js` 83,5 kB |
| Smoke test production | `/`, `/cameras`, `/cameras/jati`, `/dataset`, `/exports`, `/command-center`, `/settings` seluruhnya 200 |
| Keamanan sumber | `/src/App.tsx` pada server produksi merespons fallback SPA tanpa isi fungsi TypeScript |

> Build tetap memunculkan peringatan chunk besar untuk entry 696,60 kB sebelum gzip. Dependensi peta dan HLS sudah dipindahkan, tetapi pengurangan lebih lanjut dapat dilakukan pada komponen UI bersama apabila pengukuran jaringan perangkat seluler menunjukkan kebutuhan nyata.

## Skor before-after indikatif

| Aspek | Sebelum | Sesudah | Dasar penilaian |
| --- | ---: | ---: | --- |
| Kesiapan runtime produksi | 4/10 | 8/10 | Artefak produksi dan smoke test tersedia; deployment VPS belum dilakukan. |
| Performa pemuatan awal | 5/10 | 8/10 | Entry gzip turun sekitar 57%; peta dan HLS menjadi on-demand. |
| Kesiapan dataset training | 5/10 | 8/10 | Anotasi, split, manifest, YAML, dan quality gate siap; kualitas label tetap bergantung pada operator. |
| Observabilitas HLS | 6/10 | 8/10 | Metrik tujuh hari dan alert coverage tersedia. |
| Governance | 5/10 | 8/10 | Audit ekspor dan kebijakan retensi persisten tersedia tanpa risiko cleanup otomatis. |

## Tindak lanjut yang tidak dilakukan

Tahap berikutnya harus dilakukan sebagai operasi terpisah: menerapkan artefak pada VPS, memigrasikan database di host tujuan, smoke test dengan proxy/TLS nyata, menguji session admin, menjalankan batch capture yang disetujui, dan baru kemudian mempertimbangkan scheduler retensi dengan dry-run serta approval eksplisit.
