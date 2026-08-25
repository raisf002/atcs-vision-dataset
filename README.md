# ATCS Vision Dataset Workspace

Workspace ini mengelola snapshot CCTV ATCS Tasikmalaya untuk membangun dataset computer vision. Aplikasi mencakup registri 29 kamera, Galeri Dataset dengan anotasi YOLO, metrik availability HLS, statistik, error log, audit ekspor, Command Center dengan peta, dan konfigurasi counting per kamera.

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
PORT=3000 NODE_ENV=production pnpm start
```

Runtime produksi menggunakan output `dist/`; jangan menjalankan `tsx watch` atau Vite dev server pada domain publik. Untuk smoke test yang tidak mengganggu preview, gunakan port lain, misalnya `PORT=3001 NODE_ENV=production node dist/index.js`, kemudian uji `/`, `/cameras`, `/dataset`, `/exports`, `/command-center`, dan `/settings`. URL seperti `/src/App.tsx` akan menerima fallback HTML aplikasi pada runtime produksi, bukan isi sumber TypeScript.

## Performa dan lazy loading

Rute halaman dimuat secara lazy. Command Center dan Leaflet, pemutar HLS, serta `hls.js` baru diunduh saat rute atau live view benar-benar dibuka. Build validasi 25 Agustus 2026 menghasilkan entry client **696,60 kB / 205,80 kB gzip**; chunk `hls.js` terpisah **590,65 kB / 184,89 kB gzip** dan Command Center terpisah **236,09 kB / 57,80 kB gzip**. Ini menggantikan bundle awal sekitar 1,71 MB / 476 kB gzip, sehingga layar awal tidak lagi memuat dependensi peta atau HLS.

## Akses aplikasi

Pengunjung tanpa sesi masuk sebagai **Guest**. Guest dapat melihat dashboard, registry, gallery, Command Center, peta, dan live view, tetapi tidak dapat mengubah konfigurasi kamera, garis counting, model, capture, atau ekspor ZIP. Seluruh mutasi tetap diperiksa di server dengan prosedur admin.

## Kontrak dataset dan paket siap-training

Setiap ingest snapshot membentuk key object storage berikut.

```text
camera_id/YYYY-MM-DD/timestamp.jpg
```

Contoh: `jati/2026-08-19/2026-08-19T07-43-11-663Z.jpg`. Struktur tersebut dipertahankan pada metadata dan ekspor JPEG mentah. Snapshot historis tidak diubah oleh fitur training.

Admin dapat mengisi teks label YOLO per snapshot dari Galeri Dataset dengan format `class x_center y_center width height` dan memilih status draf/disetujui/ditolak. Mode **Siap-training YOLO** di Ekspor hanya memasukkan anotasi disetujui dan membuat struktur berikut dalam ZIP:

```text
images/train/<snapshot>.jpg
images/val/<snapshot>.jpg
images/test/<snapshot>.jpg
labels/train/<snapshot>.txt
labels/val/<snapshot>.txt
labels/test/<snapshot>.txt
dataset.yaml
class-map.json
manifest.json
```

Pembagian train/val/test bersifat deterministik 70/20/10 berdasarkan hash storage key. Quality gate mengecualikan JPEG tidak terbaca, gambar blur, duplikat byte-identik, label tidak valid, dan anotasi yang belum disetujui; alasan serta ringkasannya dicatat di `manifest.json`. Paket ini tidak melakukan inferensi atau mengubah berkas sumber di object storage.

## Availability HLS, audit, dan retensi

Overview dan detail kamera menghitung capture tujuh hari terakhir, termasuk success rate, jumlah `HLS_TRANSIENT`, kegagalan pipeline, dan badge coverage. Coverage menurun tampil sebagai peringatan operator; metrik bersifat baca-saja terhadap riwayat capture.

Setiap permintaan ZIP oleh admin dicatat dalam `datasetExports` dengan aktor, waktu, filter, mode ekspor, jumlah file, status, serta ringkasan quality gate. Riwayat dapat dibaca admin di Pengaturan. **Kebijakan retensi** dan class map disimpan di `datasetSettings`; mengaktifkan kebijakan tidak menjadwalkan cleanup dan tidak menghapus snapshot. Penghapusan atau scheduler retensi harus dirancang sebagai perubahan terpisah dan disetujui secara eksplisit.

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
