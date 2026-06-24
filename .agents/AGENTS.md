# Workspace Rules untuk Razmels Property Web

Dokumen ini adalah aturan otomatis yang akan dimuat oleh AI Asisten di setiap sesi baru untuk menghindari terulangnya kesalahan lampau.

## 1. Aturan Docker & Sistem Operasi
- **BASE IMAGE**: Wajib menggunakan `node:20-slim` atau versi berbasis Debian lainnya. JANGAN gunakan `alpine` karena akan menyebabkan *Prisma OpenSSL musl Error*.
- **NPM INSTALL**: Gunakan `npm install` bukan `npm ci` di Dockerfile untuk menghindari masalah integritas *package-lock.json* antara Windows (local) dan Linux (container).
- **STATIC GENERATION ENV**: Pastikan ada `ENV DATABASE_URL="file:./dev.db"` (dummy variable) pada *stage builder* Dockerfile. Jika tidak ada, Next.js *Static Page Generation* (`npm run build`) akan gagal dan crash karena Prisma tidak menemukan URL database di tahap kompilasi.

## 2. Aturan TypeScript & UI Components
- Proyek ini menggunakan komponen UI dari shadcn/ui dan Recharts.
- Jangan berikan nilai sembarang (seperti fungsi kosong atau tipe yang salah) ke dalam komponen ini karena Next.js Build sangat strict (strict type check).
- **Select Shadcn**: Handler `onValueChange` bisa mengembalikan tipe string atau *null*. Selalu validasi nilainya. Contoh yang benar: `onValueChange={(val) => val && setSelected(val)}` (bukan langsung `onValueChange={setSelected}`).
- **Recharts Tooltip**: Parameter pada *formatter* harus memiliki tipe eksplisit atau gunakan `any` kemudian casting nilainya (misal `Number(value)`). JANGAN biarkan tipenya bentrok dengan union types yang disediakan library.

## 3. Aturan Konfigurasi Port
- Port `3000` di VPS secara historis mungkin disandera oleh proses *node root*.
- Selalu pastikan Anda tahu port host apa yang dipakai. Jika menggunakan port `3000`, pastikan proses lama benar-benar dimatikan.

## 4. Aturan NextAuth & Security
- **NEXTAUTH_URL**: Wajib sama persis dengan URL yang diakses oleh pengguna (termasuk skema http/https dan portnya). Jika tidak cocok, NextAuth akan mendeteksi sebagai serangan CSRF dan form login tidak akan merespon apa-apa secara diam-diam.
- Contoh: Jika VPS IP adalah `100.68.41.84` dan berjalan di port `3000`, maka `NEXTAUTH_URL=http://100.68.41.84:3000`.

## 5. Aturan Browser Caching & UI 
- Jika UI yang ditampilkan setelah deployment terlihat salah, aneh, atau seperti versi aplikasi sebelumnya (padahal server dipastikan sudah menjalankan versi terbaru), **Minta User untuk Hard Refresh (Ctrl+F5)** atau mencoba via Private Window/Incognito.
- Hal ini karena Next.js dan React sangat agresif menahan *Client-Side Caching* pada browser.

## 6. Aturan Prisma
- Pada fase development, jika merubah struktur database SQLite dan ada *warning* kemungkinan data terhapus, gunakan `npx prisma db push --accept-data-loss`.
- Selalu ingat untuk memanggil `npx prisma generate` jika ada perubahan pada `schema.prisma`.
