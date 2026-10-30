---
name: cek-bulanan
description: Cek bulanan data keuangan Razmel's dari salinan database produksi — ringkasan bulan, transaksi janggal, dan usulan "Ajari sistem" (GroupRule) yang disimpan ke produksi setelah pemilik setuju. Pakai saat pemilik bilang "cek bulanan", "cek data bulan ini", atau minta sistem diajari dari data terbaru.
---

# Cek bulanan

Claude menjadi "otak" bulanan sistem: membaca data, menyimpulkan, dan mengusulkan ajaran. Web tidak memanggil AI.
Yang diubah di produksi hanya tabel `GroupRule` (dan `CashflowReview` kalau pemilik minta), dan **hanya setelah pemilik menyetujui tiap usulan di chat**.

## 1. Ambil salinan database produksi (hanya dibaca)

Jalankan dari folder `razmels-web/`. Salinannya disimpan di `../cek-bulanan/`, di luar git, karena berisi data penghuni.

```bash
mkdir -p ../cek-bulanan && S=$(date +%Y%m%d-%H%M)
ssh -o BatchMode=yes aril@100.68.41.84 "docker exec razmels-web sqlite3 /app/prisma/dev.db \"VACUUM INTO '/tmp/cek.db'\" && docker cp razmels-web:/tmp/cek.db /tmp/cek.db && docker exec razmels-web rm /tmp/cek.db"
scp -q -o BatchMode=yes aril@100.68.41.84:/tmp/cek.db "../cek-bulanan/prod-$S.db" && ssh -o BatchMode=yes aril@100.68.41.84 rm /tmp/cek.db
node scripts/cek-bulanan.mjs "../cek-bulanan/prod-$S.db" [YYYY-MM] > ../cek-bulanan/hasil-YYYY-MM.json
```

Kalau bulan tidak disebut, yang dipakai bulan lalu. Pastikan field `database` di hasil menunjuk ke file salinan. Salinan yang lebih tua dari 3 bulan boleh dihapus.

## 2. Baca dan simpulkan

Hasil JSON berisi `totalBulanIni`, `perKategori`, `transaksiBulanIni` (lengkap dengan `kelompok`), `perluDicekBelumDitinjau`, `calonAjaran` (deskripsi non-bisnis yang masih jatuh ke "Lain-lain"/"Pemasukan lain" di seluruh data), `ajaranTersimpan`, dan `pilihanKelompok`.

Laporkan ke pemilik dalam bahasa Indonesia santai, singkat:
- **Angka bulan ini**: pemasukan, pengeluaran, selisih, dan perbandingan dengan bulan sebelumnya kalau perlu (jalankan skrip untuk bulan itu).
- **Yang janggal**: transaksi besar tanpa keterangan, deskripsi "-" di sewa, tipe yang tidak cocok, dan data yang berhenti di tanggal tertentu (tanda Excel belum di-update lewat menu Update dari Excel).
- **Usulan ajaran**: dalam tabel tipe | keyword | kelompok | alasan.
  - `kelompok` wajib persis salah satu dari `pilihanKelompok[tipe]`.
  - Keyword huruf kecil, minimal 3 huruf, bukan pengisi ("-", "xxx").
  - Utamakan kata umum yang akan berulang (mis. "kupon" → Kupon & bunga investasi) daripada deskripsi utuh yang sekali muncul.
  - Hati-hati dengan keyword pendek yang bisa salah cocok (`includes`): "pam" juga cocok dengan "pampers".
- Tandai yang perlu ditanyakan ke manager ops, karena Claude tidak tahu, misalnya pemasukan Rp 5 jt tanpa keterangan.

Jangan mengarang arti transaksi. Kalau tidak yakin, tanya pemilik.

## 3. Simpan ajaran yang disetujui ke produksi

Hanya simpan yang dijawab "ya" oleh pemilik di chat. Backup dulu, lalu upsert. Aturannya sama dengan `teachGroup` di `src/app/actions/group-rules.ts`:

```bash
ssh -o BatchMode=yes aril@100.68.41.84 'cd /home/aril/Razmels-Property && docker cp razmels-web:/app/prisma/dev.db backups/sebelum-ajaran-$(date +%Y%m%d-%H%M%S).db'
cat > /tmp/ajaran.json <<'EOF'
[{"type":"Pemasukan","keyword":"kupon","group":"Kupon & bunga investasi"}]
EOF
scp -q -o BatchMode=yes /tmp/ajaran.json aril@100.68.41.84:/tmp/ajaran.json
ssh -o BatchMode=yes aril@100.68.41.84 'docker cp /tmp/ajaran.json razmels-web:/tmp/ajaran.json && docker exec razmels-web node -e "
const {PrismaClient}=require(\"@prisma/client\");const p=new PrismaClient();
const rules=require(\"/tmp/ajaran.json\");
(async()=>{for(const r of rules){const keyword=r.keyword.trim().toLowerCase();
if(keyword.length<3)throw new Error(\"keyword pendek: \"+keyword);
await p.groupRule.upsert({where:{type_keyword:{type:r.type,keyword}},update:{group:r.group},create:{type:r.type,keyword,group:r.group}});}
console.log(\"tersimpan:\",await p.groupRule.count());})().finally(()=>p.\$disconnect())
" && docker exec razmels-web rm /tmp/ajaran.json && rm /tmp/ajaran.json'
```

Sebelum mengirim, cek `group` ada di `pilihanKelompok`. Setelah itu jalankan ulang langkah 1–2 dan pastikan `calonAjaran` yang terkait sudah hilang. Ajaran langsung tampil di Transparansi dan Ajari sistem karena halaman dinamis, jadi tidak perlu restart. Pemilik tetap bisa menghapus ajaran dari web.

## Larangan

- Jangan ubah tabel lain (Cashflow, Payment, Tenant, dll.) dari sini. Koreksi data dilakukan lewat Update dari Excel atau tombol Ubah di web.
- Jangan kirim isi database ke layanan luar.
