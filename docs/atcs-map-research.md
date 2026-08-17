# Temuan awal pemetaan ATCS Tasikmalaya

Sumber utama: https://atcs.tasikmalayakota.go.id/#live

Tanggal pengamatan: 2026-08-17.

Halaman publik ATCS menampilkan dua kelompok live streaming: Jalan Kota (20 kamera) dan Jalan Nasional (9 kamera). Daftar nama kamera yang terlihat mencakup Simpang Cimulu, Simpang Rancabango, Simpang Dewi Sartika, Simpang Masjid Agung, Simpang Nagarawangi, Simpang Alun-alun, Simpang Sutisna Senjaya, Simpang Gunung Sabeulah, Simpang Pataruman PTZ/FIX, Simpang Panyerutan PTZ/FIX, Simpang Paseh, Simpang Padayungan, Simpang Rumah Sakit, Batas Kota, Wasita Kusuma, Bojong Jengkol, Simpang Jati, Simpang Mitra Batik, Simpang Lima, dan Ruas M. Hatta.

Halaman juga menampilkan peta Leaflet dengan kontrol zoom (+/-) dan atribusi OpenStreetMap. Dari teks yang diekstrak belum terlihat koordinat per kamera atau tabel latitude/longitude. Tautan navigasi `Lokasi` tampak tersedia, sehingga halaman tersebut perlu diperiksa sebagai sumber pemetaan utama. Koordinat tidak boleh dibuat atau diperkirakan tanpa sumber yang dapat diverifikasi.

Kontak yang tampil di halaman: Jl. Ir. H. Juanda No. 191, Kelurahan Bantarsari, Kecamatan Bungursari, Kota Tasikmalaya, Jawa Barat 46151; email atcs.tasikmalayakota@gmail.com.

Temuan sementara: aplikasi saat ini hanya memiliki registry nama/URL/status tanpa kolom koordinat. Integrasi peta perlu memisahkan koordinat `verified` dari marker `unverified`, dan hanya mengisi titik kamera bila ditemukan dari halaman Lokasi, data Leaflet, atau sumber publik resmi lain.

## Halaman Lokasi

URL: https://atcs.tasikmalayakota.go.id/#lokasi

Halaman Lokasi resmi menampilkan peta Leaflet dengan basemap OpenStreetMap dan marker/pop-up bernama kamera, termasuk Simpang Jati, Simpang Mitra Batik, Simpang Lima, Ruas M. Hatta, Simpang Cimulu, Simpang Dewi Sartika Arah Cimulu, Simpang Panyerutan FIX, Simpang Nagarawangi, Simpang Padayungan, serta lainnya. Visual peta menunjukkan marker kamera memang tersedia di situs resmi.

DOM yang terlihat memuat elemen `div#map`, kontrol zoom, kontrol fullscreen, layer control, dan marker dengan popup nama kamera. Halaman HTML tersimpan sementara di `/home/ubuntu/upload/atcs.tasikmalayakota.go.id__lokasi_1786936370996.html` untuk analisis aset/script. Pemetaan resmi ini menjadi sumber koordinat yang lebih tepercaya daripada memperkirakan titik berdasarkan nama jalan.

Langkah berikutnya adalah mengekstrak data konfigurasi Leaflet dari HTML/script atau network asset publik. Jika data marker mengandung latitude/longitude, koordinat akan dipetakan ke 29 kamera dengan status `verified` dan provenance URL resmi. Jika hanya terdapat posisi visual tanpa angka koordinat yang dapat diekstrak, implementasi harus menampilkan peta dengan status lokasi belum terverifikasi dan tidak menyimpan koordinat rekaan.
