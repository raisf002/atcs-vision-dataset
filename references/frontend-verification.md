# Verifikasi Front End

Tanggal verifikasi: 16 Agustus 2026 (WIB).

Lima rute utama telah diperiksa pada desktop dan lebar seluler: overview, camera registry, dataset gallery, exports, serta settings. Navigasi berfungsi antar-rute, layar kecil menggunakan header ringkas, formulir tersusun menjadi satu kolom, dan tabel registri tetap dapat digeser secara horizontal untuk menjaga seluruh informasi kamera tetap tersedia.

Elemen antarmuka yang telah diverifikasi mencakup registry tepat 29 kamera, filter tampilan kamera, status sumber dan capture, opsi interval 1/5/10/15 menit, galeri zero-state, formulir ekspor ZIP, kontrak key penyimpanan, serta kartu statistik. Seluruh nilai snapshot dan penyimpanan saat ini dinyatakan nol karena pipeline produksi belum dihubungkan.

Pembaruan berikutnya menambahkan rute detail per CCTV. Pada desktop dan seluler, kamera `rancabango-bantar` serta `simpang-lima` membuka pemutar HLS, status koneksi live, kartu ringkasan dataset, URL sumber individual, pilihan interval khusus kamera, kontrol aktif/nonaktif, dan kontrak key snapshot. Kedua layar mempertahankan susunan satu kolom yang dapat dibaca pada lebar 390 px.

Kontrol `Mulai live` juga sudah tersedia di pratinjau browser untuk memberikan jalur eksplisit saat autoplay dibatasi. Pemutar akan menampilkan status koneksi atau error yang dapat dibaca, sehingga kegagalan stream tidak disamarkan sebagai snapshot atau video palsu.

Pada pemeriksaan pratinjau awal, stream Rancabango masih berada pada status `CONNECTING`; tidak ada error konsol yang dicatat. Pemutar kemudian disesuaikan agar memprioritaskan pemroses HLS lintas-peramban daripada kemampuan native yang tidak konsisten. Pengujian live akhir tetap harus dilakukan setelah halaman terpublikasi, karena browser pratinjau dapat menerapkan kebijakan jaringan yang berbeda dari domain produksi.

Uji interaksi berikutnya berhasil menampilkan live view `Simpang Rancabango Arah Simpang Bantar`. Interval khusus 10 menit dipilih dan disimpan sebagai draf kamera; aplikasi menampilkan notifikasi yang membedakan draf peramban dari konfigurasi admin tersimpan. Tidak ada gambar dataset dibuat atau capture otomatis diaktifkan selama pengujian UI ini.

State error juga diverifikasi dengan URL HLS tidak valid sementara: pemutar berubah dari `CONNECTING` ke `STREAM ERROR` dan menampilkan pesan pemulihan yang jelas tanpa merusak panel konfigurasi. URL uji ini hanya ada di state browser dan tidak disimpan sebagai konfigurasi produksi.

State sumber kosong juga diverifikasi. Setelah URL dikosongkan, header berubah menjadi `NO SOURCE` dan pemutar menampilkan pesan bahwa URL belum dikonfigurasi; status koneksi yang menyesatkan tidak lagi muncul.
