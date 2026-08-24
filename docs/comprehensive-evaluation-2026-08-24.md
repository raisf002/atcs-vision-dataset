# Evaluasi Komprehensif — ATCS / Vision Dataset Workspace

**Tanggal evaluasi:** 24 Agustus 2026  
**Lingkup:** Preview Manus, audit baca-saja dan regresi lokal  
**Batasan penting:** Audit ini tidak mengubah konfigurasi kamera, interval capture, jadwal, record snapshot, ataupun melakukan akses ke VPS `karya-1`.

## Ringkasan eksekutif

ATCS Vision Dataset sudah menjadi **workspace pengumpulan dataset dan operasi CCTV yang fungsional**, bukan sekadar prototipe antarmuka. Registry memuat 29 kamera, capture historis tersimpan sebagai 23 snapshot, Gallery dan Command Center dapat dibaca Guest, sedangkan perubahan operasional tetap dibatasi admin. Dua defect yang paling terlihat pada awal audit—URL evaluasi terenkode yang menghasilkan 404 dan live HLS yang dapat berhenti di `CONNECTING`—telah diperbaiki serta dilindungi regresi.

Nilai keseluruhan saat ini adalah **7,4/10**. Aplikasi siap untuk evaluasi internal, pengumpulan dataset manual/terkendali, serta penyiapan tahap anotasi. Aplikasi belum boleh diperlakukan sebagai deployment produksi publik sampai runtime dipindah dari dev server ke build produksi dan kesiapan data training (anotasi, split, dan manifest) dilengkapi.

| Aspek | Skor | Penilaian singkat |
| --- | ---: | --- |
| Fungsionalitas | **8,2/10** | Alur inti tersedia dan sebagian besar teruji otomatis. |
| UI/UX | **7,6/10** | Command Center khas; halaman terang masih belum sepenuhnya konsisten. |
| Performa | **6,5/10** | TTFB lokal baik, tetapi preview masih dev dan bundle utama besar. |
| Aksesibilitas | **7,8/10** | Perbaikan semantik utama diterapkan; audit kontras formal belum dilakukan. |
| Robustness | **7,7/10** | HLS memiliki timeout/retry; ketersediaan sumber eksternal tetap fluktuatif. |
| Keamanan | **6,4/10** | Mutasi terproteksi dan rahasia server-side; dev server tidak layak publik. |
| Kualitas data & kesiapan training | **6,8/10** | Kontrak penyimpanan kuat, tetapi anotasi/split/manifest belum ada. |
| Dokumentasi & handover | **7,7/10** | README dan handover operasi tersedia; VPS production-run belum divalidasi. |

> **Kesimpulan:** Fitur aplikasi dan kontrol admin/Guest cukup matang untuk tahap pengumpulan serta peninjauan dataset. Risiko terbesar bukan pada alur UI, melainkan pada runtime deployment dan kelengkapan artefak dataset untuk training.

## Metode dan bukti

Evaluasi memadukan inspeksi implementasi, regresi, build produksi, pemanggilan HTTP tanpa sesi, dan pemeriksaan visual. Halaman yang diambil pada preview mencakup `/`, `/cameras`, `/cameras/jati`, `/dataset`, `/exports`, `/command-center`, dan `/settings`. Pengambilan ulang juga membuktikan URL yang tidak dikenal/terenkode masuk ke Overview, bukan 404 mentah.

| Bukti | Hasil | Interpretasi |
| --- | --- | --- |
| Suite otomatis | **39 file / 101 test lulus** | Kontrak router, Guest, HLS, Gallery, ZIP, counting, dan worker tercakup regresi. |
| TypeScript | `pnpm check` lulus | Tidak ada error tipe pada build terakhir. |
| Build | `pnpm build` lulus | Artefak `dist/` siap dijalankan oleh runtime produksi. |
| ZIP | Signature PK dan `unzip -t` lulus | Arsip hasil endpoint admin valid dan dapat diekstrak. |
| Query Guest | `dataset.snapshots` tanpa cookie mengembalikan HTTP 200 | Metadata Gallery sesuai kontrak baca-publik. |
| Thumbnail nyata | Redirect storage 307 diikuti JPEG valid 704×576, 90.840 byte | Thumbnail dapat dibaca melalui kontrak storage. |
| Rute fallback | Pengambilan layar URL terenkode mengarah ke Overview | Defect 404 awal tidak berulang. |

## 1. Fungsionalitas — 8,2/10

