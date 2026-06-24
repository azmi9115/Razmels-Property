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
- Pemetaan port Docker container saat ini adalah `3001:3000`. Jika menambah servis baru, hindari memetakan port host ke port 3000 secara eksplisit jika belum dipastikan kosong.

## 4. Aturan Prisma
- Pada fase development, jika merubah struktur database SQLite dan ada *warning* kemungkinan data terhapus, gunakan `npx prisma db push --accept-data-loss`.
- Selalu ingat untuk memanggil `npx prisma generate` jika ada perubahan pada `schema.prisma`.
