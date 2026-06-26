# Buku Besar Pengembangan (Changelog)

Catatan kronologis semua perubahan, penambahan fitur, dan pemeliharaan pada sistem aplikasi **Razmel's Property**. Semua log modifikasi akan dicatat di sini secara permanen.

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
- **Docker Port & AppArmor Bug**: Mengatasi masalah kontainer nyangkut (*zombie process*) akibat OS menolak perintah penghentian (*permission denied*). Solusinya dengan membersihkan *AppArmor*, melakukan `kill -9` paksa pada PID Docker, dan memigrasikan aplikasi ke Port **3001** (bebas hambatan).
- **Git Merge Conflict di VPS**: Membersihkan sisa file yang diedit manual di VPS (`git reset --hard`) yang sebelumnya diam-diam memblokir skrip penarikan kode terbaru dari GitHub.
- **Google Fonts Timeout**: Mendokumentasikan dan memulihkan insiden di mana proses `npm run build` gagal akibat koneksi internal Docker ke *Google Fonts* terputus.
- **Pengurutan Daftar Penghuni**: Menambahkan *multi-level sorting* pada halaman Daftar Penghuni sehingga penghuni dengan status **Aktif** selalu muncul di urutan atas, disusul dengan penghuni **Tidak Aktif** di bawahnya.

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
