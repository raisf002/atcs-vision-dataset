# Batas Deployment dan Handoff VPS

## Status Manus

Aplikasi ATCS Vision Dataset diselesaikan serta divalidasi di lingkungan Manus. Ruang lingkup saat ini mencakup registri 29 kamera, konfigurasi individual, pemutar HLS, metadata snapshot S3, Galeri Dataset dengan anotasi YOLO, statistik harian, availability HLS tujuh hari, pemantauan error, ekspor ZIP mentah/siap-training, audit ekspor persisten, dan kebijakan retensi tersimpan. Capture otomatis tetap berada pada status **standby**.

Validasi lokal terakhir mencatat **41 file test / 111 test lulus**, TypeScript bersih, serta build produksi berhasil. Runtime `NODE_ENV=production` diuji pada port terpisah untuk tujuh rute utama. Permintaan `/src/App.tsx` pada runtime tersebut menerima fallback HTML dan tidak menyajikan source `.tsx`. Statistik harian menggunakan ekspresi `DATE(capturedAt)` beralias untuk kompatibilitas dengan mode SQL `only_full_group_by`, dengan fallback agregasi UTC sebagai perlindungan tambahan apabila database menolak ekspresi SQL tersebut.

## Kontrak Runtime Produksi

Jangan mengekspos `pnpm dev`, `tsx watch`, atau Vite dev server ke domain publik. Jalankan artefak yang dibangun sebagai berikut setelah secret dan database tersedia.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
PORT=3000 NODE_ENV=production pnpm start
```

Rute SPA `/`, `/cameras`, `/cameras/:id`, `/dataset`, `/exports`, `/command-center`, dan `/settings` harus diverifikasi sesudah proxy dikonfigurasi. Code splitting memisahkan Command Center/Leaflet dan `hls.js` dari layar awal; cache asset statis dapat dikelola oleh reverse proxy, tetapi respons API, sesi, dan ZIP harus tetap `no-store`.

## Dataset Training dan Governance

Mode siap-training hanya menggunakan anotasi YOLO berstatus disetujui. Arsip menghasilkan `images/{train,val,test}`, `labels/{train,val,test}`, `dataset.yaml`, `class-map.json`, dan `manifest.json`; snapshot sumber tidak pernah dipindah atau diubah. Quality gate mengecualikan JPEG tidak terbaca, blur, duplikat byte-identik, dan label tidak valid. Audit ekspor menyimpan aktor, waktu, filter, mode, jumlah file, status, dan quality summary dalam `datasetExports`.

Kebijakan retensi hanya menyimpan `retentionDays` dan `retentionEnabled`. Fitur ini **tidak** menjalankan cleanup, tidak menghapus snapshot, dan tidak mendaftarkan scheduler. Jika cleanup akan diaktifkan di masa depan, buat desain job terpisah yang mencakup dry-run, backup, audit, batas hapus per batch, dan persetujuan eksplisit pemilik sebelum service/timer diaktifkan.

## Tahap Deployment Berikutnya

Atas arahan pengguna, tidak ada akses, pemasangan, reboot, atau aktivasi service yang dilakukan pada `karya-1` selama tahap Manus. Pekerjaan berikut dipindahkan secara eksplisit ke tahap deployment VPS berikutnya: penerapan migrasi skema versi `0006_milky_ronan.sql`, pemasangan service dan timer systemd, pengujian pemulihan setelah reboot, uji batch produksi 29 kamera, serta pengaktifan capture terjadwal setelah sumber HLS dan metadata dinyatakan siap.

> Rahasia worker tetap berada di sisi server. Tidak ada kredensial S3 atau ingest yang dimasukkan ke klien selama tahap pengembangan Manus.
