# Razmels Property Web - Troubleshooting & Post-Mortem

Dokumen ini berisi rangkuman riwayat kendala (troubleshooting) dan pemecahan masalah yang terjadi selama fase pengembangan dan deployment proyek Razmels Property Web. 

## 1. Migrasi Database (Prisma & SQLite)
**Kendala:** 
Sering terjadi *crash* ketika ada perubahan struktur tabel, atau kolom yang diubah/dihapus membuat Prisma *stuck* karena bentrok dengan data lama.
**Penyebab:**
Perintah `prisma migrate dev` kadang gagal jika ada peringatan hilangnya data (*data loss warning*).
**Solusi / Praktik Terbaik:**
- Untuk fase pengembangan dengan SQLite (di mana kita rela me-*reset* struktur jika butuh), gunakan perintah:
  `npx prisma db push --accept-data-loss`
- Selalu jalankan `npx prisma generate` setelah mengubah `schema.prisma` agar *library* Prisma Client di Node.js mengenali tipe data terbaru.

## 2. Kesalahan `npm ci` di Docker (Environment Mismatch)
**Kendala:** 
Saat membangun Docker image, tahap instalasi paket gagal di perintah `npm ci`.
**Penyebab:** 
File `package-lock.json` di-generate di Windows, sementara Docker berjalan di atas Linux (Alpine/Debian). Next.js memiliki *dependency* biner opsional (seperti SWC) yang terikat dengan OS tertentu, sehingga verifikasi integritas hash file gagal.
**Solusi:**
- Di dalam `Dockerfile`, hindari penggunaan `npm ci` untuk project Next.js lintas-platform. Gunakan **`npm install`** biasa.

## 3. Strict TypeScript Error saat `npm run build`
**Kendala:** 
Aplikasi berjalan mulus di *development* (`npm run dev`), tetapi gagal total saat di-*build* (`npm run build`).
**Penyebab:** 
Proses *build* Next.js memiliki pengecekan tipe data TypeScript (Strict Typing) yang sangat ketat, sedangkan beberapa *library UI* (seperti Shadcn, Radix UI, dan Recharts) memiliki tipe data yang kompleks.
**Solusi:**
- **Recharts Tooltip**: Parameter *formatter* sering protes karena tipe `value` yang tidak spesifik. Solusi: ubah tipe parameter formatter menjadi eksplisit atau `any`, lalu parsing manual `Number(value)`.
- **Shadcn `<Select>`**: Handler `onValueChange` bisa menerima nilai `string` atau `null`. Solusi: gunakan pengecekan validitas `(val) => val && setSelected(val)` daripada langsung mengoper nilai fungsi yang bisa memicu *Null Injection*.
- **Shadcn `<TooltipProvider>`**: Hapus properti-properti yang sudah tidak terpakai/deprecated di versi UI baru seperti `delayDuration={0}` pada *root provider*.

## 4. Prisma OpenSSL Error di Alpine Linux
**Kendala:** 
`PrismaClientInitializationError: Unable to require libquery_engine-linux-musl.so.node` saat mencoba mengakses database di dalam kontainer Docker.
**Penyebab:** 
Image Docker dasar yang dipakai awalnya adalah `node:20-alpine`. Alpine Linux menggunakan format C Library `musl`, yang tidak memiliki *library* `libssl` atau OpenSSL yang kompatibel secara bawaan dengan Prisma Engine.
**Solusi:**
- Ganti *base image* Docker menjadi **`node:20-slim`** (Debian Slim). Lingkungan Debian jauh lebih stabil dan menggunakan `glibc` yang mendukung OpenSSL bawaan untuk Prisma.

## 5. Next.js Static Page Generation Crash karena DATABASE_URL
**Kendala:** 
`docker-compose build` gagal di tengah jalan (`npm run build`) dengan pesan `Environment variable not found: DATABASE_URL`.
**Penyebab:** 
Next.js memiliki fitur pra-render halaman statis (*getStaticProps* / *server components*). Saat kompilasi berjalan, ia mengeksekusi kode yang memanggil Prisma. Sayangnya di tahap `Builder` pada Dockerfile, `DATABASE_URL` belum terdefinisi (hanya di-inject saat container menyala).
**Solusi:**
- Sisipkan environment *dummy* di dalam `Dockerfile` pada stage `builder` agar kompilasinya lolos:
  `ENV DATABASE_URL="file:./dev.db"`

## 6. Port Collision (Address Already In Use)
**Kendala:** 
Container Docker sudah berhasil dibuat, namun gagal dinyalakan dengan pesan `failed to bind host port 0.0.0.0:3000/tcp`.
**Penyebab:** 
Port 3000 di VPS sedang disandera oleh proses Node.js lain (atau aplikasi versi sebelumnya yang dijalankan manual sebagai background process/PM2 oleh *root*).
**Solusi:**
- Cari proses yang menyandera port: `netstat -tulnp | grep 3000` atau `ps aux | grep node`.
- Matikan paksa jika perlu (contoh: `sudo killall node`).
- Alternatif (jika tak ingin membunuh proses lama): Ubah pemetaan port di `docker-compose.yml` menjadi port yang bebas, contohnya `3001:3000`.
