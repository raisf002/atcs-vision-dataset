# Penilaian Awal Sumber CCTV ATCS Tasikmalaya

Tanggal pemeriksaan: 16 Agustus 2026 (WIB).

Halaman publik `https://atcs.tasikmalayakota.go.id/#live` menampilkan tepat **29** item CCTV pada dua kelompok: 20 kamera Jalan Kota dan 9 kamera Jalan Nasional. Saat satu item kamera dipilih, halaman membuka dialog live streaming untuk kamera tersebut.

Temuan ini mengonfirmasi jumlah entri yang diperlukan oleh aplikasi. Dialog pemutar menggunakan elemen video HTML5 dengan URL `blob:` di sisi browser. Pemeriksaan permintaan jaringan menunjukkan bahwa kamera contoh memuat stream **HLS** melalui `https://atcs.tasikmalayakota.go.id/camera/rancabangoptz.m3u8`.

Konsekuensinya, URL stream bukan JPEG langsung. Untuk menghasilkan snapshot yang benar, proses capture harus mengekstrak satu frame dari HLS atau menggunakan endpoint snapshot resmi apabila tersedia. Aplikasi akan tetap menyimpan metadata sumber secara konfigurabel per kamera dan tidak akan mengasumsikan pola URL tanpa verifikasi untuk semua kamera.

Sumber: halaman live streaming ATCS Kota Tasikmalaya (diakses 16 Agustus 2026).
