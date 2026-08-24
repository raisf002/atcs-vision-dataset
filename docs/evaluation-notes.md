# Catatan Evaluasi Teknis — ATCS Vision Dataset

## Bukti Visual Awal

Pengambilan layar pada 24 Agustus 2026 mencatat bahwa Overview menampilkan 29 kamera, 23 snapshot, dan 1,7 MB storage. Camera Registry menampilkan 29 sumber yang terkonfigurasi dengan pemisahan status hasil capture terbaru. Gallery merender 23 kartu snapshot beserta thumbnail dan metadata. Exports menampilkan preview 23 file / 1,7 MB. Command Center memuat peta Earth beserta marker CCTV dan panel counting/model. Settings menjelaskan kontrak penyimpanan S3 sebagai pembentukan key di sisi server.

## Temuan Awal

1. Rute terenkode yang tidak dikenal sebelumnya masuk ke halaman 404. Fallback aplikasi kini dialihkan ke Overview dan sudah diverifikasi melalui regresi serta pengambilan layar.
2. Detail kamera Jati masih berada pada status `CONNECTING` saat pengambilan layar. Ini dicatat sebagai kandidat evaluasi robustness karena sumber HLS dapat tersedia secara tidak konsisten.
3. Bahasa UI masih campuran, misalnya `Camera registry`, `Dataset exports`, dan label Inggris lainnya berdampingan dengan konten Indonesia.
4. Identitas visual kuat pada Command Center (peta dan panel gelap), tetapi halaman workspace terang masih lebih menyerupai dashboard SaaS umum. Saran penguatan dibahas pada laporan akhir.

## Bukti Teknis Tambahan

| Area | Bukti audit | Kesimpulan sementara |
| --- | --- | --- |
| Regresi | 39 file / 99 test lulus sebelum perbaikan evaluasi | Cakupan unit dan integrasi tersedia pada fitur utama. |
| Rute | URL terenkode tak dikenal dialihkan ke Overview | Halaman 404 mentah pada URL evaluasi sudah ditutup. |
| ZIP | Endpoint admin diuji menghasilkan `application/zip`, signature PK, dan lolos `unzip -t` | Arsip dapat diekstrak pada uji terisolasi. |
| Performa dev | TTFB lokal untuk 7 rute antara 5,8–11,9 ms; semua mengembalikan 368.272 byte HTML | Angka ini hanya baseline server lokal; waktu data, gambar, HLS, dan peta tidak tercakup. |
| Runtime | Proses aktif adalah `NODE_ENV=development tsx watch ...` dan `/src/App.tsx` memberi HTTP 200 JavaScript | Preview masih Vite/dev server; source modul tidak boleh dijadikan deployment publik. |
| Rahasia | Pencarian kode klien tidak menemukan token ingest, URL database, atau kredensial S3 | Presign S3 dan token Forge berada pada kode server. |
| Kontrak data | Ingest memanggil `storagePutExact` dan export memakai `snapshot.storageKey` sebagai nama entri | Struktur `camera_id/YYYY-MM-DD/timestamp.jpg` dipertahankan dari ingest hingga ZIP. |

## Perbaikan Selama Evaluasi

1. Menambahkan fallback URL tak dikenal ke Overview beserta regresi.
2. Menambahkan batas waktu CONNECTING HLS 15 detik, error yang dapat ditindaklanjuti, dan sambung ulang.
3. Mengubah `lang` dokumen menjadi `id`, menambahkan `aria-current` pada navigasi, serta `aria-pressed` dan label pada pemilih interval/toggle capture.
4. Membuka query snapshot untuk Guest sesuai kontrak baca-publik, sementara semua mutasi tetap memakai prosedur admin.
