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

## Verifikasi aplikasi setelah ingest

Galeri dataset menampilkan satu kartu snapshot untuk `rancabango-bantar`. Halaman detail kamera menunjukkan satu dataset image, waktu capture, interval 15 menit, serta status kamera aktif. Dashboard memperbarui ringkasan menjadi satu kamera aktif, satu snapshot, dan penggunaan penyimpanan 32,7 KB.

## Batch paralel tiga kamera

Worker dijalankan dengan tiga kamera aktif. Kamera `rancabango-bantar` tidak jatuh tempo lagi karena snapshot sukses sebelumnya masih berada dalam interval 15 menit. Dua stream lain—`rancabango-jati` dan `cimulu`—masing-masing mencoba tiga kali, tetapi server sumber mengembalikan segmen HLS yang tidak dapat diproses FFmpeg. Worker hanya mengirim satu laporan kegagalan akhir untuk setiap kamera, sehingga error log dashboard dapat membedakan kegagalan sumber dari kegagalan worker.

Registry memperlihatkan `Berhasil` untuk `rancabango-bantar` dan `Gagal` untuk dua stream yang tidak menyediakan segmen HLS valid. Dengan demikian, status source terkonfigurasi tetap terpisah dari status capture terakhir.
