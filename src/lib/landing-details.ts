// Detail apartemen untuk kartu di halaman depan, disusun dari caption iklan pemilik
// (folder "Razmels Property/Foto Apartment …/Caption …txt"). Kunci = nama unit dalam bentuk slug (photoSlug).
// Sengaja tidak memuat nomor tower/lantai/unit: halaman ini publik dan unitnya bisa sedang dihuni.
// Harga utama di kartu tetap diambil dari database; `prices` di sini hanya pilihan sewa tambahan.

export type UnitDetail = {
  /** Kalimat ringkas di kartu, menggantikan keterangan dari database */
  summary: string
  /** Baris singkat, mis. "Studio 21 m²" */
  specs: string[]
  prices: { label: string; value: string }[]
  inUnit: string[]
  building: string[]
  nearby: string[]
  address?: string
}

export const unitDetails: Record<string, UnitDetail> = {
  "apartment-grand-taman-melati-2": {
    summary: "Studio fully furnished di Margonda, Depok. Dekat kampus UI, dengan pemandangan hutan dan Stasiun UI. Harga sudah termasuk IPL.",
    specs: ["Studio, 21 m²", "1 kamar mandi", "Fully furnished, siap huni", "Pemandangan hutan & Stasiun UI"],
    prices: [
      { label: "Bulanan", value: "Rp 2.500.000, minimal sewa 12 bulan" },
      { label: "Tahunan", value: "Rp 30.000.000" },
      { label: "Deposit", value: "Rp 5.000.000" },
    ],
    inUnit: ["AC ¾ PK", "TV", "Kulkas", "Kompor listrik", "Kamar mandi dengan toilet & shower"],
    building: ["Kolam renang", "Keamanan 24 jam & CCTV area umum", "Kafe & rooftop cafe"],
    nearby: ["Margo City Mall ±7 menit", "Depok Mall ±11 menit", "Lippo Mall Cimanggis Square ±12 menit", "Stasiun KRL Lenteng Agung ±7 menit"],
    address: "Jl. Margonda Raya No. 525A, Pondok Cina, Beji, Depok",
  },
  "apartment-sky-terrace-lagoon": {
    summary: "2 kamar tidur fully furnished di lantai 6, balkon menghadap kolam renang lagoon dan taman. Daan Mogot, Jakarta Barat.",
    specs: ["2 kamar tidur, 48–49 m²", "1 kamar mandi dengan water heater", "Lantai 6, balkon menghadap kolam renang", "Fully furnished, siap huni"],
    prices: [
      { label: "Tahunan", value: "Rp 58.000.000" },
      { label: "Harian", value: "Rp 650.000 per hari (sewa di bawah 1 bulan)" },
    ],
    inUnit: ["Kasur king size + kamar anak", "Sofa", "TV 32 inci", "Kulkas 2 pintu", "Dispenser", "Kitchen set + kompor", "Lemari & gorden", "Water heater"],
    building: ["Kolam renang lagoon", "Gym", "Jogging track", "Meja tenis", "Playground anak", "Area BBQ", "Lobi & lounge", "Keamanan 24 jam dengan access card", "Parkir gratis"],
    nearby: [
      "Bersebelahan dengan Mall Daan Mogot (Hypermart, Cinema XXI)",
      "Dekat RS Hermina, RS Mitra Keluarga, Sekolah Dian Harapan",
      "±15 menit ke Bandara Soekarno-Hatta, CBD Puri, PIK",
      "±25 menit ke Trisakti, Untar, Ukrida, Central Park",
    ],
  },
}
