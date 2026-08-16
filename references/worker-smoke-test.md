# Worker smoke test — 2026-08-16

Uji lokal terhadap stream `rancabangoptz.m3u8` berhasil mengambil satu frame JPEG melalui FFmpeg tanpa menulis ke dataset produksi.

| Pemeriksaan | Hasil |
| --- | --- |
| Kamera uji | Rancabango arah Simpang Bantar |
| Hasil FFmpeg | Berhasil |
| Ukuran JPEG sementara | 32.446 byte |
| Resolusi | 352 × 288 piksel |
| Lokasi output | `/tmp/atcs-rancabango-smoke.jpg` |
| Upload S3 / metadata | Tidak dijalankan |

Endpoint ingest sengaja belum diaktifkan karena `CAPTURE_WORKER_INGEST_TOKEN` belum dikonfigurasi. Hal ini mencegah proses di luar aplikasi mengunggah gambar atau mengubah metadata secara tidak sah.

Permintaan tanpa token ke `GET /api/worker/cameras` menghasilkan **HTTP 503**, sehingga konfigurasi kamera tidak diekspos sebelum aktivasi ingest server dilakukan.
