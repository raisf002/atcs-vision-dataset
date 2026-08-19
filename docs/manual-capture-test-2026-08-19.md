# Hasil Uji Capture Manual — 19 Agustus 2026

## Ruang Lingkup

Satu putaran capture manual telah dijalankan dari lingkungan Manus terhadap seluruh **29 CCTV** melalui worker FFmpeg lokal. Uji memakai maksimal enam pekerjaan paralel, empat percobaan per kamera, timeout 25 detik, serta endpoint ingest terproteksi pada aplikasi lokal.

Uji ini **bukan** aktivasi cron, timer, atau service berkelanjutan. Setelah worker selesai, tidak ada proses capture yang tersisa dan tidak ada kamera yang diaktifkan untuk jadwal otomatis.

## Ringkasan Hasil

| Metrik | Hasil |
| --- | ---: |
| Kamera diuji | 29 |
| Snapshot berhasil disimpan | 19 |
| Kamera dengan kegagalan sumber pada putaran ini | 10 |
| Proses worker tersisa setelah uji | 0 |
| Kamera aktif untuk jadwal otomatis | 0 |

Snapshot yang berhasil memiliki metadata dimensi dan ukuran berkas, serta memakai pola key yang disyaratkan: `camera_id/YYYY-MM-DD/timestamp.jpg`. Contoh hasil ingest: `alun-alun-otista/2026-08-19/2026-08-19T07-43-11-663Z.jpg` pada resolusi 1280×720.

## Kamera Berhasil

| Kamera | Catatan |
| --- | --- |
| alun-alun-otista | Snapshot tersimpan |
| alun-alun-sutisna-senjaya | Snapshot tersimpan |
| bojong-jengkol-leuwidahu | Snapshot tersimpan setelah retry |
| bojong-jengkol-wasita-kusuma | Snapshot tersimpan |
| cimulu | Snapshot tersimpan setelah retry |
| dewi-sartika-masjid-agung | Snapshot tersimpan |
| jati | Snapshot tersimpan |
| masjid-agung | Snapshot tersimpan setelah retry |
| nagarawangi | Snapshot tersimpan |
| padayungan | Snapshot tersimpan |
| panyerutan-fix | Snapshot tersimpan |
| panyerutan-ptz | Snapshot tersimpan |
| paseh | Snapshot tersimpan setelah retry |
| pataruman-fix | Snapshot tersimpan |
| pataruman-ptz | Snapshot tersimpan |
| rancabango-bantar | Snapshot tersimpan |
| rancabango-letnan-harun | Snapshot tersimpan |
| simpang-lima | Snapshot tersimpan |
| sutisna-senjaya | Snapshot tersimpan |

## Kamera dengan Gangguan Sumber Sementara

| Kamera | Hasil terakhir |
| --- | --- |
| alun-alun-tentara-pelajar | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| batas-kota-bandung | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| dewi-sartika-cimulu | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| gunung-sabeulah | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| mitra-batik | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| rancabango-jati | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| ruas-m-hatta | FFmpeg berhenti sebelum menghasilkan frame |
| rumah-sakit | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| wasita-kusuma-bandung | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |
| wasita-kusuma-bojong-jengkol | Segmen HLS tidak valid/tidak tersedia setelah empat percobaan |

Kegagalan pada kelompok terakhir tercatat sebagai gangguan sumber pada waktu pengujian. Karena 19 sumber lain berhasil melalui worker dan endpoint ingest yang sama, batch ini membuktikan bahwa alur FFmpeg → ingest API → S3 → metadata database bekerja. Daftar gangguan sumber perlu diuji ulang pada putaran lain sebelum diberi kesimpulan bahwa kameranya tidak tersedia secara permanen.

## Rekomendasi

Jadwal otomatis tetap sebaiknya tidak diaktifkan sebelum dilakukan beberapa putaran uji pada jam berbeda untuk mengukur kestabilan sepuluh sumber yang gagal. Saat tahap deployment VPS disetujui, worker yang sama dapat dipakai dengan state dan interval per kamera yang sudah tersedia.