Dashboard menampilkan 29 kamera, 23 snapshot, dan sekitar 1,7 MB storage pada saat pemeriksaan visual. Ringkasan kesehatan menunjukkan 19 capture berhasil, catatan gangguan HLS, dan status menunggu sesuai metadata saat itu. Registry kamera mendukung pencarian dan filter zona/kesehatan; konfigurasi dan toggle adalah tindakan admin yang tidak disentuh selama audit.

Detail CCTV menyediakan live HLS, diagnostik, konfigurasi interval 1/5/10/15 menit, dan ringkasan pipeline. Gallery mengembalikan 23 metadata snapshot dan memperlihatkan kartu per kamera. Satu snapshot nyata dipanggil ulang secara HTTP, mengikuti redirect storage, dan tervalidasi sebagai JPEG 704×576. Filter Gallery dan filter waktu dilindungi test; penilaian ini tidak melakukan perubahan filter yang memutasi data.

| Alur | Hasil audit | Status |
| --- | --- | --- |
| Overview dan health | 29 kamera, 23 snapshot, statistik dan error log tampil. | Lulus |
| Camera Registry | Search/filter/status dan tautan detail memiliki regresi. | Lulus (read-only) |
| Detail kamera | Fallback HLS, interval, dan state diagnostik diuji; perubahan tidak dieksekusi. | Lulus terbatas |
| Dataset Gallery | Query publik, 23 kartu, dan satu JPEG nyata tervalidasi. | Lulus |
| Export ZIP | Preview muncul; ZIP admin divalidasi dengan `unzip -t`. | Lulus melalui test terisolasi |
| Command Center | Leaflet Earth/Jalan, 29 marker, konsol, registry model, dan counting line tersedia. | Lulus |
| Guest | Baca dashboard/registry/gallery/Command Center; mutasi admin-only ditolak. | Lulus |

Catatan: tombol **Ekspor pilihan** pada Gallery saat ini masih memberi informasi alur, sedangkan download ZIP operasional berada pada halaman Exports dan endpoint admin. Penyelarasan CTA ini adalah perbaikan UX minor agar tidak menyiratkan ekspor langsung dari setiap filter Gallery.

## 2. UI/UX — 7,6/10

Command Center memiliki identitas operasi lalu lintas yang jelas: basemap Earth, marker CCTV, panel gelap, dan konsol kamera menciptakan fokus yang tepat untuk tugas monitoring. Halaman Overview, Gallery, Exports, serta Settings bersih dan mudah dipindai dengan sidebar tetap serta state loading, empty, error, dan retry yang eksplisit.

Konsistensi masih dapat ditingkatkan. Halaman terang menggunakan pola dashboard SaaS generik yang berbeda atmosfernya dari Command Center. Selain itu, beberapa label navigasi masih campuran Indonesia–Inggris, seperti *Camera registry*, *Dataset gallery*, dan *Exports*. Disarankan menetapkan satu kamus UI Indonesia untuk nama menu, state, dan CTA.

## 3. Performa — 6,5/10

Baseline lokal terhadap HTML utama pada tujuh rute menghasilkan TTFB sekitar **5,8–11,9 ms**. Angka tersebut hanya mengukur server lokal; angka ini bukan LCP/FCP browser dan tidak memasukkan request database, image redirect, tile peta, atau pemutaran HLS.

Temuan pentingnya adalah preview aktif masih menjalankan `NODE_ENV=development tsx watch server/_core/index.ts`. Dalam mode ini, modul seperti `/src/App.tsx` dapat diakses sebagai JavaScript publik untuk hot reload. Build produksi berhasil dan menyediakan `dist/index.js`, tetapi bundle JavaScript klien berukuran **1,71 MB** atau **476 KB gzip**, sehingga Vite memberi peringatan chunk lebih besar dari 500 KB sebelum gzip.

| Item | Status | Dampak |
| --- | --- | --- |
| TTFB server lokal | 5,8–11,9 ms | Positif, tetapi bukan ukuran UX pengguna akhir. |
| Runtime preview | Dev server | Risiko keamanan dan performa jika dipublikasikan. |
| Build produksi | Berhasil | Menyediakan jalur aman: `pnpm build` lalu `NODE_ENV=production pnpm start`. |
| Bundle utama | 1,71 MB / 476 KB gzip | Perlu lazy-loading/manual chunks untuk koneksi seluler. |

## 4. Aksesibilitas — 7,8/10

