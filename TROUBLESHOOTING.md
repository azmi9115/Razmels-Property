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

## 7. Login Gagal Diam-diam (NextAuth CSRF Mismatch)
**Kendala:**
User mencoba login, namun tombol "Sign In" tidak merespon apa-apa dan URL hanya *redirect* atau tertahan di halaman login tanpa ada pesan error.
**Penyebab:**
Nilai `NEXTAUTH_URL` di `docker-compose.yml` tidak sesuai dengan alamat asli yang sedang diketik oleh pengguna di browser. Jika `NEXTAUTH_URL` diisi `https://razmels.com` tetapi pengguna mengakses dari `http://100.68.41.84:3001`, NextAuth akan menganggap ini sebagai serangan CSRF dan menolak interaksi secara sepihak.
**Solusi:**
- Pastikan variabel `NEXTAUTH_URL` sama persis dengan IP dan Port (atau domain) yang dipakai saat mengakses web (contoh: `http://100.68.41.84:3000`).

## 8. Halaman Tersangkut di Tampilan Aplikasi Lama (Aggressive Browser Caching)
**Kendala:**
Setelah memindahkan port atau mendeploy ulang aplikasi baru, browser masih menampilkan antarmuka aplikasi versi lama (contoh: Kost-App) padahal server sudah dipastikan menyajikan file yang baru.
**Penyebab:**
Framework seperti Next.js dan React sangat mengandalkan *Client-Side Caching*. Browser secara agresif menahan *bundle JS* lama, sehingga mencoba menembak endpoint API yang sudah usang dan berujung pada aplikasi yang "bengong".
**Solusi:**
- Selalu minta pengguna untuk melakukan *Hard Refresh* (Ctrl+F5) atau mencoba akses via *Private Window/Incognito* jika tampilan web terasa aneh atau bukan versi terbaru pasca deployment.

## 9. Error Docker Compose V1 vs V2 (ContainerConfig KeyError)
**Kendala:**
Saat menjalankan script `update.sh` di VPS, muncul error: `KeyError: 'ContainerConfig'` dan container gagal dibuat ulang (sehingga memicu nama container konflik aneh seperti `b8bf2de208c4_razmels-web`).
**Penyebab:**
Script deployment menggunakan perintah versi lama `docker-compose` (dengan tanda hubung/strip) yang berbasis Python. Saat image dibangun menggunakan fitur modern BuildKit, metadata image tersebut tidak memiliki atribut lama `ContainerConfig`. Saat `docker-compose` versi 1 membaca image baru ini, ia *crash* karena tidak menemukan atribut tersebut.
**Solusi:**
- Hentikan pemakaian `docker-compose` (versi 1 jadul). Gunakan sintaks modern **`docker compose`** (tanpa spasi) di seluruh script deployment (`update.sh` dsb) karena ini adalah plugin standar yang terintegrasi dengan versi Docker engine modern.

## 10. Cloudflare Error 1033 (Tunnel Aktif, Aplikasi Mati)
**Kendala:**
Browser menampilkan **Error 1033 - Tunnel Error** saat mengakses `razmels.com`. Tunnel Cloudflare aktif, namun website tidak bisa diakses.
**Penyebab:**
Ada dua akar masalah yang saling berkaitan:
1. **Port 3000 kosong melompong**: Semua proses Docker di Port 3000 dihentikan (bersih total). Padahal `cloudflared` tetap berjalan di latar belakang dan menunggu koneksi di Port 3000 yang sudah tiada penghuninya.
2. **Mismatch rute (Port Drift)**: Sebelum pembersihan, deployment sempat otomatis pindah ke Port 3001 akibat tabrakan port. Sehingga ada ketidaksinkronan antara `docker-compose.yml`, konfigurasi port aktif, dan file `/etc/cloudflared/config.yml` yang masih mengarah ke Port 3000 lama.
**Solusi / Prosedur Pemulihan:**
```bash
# 1. Masuk ke server via SSH
ssh aril@100.68.41.84

# 2. Pastikan kode terbaru sudah ada (jika terhapus, pull ulang)
cd ~/razmels-web && git pull origin main

# 3. Nyalakan ulang container di Port 3000
sudo docker compose up -d --build

# 4. Verifikasi Port 3000 sudah aktif
sudo ss -tlnp | grep 3000

# 5. Pastikan cloudflared mengarah ke port yang benar
cat /etc/cloudflared/config.yml
# Harus berisi: url: http://localhost:3000

# 6. Restart cloudflared agar terowongannya menyegarkan koneksi
sudo systemctl restart cloudflared
```
**Aturan Baku (Prevention):**
- Jika ada kebutuhan mengubah port, WAJIB update `config.yml` cloudflared sekaligus, lalu restart `cloudflared`. Saat ini web menggunakan Port **3001** (`http://localhost:3001`) untuk menghindari port 3000 yang sering bentrok.
- Setelah pembersihan server total, selalu jalankan `sudo docker compose up -d` sebelum memeriksa website dari browser.

## 11. Build Next.js Gagal (Google Fonts Timeout)
**Kendala:**
Saat melakukan deployment / update kode, Docker mencoba membangun ulang *image* (`npm run build`). Namun proses build berhenti mendadak dengan error: `Failed to fetch Geist from Google Fonts`. Aplikasi pun gagal di-update.
**Penyebab:**
Koneksi internet VPS ke server `fonts.googleapis.com` terputus atau *time-out* secara acak (biasanya karena efek guncangan jaringan atau masalah DNS bawaan Docker).
**Solusi:**
- Jalankan ulang proses *build* (`./update.sh`). Biasanya setelah dicoba lagi, koneksinya akan pulih sendiri.
- Pastikan koneksi server luar hidup dengan mencoba `ping fonts.googleapis.com` dari dalam VPS.

## 12. Update / Deployment Diam-diam Gagal (Docker Permission Denied + Zombie Port)
**Kendala:**
User melihat perubahan kode (seperti perubahan teks UI) tidak muncul di website padahal log update di VPS berkata "Berhasil".
**Penyebab:**
Ada gabungan 3 masalah yang saling menutupi:
1. **Konflik Git**: Admin mungkin pernah mengedit `docker-compose.yml` langsung di VPS. Saat `update.sh` (git pull) berjalan, Git membatalkan penarikan kode karena takut menimpa editan manual tersebut.
2. **AppArmor Lock (Permission Denied)**: Ketika `docker compose up -d` berjalan, Docker gagal mematikan kontainer lama karena ditahan oleh *AppArmor* / *Kernel* OS (`cannot stop container: permission denied`). Akibatnya, kontainer versi lama terus berjalan diam-diam tanpa ada yang sadar.
3. **Zombie Port 3000**: Akibat kontainer lama nyangkut, Port 3000 terus disandera oleh proses `docker-proxy` dari versi lawas (misalnya *Vite Kost-App*).
**Solusi Paripurna:**
- Bersihkan sisa Git di VPS: `git reset --hard` agar kode server sinkron kembali dengan GitHub.
- Bunuh paksa kontainer yang nyangkut: Cari PID-nya (`sudo docker inspect -f '{{.State.Pid}}' razmels-web`) lalu tembak mati dengan `sudo kill -9 <PID>`.
- Ganti port ke 3001: Ubah konfigurasi `docker-compose.yml` ke `3001:3000` dan `config.yml` cloudflared ke `3001`. Hal ini 100% menjamin aplikasi tidak diganggu oleh proses zombie di Port 3000.
- Lakukan reset keamanan OS: `sudo systemctl restart apparmor` atau `sudo aa-remove-unknown`.
