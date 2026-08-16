# Checklist Pra-Rilis ATCS Vision Dataset

Dokumen ini mencatat verifikasi aplikasi sebelum aktivasi capture produksi. Validasi dilakukan pada 16 Agustus 2026 dalam sesi pratinjau aplikasi terautentikasi dan melalui suite pengujian proyek.

| Area | Status | Bukti verifikasi |
| --- | --- | --- |
| Overview | Lulus | Halaman memuat ringkasan 29 kamera, jumlah snapshot, storage, status pipeline, seri harian, dan error log. |
| Camera registry | Lulus | Halaman menampilkan tepat 29 kamera, zona, URL sumber, status capture terakhir, dan navigasi detail. |
| Camera detail & HLS | Lulus | Detail `rancabango-bantar` menampilkan state connecting, URL HLS, interval per kamera, kontrol aktif, metadata snapshot, dan tombol simpan. Unit test memverifikasi fallback HLS. |
| Akses admin | Lulus | Kontrol konfigurasi tampil pada state admin. Test router memastikan role non-admin menerima `FORBIDDEN` sebelum perubahan konfigurasi. |
| Dataset gallery | Lulus | Filter kamera/tanggal/waktu dan empat metadata snapshot produksi termuat pada galeri. |
| ZIP export | Lulus | Halaman Exports menghitung empat file (219,4 KB) dan tombol unduh tersedia. Test endpoint memverifikasi respons ZIP streaming untuk snapshot terpilih. |
| Filter server-side | Lulus | Test `listSnapshots` memverifikasi kamera, `from`, `to`, limit, tanpa filter, dan kombinasi parsial. |
| Error sumber kamera | Lulus | Registry dan Overview memperlihatkan status `Gagal`/`Menunggu` per kamera serta error log ketika segmen HLS sumber tidak dapat diproses. |
| State kosong/loading | Lulus | Komponen galeri, ekspor, dan HLS memiliki state eksplisit yang dicakup oleh implementasi dan test terkait. |

## Batasan Sebelum Aktivasi Produksi

Capture otomatis tetap **standby**. Aktivasi memerlukan koneksi ke host `karya-1`, pemasangan service systemd, verifikasi pemulihan setelah reboot, serta persetujuan eksplisit untuk menjalankan pengambilan snapshot berulang. Kegagalan kamera akibat segmen HLS publik yang tidak tersedia diperlakukan sebagai status sumber dan dicatat per kamera; kegagalan tersebut tidak mengubah konfigurasi kamera lain.

## Catatan Sesi Verifikasi

Sesi browser yang tersedia saat validasi lanjutan tidak memiliki cookie autentikasi dan takeover browser tidak tersedia. Oleh karena itu, verifikasi interaktif dalam sesi admin nyata serta pengujian state kosong/error melalui navigasi autentikasi belum dapat diklaim selesai. Screenshot pratinjau dan pengujian unit tetap menjadi bukti validasi non-auth; dua item tersebut sengaja tetap tertunda pada `todo.md` sampai sesi login admin tersedia.

Capture produksi tidak diaktifkan selama keterbatasan ini.