Audit memperbaiki `lang` dokumen dari `en` ke **`id`**, menambahkan `aria-current="page"` pada navigasi sidebar aktif, dan `aria-pressed` plus label pada pemilih interval/toggle capture. Gallery dan Exports sudah memiliki pengumuman status loading, error, serta validasi filter. Form utama memakai label visual atau label `sr-only` yang dapat dibaca pembaca layar.

Masih diperlukan audit kontras berbasis alat formal, uji keyboard lintas halaman, dan pemeriksaan mobile dengan pembaca layar. Kontrol peta Leaflet dan overlay counting line khususnya perlu uji keyboard terpisah karena interaksi utamanya berbasis pointer.

## 5. Robustness — 7,7/10

Live HLS sekarang memiliki batas waktu CONNECTING **15 detik**. Ketika pemutaran tidak dimulai, status berpindah ke pesan error yang menjelaskan kemungkinan gangguan sumber dan menyediakan aksi **Coba sambungkan ulang**. Pemutar mempertahankan fallback hls.js/native dan jalur pemulihan media. Regresi mencakup geometri video, pesan HLS, dan timeout.

Gangguan pada sumber ATCS tetap berada di luar kendali aplikasi. Uji batch manual historis berhasil meng-ingest 19 dari 29 kamera, sementara 10 sumber mencatat kegagalan HLS transien pada putaran tersebut. Ini tidak berarti kamera permanen rusak; pesan sekarang membedakan `HLS_TRANSIENT` dari masalah pipeline/ingest sehingga operator dapat mencoba ulang tanpa mengubah konfigurasi.

## 6. Keamanan — 6,4/10

Mutasi penting—konfigurasi kamera, capture, simpan counting line, unggah model, serta ZIP—dibatasi di server melalui prosedur admin. Guest memperoleh data baca yang diperlukan untuk dashboard, Gallery, dan Command Center; test router membuktikan Guest dapat membaca snapshots tetapi update kamera ditolak `FORBIDDEN`.

Kredensial Forge/S3 dan token ingest tidak ditemukan pada `client/src` atau `client/index.html`. Akses objek dijembatani server melalui `/manus-storage/{key}`, yang menerbitkan redirect sementara ke storage. Namun, saat Gallery metadata dibuka untuk Guest, key dan gambar terkait praktis dapat dilihat publik sesuai desain produk. Sebelum publik luas, tetapkan kebijakan retensi, privasi, dan akses untuk footage CCTV.

> **Gate produksi:** Jangan mengekspos Vite/dev server ke internet. Jalankan hasil build produksi dan verifikasi kembali endpoint serta cookie admin pada runtime tersebut.

## 7. Kualitas data dan kesiapan training — 6,8/10

Kontrak storage `camera_id/YYYY-MM-DD/timestamp.jpg` dipertahankan oleh `storagePutExact`, metadata snapshot, dan entry ZIP. Contoh nyata `simpang-lima/2026-08-19/2026-08-19T07-48-46-223Z.jpg` dapat diunduh sebagai JPEG valid. Filter ekspor diteruskan melalui query URL dan ZIP menggunakan `storageKey` sebagai path arsip; namun, sistem belum menyimpan catatan audit ekspor yang persisten.

Struktur gambar sudah cocok sebagai dasar organisasi YOLO, tetapi belum cukup untuk training. Belum ada file label `.txt`, pasangan `images/`–`labels/`, split train/val/test, `dataset.yaml`, klasifikasi kualitas frame, atau versi dataset/manifest. Karena itu, aplikasi **siap mengumpulkan bahan anotasi**, bukan siap menjalankan training YOLO end-to-end.

| Kebutuhan training | Status | Prioritas |
| --- | --- | --- |
| Key kamera/tanggal/timestamp | Ada | Pertahankan |
| Metadata resolusi dan timestamp | Ada | Pertahankan |
| Label YOLO per gambar | Belum ada | Major |
| Train/val/test split deterministik | Belum ada | Major |
| `dataset.yaml` dan class map | Belum ada | Major |
| Manifest/versioning/quality gate | Belum ada | Major |
| Audit export persisten | Belum ada | Minor–major, tergantung governance |

## 8. Dokumentasi dan handover — 7,7/10

README proyek baru menjelaskan arsitektur, perintah development/production, kontrak dataset, peran Guest/admin, worker, dan taxonomy error. Dokumen `worker/README.md`, `docs/deployment-handoff.md`, serta `docs/manual-capture-test-2026-08-19.md` memberi dasar handover untuk VPS. Ketidakkonsistenan kecil nilai retry worker diperbaiki dalam pedoman terbaru: default/max worker adalah empat percobaan.

