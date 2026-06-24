# Laporan Fitur: Verifikasi Mutasi Bank (CSV)

**Tanggal Laporan:** 24 Juni 2026
**Penulis:** Antigravity (AI Assistant)
**Status:** 🟡 **Uji Coba (BETA)** - Berjalan paralel dengan fitur manual (Secondary Feature).

---

## 1. Tujuan Fitur
Fitur ini diciptakan untuk menyelesaikan masalah klasik pengelolaan kos/kontrakan: **Mencocokkan bukti transfer penghuni dengan mutasi asli di rekening bank**. Daripada admin harus menatap layar *Internet Banking* berjam-jam untuk memverifikasi siapa yang sudah bayar dan siapa yang belum, fitur ini mengotomatiskan proses pencocokan tersebut secara massal dalam hitungan detik.

## 2. Cara Kerja (Algoritma Pencocokan Heuristik)
Sistem ini menggunakan logika "Pencocokan Cerdas" tanpa memerlukan AI generatif kelas berat, sehingga sangat cepat dan 100% berjalan secara lokal di *browser*:
1. **Parsing Lokal**: File CSV dari bank (misal: BRI) diunggah dan dibaca langsung di *browser* menggunakan *library* `papaparse`. Data rekening mentah sama sekali tidak dikirim ke server demi keamanan tingkat tinggi.
2. **Filter Uang Masuk**: Algoritma mengabaikan semua baris berformat "Tanggal" dan menyisir setiap angka dalam tabel.
3. **Pencocokan Nominal Spesifik**: Sistem akan mengambil data harga sewa (*Rent Price*) dari seluruh penghuni aktif di *database*. Karena sistem kosan menerapkan aturan **"Wajib Lunas"**, sistem hanya mencari nominal mutasi masuk yang besarnya **SAMA PERSIS** dengan harga sewa kamar penghuni (Misal: persis Rp 750.000 atau Rp 3.000.000).
4. **Pencocokan Nama (Fuzzy Match)**: Jika ada banyak penghuni dengan harga sewa yang sama (misal 5 orang menyewa kamar Rp 750.000), algoritma akan menganalisis teks "Keterangan/Berita Transfer" dari bank dan mencocokkannya dengan nama penghuni di database.
5. **Human-in-the-Loop**: Sistem akan menampilkan tebakannya di tabel. Pengguna wajib melakukan peninjauan visual dan menekan centang sebelum sistem menyimpannya ke pangkalan data utama.

## 3. Kelebihan
- **100% Gratis & Mandiri**: Tidak perlu berlangganan robot/bot pihak ketiga (seperti Moota) yang mahal.
- **Keamanan Data Mutlak**: Tidak perlu membagikan *Username* atau *Password Internet Banking* kepada pihak ketiga. Proses *upload* CSV sangat aman.
- **Efisiensi Waktu**: Bisa memverifikasi puluhan pembayaran secara borongan (*bulk*) dengan satu kali klik.

## 4. Kelemahan
- **Membutuhkan Intervensi Manual**: Pengguna tetap harus melakukan rutinitas harian untuk *login* ke *Internet Banking*, mengekspor file CSV, lalu mengunggahnya ke *website*. (Tidak 100% lepas tangan).
- **Sensitif terhadap Format Bank**: Saat ini algoritma membaca teks secara luas. Namun jika pihak bank mengubah format ekspor CSV mereka secara drastis, ada kemungkinan algoritma gagal membaca sel nominal dengan tepat.
- **Tidak Ramah Cicilan**: Jika penghuni mentransfer setengah harga (contoh: bayar cicilan Rp 400.000 untuk kamar seharga Rp 750.000), sistem tidak akan menyarankannya karena nominalnya tidak cocok mutlak. (Tetap harus diinput manual).

## 5. Pengembangan ke Depannya (Roadmap)
- **Toleransi Cicilan**: Menambahkan fitur untuk mengenali cicilan dengan memindai nama saja (meskipun nominal berbeda).
- **Pengenalan Bank Beragam**: Membangun antarmuka yang memungkinkan sistem mengenali format CSV dari berbagai bank secara spesifik (Mandiri, BCA, BNI) bukan hanya BRI.
- **Peralihan Status**: Jika fitur ini dinilai stabil tanpa *error* fatal selama beberapa bulan ke depan, fitur ini akan diangkat dari "Secondary Feature" (Beta) menjadi "Primary Feature" (Utama), dan tombol Input Manual mungkin akan disembunyikan ke dalam menu lanjutan.

## 6. Status Kesiapan Rilis (Deployment)
Fitur ini telah **SIAP DEPLOY**, namun dengan protokol **BETA RELEASE**. 
Artinya, fitur ini akan langsung di-*merge* ke cabang utama (`main`) dan diluncurkan ke server VPS secara *Live*, TAPI fitur ini tidak akan menggantikan alur kerja yang sudah ada. Fitur ini hanya akan duduk manis sebagai tombol opsi di sebelah tombol "Tambah Pembayaran Manual" agar *user* bisa mencoba (*trial & error*) tanpa resiko sistem utamanya rusak.
