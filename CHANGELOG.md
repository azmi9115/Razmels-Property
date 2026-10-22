# Buku Besar Pengembangan (Changelog)

Catatan kronologis semua perubahan, penambahan fitur, dan pemeliharaan pada sistem aplikasi **Razmel's Property**. Semua log modifikasi akan dicatat di sini secara permanen.

---

## 📅 Kamis, 22 Oktober 2026
**Status:** Monitoring Sewa disamakan dengan Excel

### 🔧 Diubah (Changed)
- **Monitoring Sewa** kini memakai aturan sheet "Monitoring Sewa" di `Master Data Kontrakan.xlsm`: batas bayar **tanggal 7 setiap bulan untuk semua unit** (bukan lagi tanggal masuk + 7 hari). Tiap pembayaran dipetakan ke bulan periodenya (bulan akhir sewa − durasi); transfer ≤ tgl 7 → Tepat, lewat → Telat, bulan berjalan tanpa pembayaran → Belum bayar.

---

## 📅 Selasa, 13 Oktober 2026
**Status:** Rombak total UI (branch `ui-overhaul`)

### ✨ Ditambahkan (Added)
- **Sistem desain baru** berbasis warna logo (navy + hijau), font Plus Jakarta Sans, dan **dark mode** (tombol di topbar).
- **Pencarian cepat Ctrl+K**: lompat ke menu atau langsung cari penghuni/pembayaran.
- **Dashboard baru**: kartu saldo kas, cincin okupansi, daftar "Perlu ditagih" dengan tombol pengingat WhatsApp, grafik arus kas, dan rincian kategori.
- **Penghuni**: tab filter (telat, jatuh tempo ≤ 7 hari, aktif, keluar) dan tampilan kartu di HP.
- **Bangunan & Kamar**: kartu per blok seperti peta unit.
- **Monitoring**: heatmap dengan ikon dan skor ketepatan bayar per penghuni.
- **Landing page** baru dengan peta unit & ketersediaan yang diambil langsung dari database (tanpa data penghuni).

### 🔄 Diubah (Changed)
- Login berbahasa Indonesia, tombol lihat password berfungsi, elemen palsu dihapus.
- Grafik margin tidak lagi dual-axis; pie chart diganti bar list.
- Format Rupiah & tanggal diseragamkan (tanpa desimal, "Rp 12,9 jt" di grafik).
- Kuitansi dicetak dengan desain baru dan stempel LUNAS.

### 🛠️ Diperbaiki (Fixed)
- Menu sidebar tidak lagi "lompat" saat halaman dibuka (role dibaca di server).
- Angka palsu "+4.3% dari bulan lalu" di dashboard diganti perhitungan asli.
- Font tidak lagi diunduh dari Google saat build (mencegah build gagal di VPS).

---

## 📅 Rabu, 24 Juni 2026
**Status:** Penambahan Fitur & *Maintenance*

### ✨ Ditambahkan (Added)
- **Verifikasi Mutasi CSV (Beta)**: Menambahkan fitur semi-otomatis untuk mencocokkan pembayaran sewa menggunakan file CSV mutasi dari Bank BRI. Fitur ini dirilis sebagai fitur sekunder (Beta) berdampingan dengan tombol input manual.
- **Logika Algoritma (Heuristic Matching)**: Sistem kini memiliki kemampuan menganalisis nominal masuk dan berita transfer untuk mencocokkannya dengan daftar harga sewa dan nama penyewa secara cerdas.
- Menambahkan *library* `papaparse` untuk membaca data CSV secara instan dan aman di dalam *browser* tanpa mengirim data mentah ke server.
- Menambahkan *Buku Besar Pengembangan* (`CHANGELOG.md`) ini sebagai rekam jejak evolusi aplikasi.

### 🔄 Diubah (Changed)
- **Keamanan Privasi UI**: Mengubah teks *placeholder* di halaman Login dari `admin@razmels.com` menjadi `nama@email.com` agar email administrator tidak terlihat oleh sembarang orang.

### 🛠️ Diperbaiki (Fixed)
- **Deployment & Server**: Mengubah skrip `update.sh` di VPS dari versi lawas `docker-compose` menjadi versi modern `docker compose` (V2). Ini memperbaiki *error fatal* `KeyError: 'ContainerConfig'` yang sering membuat VPS mogok dan gagal meng-*update* aplikasi.

---

## 📅 Sebelum 24 Juni 2026
**Status:** Rilis Awal (Initial Release)

### ✨ Ditambahkan (Added)
- Inisialisasi awal proyek menggunakan fondasi Next.js, Prisma (ORM), dan *Database* SQLite.
- Integrasi antarmuka modern menggunakan TailwindCSS dan Shadcn UI.
- Sistem Autentikasi Admin (*Login/Logout*) menggunakan NextAuth.
- Manajemen Properti: Pembuatan profil Kamar dan Kios.
- Manajemen Penghuni: Pendaftaran penyewa baru, kontak darurat, dan jatuh tempo sewa.
- Manajemen Pembayaran: Pencatatan sewa manual dengan auto-kalkulasi jatuh tempo.
- Manajemen Keuangan: Buku Kas (*Cashflow*) untuk melacak pemasukan dan pengeluaran.
- Cetak Struk: Otomatisasi cetak kuitansi PDF (*Invoice*) pembayaran sewa.