Hal yang belum tervalidasi adalah runbook produksi aktual pada `karya-1`, restart/reboot service, dan end-to-end browser dengan sesi admin nyata di target VPS. Hal tersebut tetap tertunda sesuai batasan audit.

## Temuan prioritas

| Prioritas | Temuan | Dampak | Tindakan |
| --- | --- | --- | --- |
| **Critical / production gate** | Preview masih dev server dan melayani modul sumber. | Source exposure, karakteristik runtime non-produksi. | Build `dist`, jalankan `NODE_ENV=production pnpm start`, lalu verifikasi ulang. |
| **Major** | Dataset belum memiliki anotasi, split, YAML, dan manifest versi. | Belum layak training YOLO reproduktif. | Buat pipeline anotasi dan packaging dataset. |
| **Major** | 10 sumber HLS mengalami gangguan transien pada batch historis. | Kelengkapan dataset tidak konsisten. | Monitor reliabilitas per kamera, retry terjadwal setelah VPS tervalidasi. |
| **Major** | Bundle klien utama 476 KB gzip. | Load awal lebih lambat di jaringan seluler. | Lazy-load Command Center/Leaflet/HLS dan pecah chunk. |
| **Minor** | Terminologi UI campuran. | Kualitas lokalitas dan konsistensi menurun. | Standarkan kamus UI Indonesia. |
| **Minor** | CTA ekspor pada Gallery belum melakukan unduh. | Ekspektasi pengguna dapat keliru. | Arahkan CTA ke Exports sambil membawa filter atau implementasikan alur admin eksplisit. |

## Perbaikan cepat yang telah dikerjakan dalam audit

| Perbaikan | Dampak yang diharapkan |
| --- | --- |
| Fallback rute tak dikenal ke Overview | Menghilangkan 404 mentah pada URL evaluasi yang terenkode. |
| Timeout HLS 15 detik + retry/fallback | Mengubah kondisi CONNECTING tidak terbatas menjadi error yang dapat ditindaklanjuti. |
| `lang=id`, `aria-current`, `aria-pressed` | Memperbaiki navigasi pembaca layar dan status kontrol. |
| Snapshot query Guest publik; mutasi tetap admin-only | Gallery dapat dibaca publik sesuai peran tanpa membuka perubahan data. |
| README operasi | Memudahkan handover development, worker, deployment, dan taxonomy error. |

## Rekomendasi tahap berikutnya dan estimasi dampak

| Tahap | Rekomendasi | Estimasi dampak |
| --- | --- | --- |
| P0 | Beralih ke runtime production build dan menguji domain production. | Menghilangkan risiko dev source publik; meningkatkan reliabilitas operasional. |
| P1 | Tambahkan lazy loading untuk Leaflet, HLS, dan Command Center. | Potensi memperkecil JS awal secara material dan mempercepat interaksi awal. |
| P1 | Rancang modul anotasi + split + `dataset.yaml` + manifest. | Mengubah koleksi gambar menjadi dataset training yang reproducible. |
| P1 | Tambahkan metrik availability HLS dan alert per kamera. | Mempercepat penanganan sumber yang menurunkan coverage data. |
| P2 | Standarkan bahasa UI dan arahkan CTA export Gallery ke alur yang tepat. | Mengurangi kebingungan operator. |
| P2 | Tambahkan audit log ekspor dan kebijakan retensi/akses CCTV. | Meningkatkan traceability dan governance. |

## Batasan evaluasi

Audit tidak melakukan perubahan konfigurasi/data, tidak memulai worker atau scheduler, tidak mengakses VPS `karya-1`, dan tidak menjalankan ZIP dari sesi browser admin yang interaktif. Bukti ZIP berasal dari endpoint terisolasi dengan signature dan ekstraksi valid. HLS adalah sumber eksternal yang dapat berubah antar waktu; hasil batch historis bukan jaminan availability saat ini. Screenshot pada preview menggunakan sesi admin tersimpan, sedangkan kontrak Guest dipastikan melalui request tanpa cookie dan test router.

## Referensi internal

[1]: ../README.md "README operasi proyek"  
[2]: ../worker/README.md "Panduan worker capture"  
[3]: ./manual-capture-test-2026-08-19.md "Hasil batch capture manual"  
[4]: ./deployment-handoff.md "Handover deployment"  
[5]: ./evaluation-notes.md "Catatan bukti audit teknis"
