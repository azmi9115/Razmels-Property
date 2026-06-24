#!/bin/bash

echo "🚀 Memulai proses update aplikasi Razmels Property Management..."

# 1. Menarik kode terbaru dari repositori
echo "📥 Menarik kode terbaru dari Git..."
git pull origin main

# 2. Membangun ulang (rebuild) image Docker
echo "📦 Membangun ulang kontainer Docker..."
docker-compose build

# 3. Menyalakan ulang container di background
echo "🔄 Menyalakan ulang aplikasi dengan versi terbaru..."
docker-compose up -d

# 4. Membersihkan image lama yang sudah tidak terpakai agar SSD VPS tidak penuh
echo "🧹 Membersihkan sisa-sisa file lama..."
docker image prune -f

echo "✅ Selesai! Aplikasi Anda sudah berhasil di-update ke versi terbaru."
