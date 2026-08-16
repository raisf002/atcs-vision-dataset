# Batas Deployment dan Handoff VPS

## Status Manus

Aplikasi ATCS Vision Dataset diselesaikan serta divalidasi di lingkungan Manus. Ruang lingkup saat ini mencakup registri 29 kamera, konfigurasi individual, pemutar HLS, metadata snapshot S3, galeri dan filter dataset, statistik harian, pemantauan error, serta ekspor ZIP. Capture otomatis tetap berada pada status **standby**.

Validasi lokal membuktikan alur aplikasi melalui pengujian unit dan integrasi. Statistik harian menggunakan ekspresi `DATE(capturedAt)` beralias untuk kompatibilitas dengan mode SQL `only_full_group_by`, dengan fallback agregasi UTC sebagai perlindungan tambahan apabila database menolak ekspresi SQL tersebut.

## Tahap Deployment Berikutnya

Atas arahan pengguna, tidak ada akses, pemasangan, reboot, atau aktivasi service yang dilakukan pada `karya-1` selama tahap Manus. Pekerjaan berikut dipindahkan secara eksplisit ke tahap deployment VPS berikutnya: pemasangan service dan timer systemd, pengujian pemulihan setelah reboot, uji batch produksi 29 kamera, serta pengaktifan capture terjadwal setelah sumber HLS dan metadata dinyatakan siap.

> Rahasia worker tetap berada di sisi server. Tidak ada kredensial S3 atau ingest yang dimasukkan ke klien selama tahap pengembangan Manus.
