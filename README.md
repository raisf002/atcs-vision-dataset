# ATCS Vision Dataset Workspace

Workspace ini mengelola snapshot CCTV ATCS Tasikmalaya untuk membangun dataset computer vision. Aplikasi mencakup registry 29 kamera, gallery snapshot, statistik, error log, ekspor ZIP, Command Center dengan peta, dan konfigurasi counting per kamera.

## Menjalankan aplikasi

Gunakan `pnpm dev` hanya untuk pengembangan lokal. Mode ini menjalankan Vite dan mengekspos modul sumber kepada browser untuk hot reload.

```bash
pnpm install
pnpm dev
```

Sebelum deployment, jalankan pemeriksaan dan build produksi.

```bash
pnpm test
pnpm check
pnpm build
NODE_ENV=production pnpm start
```

Runtime produksi menggunakan output `dist/`; jangan menjalankan `tsx watch` atau Vite dev server pada domain publik.

## Akses aplikasi

Pengunjung tanpa sesi masuk sebagai **Guest**. Guest dapat melihat dashboard, registry, gallery, Command Center, peta, dan live view, tetapi tidak dapat mengubah konfigurasi kamera, garis counting, model, capture, atau ekspor ZIP. Seluruh mutasi tetap diperiksa di server dengan prosedur admin.

## Kontrak dataset

Setiap ingest snapshot membentuk key object storage berikut.

```text
camera_id/YYYY-MM-DD/timestamp.jpg
```

Contoh: `jati/2026-08-19/2026-08-19T07-43-11-663Z.jpg`. Struktur tersebut dipertahankan pada metadata dan entry ZIP. Ini siap menjadi basis dataset YOLO, dengan anotasi disimpan terpisah menggunakan nama dasar gambar yang sama, misalnya `labels/jati/2026-08-19/<timestamp>.txt`.

## Worker capture

Folder `worker/` mengambil satu frame JPEG dari HLS aktif, lalu mengirimkannya melalui API ingest terproteksi. Worker tidak memegang kredensial S3 dan tidak menulis database secara langsung.

```bash
cd worker
cp capture.env.template /etc/atcs-capture.env
# Isi CAPTURE_API_URL dan CAPTURE_WORKER_INGEST_TOKEN secara aman.
sudo systemctl start atcs-capture.service   # satu batch manual
journalctl -u atcs-capture.service -n 100 --no-pager
```

Timer systemd **tidak boleh** diaktifkan sebelum sumber HLS, token, snapshot hasil uji, dan pemulihan reboot tervalidasi. Lihat `worker/README.md` dan `docs/deployment-handoff.md` untuk handover `karya-1`.

## Taxonomy status dan error

| Status | Arti | Tindakan operator |
| --- | --- | --- |
| `HLS_TRANSIENT` | Playlist atau segmen live sementara tidak tersedia setelah retry. | Tunggu lalu coba ulang; periksa live view. |
| `Sumber HLS gagal` | Playlist/segmen tidak dapat dibaca dari jaringan saat itu. | Gunakan **Coba sambungkan ulang**; verifikasi sumber ATCS. |
| `Pipeline worker gagal` | Worker/ingest/upload mengalami kegagalan setelah frame diperoleh atau diproses. | Buka registry, periksa error log dan log service worker. |
| `Berhasil` | Snapshot sudah tersimpan dan metadata tercatat. | Tidak perlu tindakan. |

Pemutar live memiliki batas waktu CONNECTING 15 detik. Jika stream tidak mulai memutar, UI berubah ke error yang dapat ditindaklanjuti dan menyediakan retry tanpa mengubah konfigurasi kamera.

## Keamanan operasional

Kredensial Forge/S3 dan token ingest hanya dipakai di server. Jangan menaruh token, URL presign, atau berkas `.env` pada kode klien, repository, atau screenshot. Endpoint ZIP, upload model, dan seluruh konfigurasi write memerlukan peran admin.
