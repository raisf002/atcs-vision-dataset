# ATCS Capture Worker

Worker ini mengambil **satu frame JPEG** dari setiap stream HLS aktif dan mengirimkannya ke aplikasi ATCS Vision Dataset. Worker tidak menyimpan kredensial S3 dan tidak menulis langsung ke basis data. Aplikasi server menangani upload object storage, key `camera_id/YYYY-MM-DD/timestamp.jpg`, metadata snapshot, serta error log.

## Konfigurasi karya-1

Konfigurasi default memakai enam proses FFmpeg paralel. Pada `karya-1`—12 vCPU, sekitar 23 GiB RAM, dan ruang kosong sekitar 139 GB—batas tersebut disengaja agar ada headroom untuk retry, aktivitas sistem, dan proses ekspor. Worker tidak membutuhkan GPU.

| Variabel | Nilai awal | Tujuan |
| --- | ---: | --- |
| `WORKER_MAX_PARALLEL` | `6` | Batas stream yang diproses serentak. |
| `WORKER_TIMEOUT_MS` | `25000` | Putuskan capture yang macet setelah 25 detik. |
| `WORKER_MAX_ATTEMPTS` | `3` | Maksimum tiga percobaan capture per kamera dengan backoff singkat. |
| `WORKER_STATE_PATH` | `/var/lib/atcs-capture/capture-state.json` | Menyimpan waktu capture sukses untuk menghormati interval per kamera. |

## Alur kerja

1. Worker meminta konfigurasi hanya untuk kamera aktif dari `GET /api/worker/cameras`.
2. Worker menentukan kamera yang sudah jatuh tempo menurut interval individual 1, 5, 10, atau 15 menit.
3. FFmpeg menulis JPEG ke stdout tanpa membuat file frame sementara.
4. Worker mengirim JPEG ke `PUT /api/worker/ingest`; server mengunggah langsung ke storage dan mencatat metadata secara idempoten.
5. Jika stream gagal, worker mengirim laporan ke `POST /api/worker/failure` agar dashboard menampilkan error per kamera.

## Instalasi saat karya-1 siap dihubungkan

Salin folder `worker/` ke server lalu jalankan `sudo bash worker/install-on-karya1.sh`. Installer memeriksa Node.js 20+, memasang FFmpeg, membuat user sistem terbatas `atcs-capture`, membuat direktori state, menyalin unit systemd, dan **tidak** mengaktifkan timer sebelum konfigurasi rahasia diisi.

> Jangan mengaktifkan timer sebelum aplikasi telah dipublikasikan dan `CAPTURE_WORKER_INGEST_TOKEN` tersedia di server aplikasi maupun `/etc/atcs-capture.env`. Nilai token tidak boleh masuk ke repository, browser, atau tangkapan layar.

Setelah konfigurasi valid, gunakan `sudo systemctl start atcs-capture.service` untuk uji satu batch manual. Periksa hasil dengan `journalctl -u atcs-capture.service -n 100 --no-pager`; bila sudah stabil, aktifkan jadwal dengan `sudo systemctl enable --now atcs-capture.timer`.
