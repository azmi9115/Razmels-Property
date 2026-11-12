// Ilustrasi bangunan saat senja untuk halaman depan. Ini gambar, bukan foto unit: dipakai selama
// foto asli belum ada di public/landing. Jendela menyala = unit sedang dihuni; jendela gelap dengan
// tanda hijau = unit kosong (mengikuti data ketersediaan).

export type ArtUnit = { label: string; occupied: boolean }

const P = {
  lit: "#ffd27a",
  litDeep: "#c9973f",
  glass: "#1c2430",
  frame: "#8391a6",
  wall: "#586478",
  wallShade: "#485468",
  trim: "#2b3543",
  roof: "#171d27",
  ground: "#19202a",
  path: "#232c38",
  far: "#2f3a4b",
  mid: "#3f4b5e",
  midGlass: "#2a3443",
  tree: "#22302e",
  treeHi: "#2c3f3a",
  green: "#42c18e",
  greenText: "#8ff0c8",
  signInk: "#0d2b1f",
  label: "#d5dde8",
}

const r1 = (n: number) => Math.round(n * 10) / 10
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Jendela: menyala (dihuni) atau gelap berbingkai (kosong). `delay` = urutan menyala di hero
function Win({ x, y, w, h, lit, delay }: { x: number; y: number; w: number; h: number; lit: boolean; delay?: number }) {
  if (!lit) {
    return <rect x={r1(x)} y={r1(y)} width={r1(w)} height={r1(h)} rx={1} fill={P.glass} stroke={P.frame} strokeWidth={1} />
  }
  return (
    <g className={delay === undefined ? undefined : "landing-lamp"} style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}>
      <rect x={r1(x - 4)} y={r1(y - 4)} width={r1(w + 8)} height={r1(h + 8)} rx={3} fill={P.lit} opacity={0.14} />
      <rect x={r1(x)} y={r1(y)} width={r1(w)} height={r1(h)} rx={1} fill={P.lit} />
      <path d={`M${r1(x + w / 2)} ${r1(y)}v${r1(h)}M${r1(x)} ${r1(y + h / 2)}h${r1(w)}`} stroke={P.litDeep} strokeWidth={1} opacity={0.7} />
    </g>
  )
}

type RowProps = {
  x0: number
  base: number
  bay: number
  wallH: number
  units: ArtUnit[]
  /** Hero: jendela menyala bergantian */
  lamps?: boolean
  roof?: boolean
}

// Deret kamar satu lantai: tiap unit punya pintu, jendela, dan nomor
function KosRow({ x0, base, bay, wallH, units, lamps, roof = true }: RowProps) {
  const s = wallH / 96
  const w = bay * units.length
  const top = base - wallH
  return (
    <g>
      {roof && <path d={`M${r1(x0 - 12 * s)} ${r1(top)}H${r1(x0 + w + 12 * s)}L${r1(x0 + w - 2 * s)} ${r1(top - 26 * s)}H${r1(x0 + 2 * s)}Z`} fill={P.roof} />}
      <rect x={r1(x0)} y={r1(top)} width={r1(w)} height={r1(wallH)} fill={P.wall} />
      <rect x={r1(x0 - 12 * s)} y={r1(top - 2 * s)} width={r1(w + 24 * s)} height={r1(5 * s)} fill={P.trim} />
      <rect x={r1(x0)} y={r1(top + 3 * s)} width={r1(w)} height={r1(5 * s)} fill="#000" opacity={0.14} />
      <rect x={r1(x0)} y={r1(base - 7 * s)} width={r1(w)} height={r1(7 * s)} fill={P.wallShade} />
      {units.map((u, i) => {
        const bx = x0 + i * bay
        const dw = clamp(bay * 0.28, 11 * s, 19 * s)
        const dh = 46 * s
        const dx = bx + bay * 0.16
        const ww = clamp(bay * 0.32, 12 * s, 22 * s)
        const wh = 24 * s
        const wx = bx + bay * 0.54
        const wy = base - 60 * s
        return (
          <g key={i}>
            {i > 0 && <rect x={r1(bx - 1)} y={r1(top)} width={2} height={r1(wallH)} fill={P.wallShade} />}
            <rect x={r1(dx)} y={r1(base - dh)} width={r1(dw)} height={r1(dh)} rx={1} fill={P.trim} />
            <circle cx={r1(dx + dw - 3 * s)} cy={r1(base - dh / 2)} r={r1(1.1 * s)} fill={P.frame} />
            <Win x={wx} y={wy} w={ww} h={wh} lit={u.occupied} delay={lamps ? 350 + i * 170 : undefined} />
            {u.label && (
              <text
                x={r1(dx + dw / 2)}
                y={r1(base - dh - 5 * s)}
                textAnchor="middle"
                fontSize={r1(9.5 * s)}
                fontWeight={700}
                fill={u.occupied ? P.label : P.greenText}
                opacity={u.occupied ? 0.75 : 1}
              >
                {u.label}
              </text>
            )}
            {!u.occupied && <rect x={r1(dx + dw / 2 - 6 * s)} y={r1(base - dh + 9 * s)} width={r1(12 * s)} height={r1(8 * s)} rx={r1(2 * s)} fill={P.green} />}
            {u.occupied && <ellipse cx={r1(wx + ww / 2)} cy={r1(base + 9 * s)} rx={r1(ww)} ry={r1(3.5 * s)} fill={P.lit} opacity={0.08} />}
          </g>
        )
      })}
    </g>
  )
}

// Deret kios: buka dan terang kalau disewa, rolling door tertutup bertanda "DISEWAKAN" kalau kosong
function KiosRow({ x0, base, bay, wallH, units, lamps }: RowProps) {
  const s = wallH / 118
  const w = bay * units.length
  const top = base - wallH
  const stripes = 6
  return (
    <g>
      <rect x={r1(x0 - 5 * s)} y={r1(top - 9 * s)} width={r1(w + 10 * s)} height={r1(10 * s)} fill={P.roof} />
      <rect x={r1(x0)} y={r1(top)} width={r1(w)} height={r1(wallH)} fill={P.wall} />
      {units.map((u, i) => {
        const bx = x0 + i * bay
        const ox = bx + 11 * s
        const ow = bay - 22 * s
        const oh = 70 * s
        const oy = base - oh
        const ay = top + 29 * s
        const tw = (bay - 16 * s) / stripes
        const bw = (bay - 6 * s) / stripes
        const signW = Math.min(54 * s, ow - 6 * s)
        return (
          <g key={i}>
            {i > 0 && <rect x={r1(bx - 1.5)} y={r1(top)} width={3} height={r1(wallH)} fill={P.wallShade} />}
            <rect x={r1(bx + 9 * s)} y={r1(top + 8 * s)} width={r1(bay - 18 * s)} height={r1(14 * s)} rx={r1(3 * s)} fill={P.trim} />
            {u.label && (
              <text x={r1(bx + bay / 2)} y={r1(top + 18.3 * s)} textAnchor="middle" fontSize={r1(8.8 * s)} fontWeight={700} fill={u.occupied ? P.label : P.greenText}>
                {u.label}
              </text>
            )}
            {u.occupied ? (
              <g className={lamps ? "landing-lamp" : undefined} style={lamps ? { animationDelay: `${1300 + i * 220}ms` } : undefined}>
                <rect x={r1(ox - 4)} y={r1(oy - 4)} width={r1(ow + 8)} height={r1(oh + 4)} rx={3} fill={P.lit} opacity={0.12} />
                <rect x={r1(ox)} y={r1(oy)} width={r1(ow)} height={r1(oh)} fill={P.lit} />
                {/* rak dan barang dagangan */}
                <path d={`M${r1(ox)} ${r1(oy + oh * 0.3)}h${r1(ow)}M${r1(ox)} ${r1(oy + oh * 0.56)}h${r1(ow)}`} stroke={P.litDeep} strokeWidth={r1(1.4 * s)} />
                {Array.from({ length: Math.max(2, Math.floor(ow / (13 * s))) }, (_, q) => (
                  <g key={q}>
                    <rect x={r1(ox + 5 * s + q * 13 * s)} y={r1(oy + oh * 0.3 - 8 * s)} width={r1(7 * s)} height={r1(8 * s)} fill={q % 2 ? "#e7b65c" : P.litDeep} />
                    <rect x={r1(ox + 7 * s + q * 13 * s)} y={r1(oy + oh * 0.56 - 6 * s)} width={r1(6 * s)} height={r1(6 * s)} fill={q % 2 ? P.litDeep : "#e7b65c"} />
                  </g>
                ))}
                <rect x={r1(ox)} y={r1(base - 20 * s)} width={r1(ow)} height={r1(20 * s)} fill={P.wallShade} />
                <rect x={r1(ox)} y={r1(base - 20 * s)} width={r1(ow)} height={r1(2 * s)} fill={P.frame} opacity={0.6} />
                <ellipse cx={r1(bx + bay / 2)} cy={r1(base + 9 * s)} rx={r1(ow * 0.5)} ry={r1(4 * s)} fill={P.lit} opacity={0.09} />
                {/* tenda bergaris */}
                {Array.from({ length: stripes }, (_, j) => (
                  <path
                    key={j}
                    d={`M${r1(bx + 8 * s + j * tw)} ${r1(ay)}h${r1(tw)}L${r1(bx + 3 * s + (j + 1) * bw)} ${r1(ay + 15 * s)}h${r1(-bw)}Z`}
                    fill={j % 2 ? "#7c8ba1" : "#eef2f6"}
                  />
                ))}
              </g>
            ) : (
              <>
                <rect x={r1(ox)} y={r1(oy)} width={r1(ow)} height={r1(oh)} fill={P.trim} />
                {Array.from({ length: Math.floor(oh / (7 * s)) }, (_, j) => (
                  <path key={j} d={`M${r1(ox)} ${r1(oy + (j + 1) * 7 * s)}h${r1(ow)}`} stroke="#3c4858" strokeWidth={1} />
                ))}
                <rect x={r1(bx + bay / 2 - signW / 2)} y={r1(oy + oh * 0.34)} width={r1(signW)} height={r1(15 * s)} rx={r1(3 * s)} fill={P.green} />
                <text
                  x={r1(bx + bay / 2)}
                  y={r1(oy + oh * 0.34 + 10.6 * s)}
                  textAnchor="middle"
                  fontSize={r1(Math.min(7.6 * s, signW / 7.4))}
                  fontWeight={800}
                  fill={P.signInk}
                  letterSpacing={0.4}
                >
                  DISEWAKAN
                </text>
                <rect x={r1(bx + 8 * s)} y={r1(ay)} width={r1(bay - 16 * s)} height={r1(5 * s)} rx={2} fill={P.wallShade} />
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

// Menara apartemen dengan kisi jendela; pola menyala tetap (bukan data), `mark` = jendela unit yang ditawarkan
function Tower({
  x,
  top,
  w,
  base,
  cols,
  rows,
  seed,
  fill = P.mid,
  mark,
}: {
  x: number
  top: number
  w: number
  base: number
  cols: number
  rows: number
  seed: number
  fill?: string
  mark?: [number, number] | null
}) {
  const h = base - top
  const padX = w * 0.13
  const cw = (w - padX * 2) / cols
  const rh = (h - 14) / rows
  const cells: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const marked = !!mark && mark[0] === r && mark[1] === c
      const lit = !marked && (r * 31 + c * 17 + seed * 13) % 7 < 4
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={r1(x + padX + c * cw + cw * 0.2)}
          y={r1(top + 9 + r * rh)}
          width={r1(cw * 0.6)}
          height={r1(rh * 0.5)}
          fill={marked ? P.glass : lit ? P.lit : P.midGlass}
          opacity={lit ? 0.9 : 1}
          stroke={marked ? P.green : undefined}
          strokeWidth={marked ? 1.6 : undefined}
        />
      )
    }
  }
  return (
    <g>
      <rect x={r1(x)} y={r1(top)} width={r1(w)} height={r1(h)} fill={fill} />
      {cells}
    </g>
  )
}

function Tree({ x, base, r }: { x: number; base: number; r: number }) {
  return (
    <g>
      <rect x={r1(x - 1.5)} y={r1(base - r * 1.1)} width={3} height={r1(r * 1.1)} fill={P.roof} />
      <circle cx={r1(x)} cy={r1(base - r * 1.7)} r={r1(r)} fill={P.tree} />
      <circle cx={r1(x + r * 0.35)} cy={r1(base - r * 1.45)} r={r1(r * 0.62)} fill={P.treeHi} />
    </g>
  )
}

function Lamp({ x, base, h = 46 }: { x: number; base: number; h?: number }) {
  return (
    <g>
      <rect x={x - 1} y={base - h} width={2} height={h} fill={P.roof} />
      <rect x={x - 1} y={base - h} width={10} height={2} fill={P.roof} />
      <circle cx={x + 9} cy={base - h + 4} r={9} fill={P.lit} opacity={0.15} />
      <circle cx={x + 9} cy={base - h + 4} r={2.4} fill={P.lit} />
      <ellipse cx={x + 9} cy={base + 8} rx={16} ry={3.5} fill={P.lit} opacity={0.07} />
    </g>
  )
}

// Deret gedung di kejauhan. Ukurannya dari deret angka tetap supaya hasil di server dan browser sama
function farSkyline(from: number, to: number, maxH: number, seed: number) {
  const out: { x: number; w: number; h: number; lamp: boolean }[] = []
  let x = from
  let k = seed
  while (x < to) {
    k = (k * 73 + 41) % 997
    const w = 22 + (k % 34)
    const h = 14 + ((k * 7) % maxH)
    out.push({ x, w, h, lamp: k % 4 === 0 && h > 26 })
    x += w + (k % 3 === 0 ? 6 : 0)
  }
  return out
}

function Skyline({ from, to, base, maxH, seed }: { from: number; to: number; base: number; maxH: number; seed: number }) {
  return (
    <g>
      {farSkyline(from, to, maxH, seed).map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h} fill={P.far} />
          {b.lamp && <rect x={r1(b.x + b.w * 0.3)} y={base - b.h + 8} width={3} height={4} fill={P.lit} opacity={0.5} />}
        </g>
      ))}
    </g>
  )
}

function Ground({ base, width, depth }: { base: number; width: number; depth: number }) {
  return (
    <g>
      <rect x={0} y={base} width={width} height={depth} fill={P.ground} />
      <rect x={0} y={base + 9} width={width} height={12} fill={P.path} />
    </g>
  )
}

const STARS: [number, number][] = [
  [36, 30],
  [92, 54],
  [148, 22],
  [206, 44],
  [262, 18],
  [318, 58],
  [372, 28],
]

// Bingkai gambar kartu (400×280): langit senja + bintang, isi bangunan dari children
function CardScene({ uid, horizon, children }: { uid: string; horizon: number; children: React.ReactNode }) {
  const sky = `${uid.replace(/[^a-zA-Z0-9_-]/g, "")}-langit`
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" className="block size-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2430" />
          <stop offset="0.55" stopColor="#334052" />
          <stop offset="1" stopColor="#675f76" />
        </linearGradient>
      </defs>
      <rect width={400} height={horizon} fill={`url(#${sky})`} />
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.9} fill="#fff" opacity={0.5} />
      ))}
      {children}
    </svg>
  )
}

// Blok kamar: satu lantai sampai 8 unit, dua lantai kalau lebih
export function KosArt({ uid, units }: { uid: string; units: ArtUnit[] }) {
  const base = 198
  const twoFloors = units.length > 8
  const perFloor = twoFloors ? Math.ceil(units.length / 2) : Math.max(units.length, 1)
  const bay = clamp(344 / perFloor, 38, 76)
  const wallH = twoFloors ? 72 : 96
  const w = bay * perFloor
  const x0 = (400 - w) / 2
  return (
    <CardScene uid={uid} horizon={base}>
      <Skyline from={0} to={400} base={base} maxH={58} seed={7} />
      <Tower x={86} top={44} w={40} base={base} cols={3} rows={12} seed={2} fill={P.far} />
      <Tower x={236} top={30} w={46} base={base} cols={3} rows={13} seed={6} fill={P.far} />
      <Ground base={base} width={400} depth={82} />
      <Tree x={x0 - 8} base={base} r={17} />
      <Tree x={x0 + w + 9} base={base} r={21} />
      {twoFloors ? (
        <>
          <KosRow x0={x0} base={base} bay={bay} wallH={wallH} units={units.slice(0, perFloor)} roof={false} />
          <KosRow x0={x0} base={base - wallH} bay={bay} wallH={wallH} units={units.slice(perFloor)} />
        </>
      ) : (
        <KosRow x0={x0} base={base} bay={bay} wallH={wallH} units={units} />
      )}
    </CardScene>
  )
}

export function KiosArt({ uid, units }: { uid: string; units: ArtUnit[] }) {
  const base = 198
  const n = Math.max(units.length, 1)
  const bay = clamp(344 / n, 44, 116)
  const w = bay * n
  const x0 = (400 - w) / 2
  return (
    <CardScene uid={uid} horizon={base}>
      <Skyline from={0} to={400} base={base} maxH={58} seed={23} />
      <Tower x={300} top={36} w={44} base={base} cols={3} rows={12} seed={4} fill={P.far} />
      <Ground base={base} width={400} depth={82} />
      <Tree x={x0 - 6} base={base} r={15} />
      <KiosRow x0={x0} base={base} bay={bay} wallH={118} units={units} />
    </CardScene>
  )
}

// Menara apartemen. `lagoon`: di tepi air dengan pantulan lampu; `garden`: dua menara dengan taman di depannya
export function TowerArt({ uid, variant, available }: { uid: string; variant: "lagoon" | "garden"; available: boolean }) {
  const base = 214
  if (variant === "lagoon") {
    return (
      <CardScene uid={uid} horizon={base}>
        <Skyline from={0} to={400} base={base} maxH={52} seed={31} />
        <Tower x={62} top={112} w={72} base={base} cols={4} rows={8} seed={2} fill="#384456" />
        <Tower x={270} top={92} w={78} base={base} cols={4} rows={9} seed={4} fill="#384456" />
        <rect x={176} y={24} width={60} height={12} fill={P.mid} />
        <rect x={205} y={8} width={2} height={16} fill={P.mid} />
        <Tower x={160} top={36} w={92} base={base} cols={5} rows={13} seed={1} mark={available ? [6, 2] : null} />
        <rect x={0} y={base} width={400} height={66} fill="#17202b" />
        <rect x={0} y={base} width={400} height={3} fill={P.trim} />
        {Array.from({ length: 18 }, (_, i) => (
          <rect key={i} x={70 + ((i * 53) % 270)} y={base + 9 + ((i * 11) % 34)} width={6 + ((i * 5) % 14)} height={1.6} fill={P.lit} opacity={0.24} />
        ))}
      </CardScene>
    )
  }
  return (
    <CardScene uid={uid} horizon={base}>
      <Skyline from={0} to={400} base={base} maxH={52} seed={43} />
      <Tower x={84} top={70} w={96} base={base} cols={5} rows={11} seed={3} />
      <Tower x={218} top={46} w={96} base={base} cols={5} rows={13} seed={5} mark={available ? [5, 2] : null} />
      <rect x={62} y={base - 26} width={276} height={26} fill={P.wallShade} />
      <rect x={62} y={base - 28} width={276} height={4} fill={P.trim} />
      <rect x={178} y={base - 20} width={44} height={20} fill={P.lit} />
      <path d={`M200 ${base - 20}v20`} stroke={P.litDeep} strokeWidth={1.4} />
      <ellipse cx={200} cy={base + 8} rx={34} ry={4} fill={P.lit} opacity={0.09} />
      <rect x={0} y={base} width={400} height={66} fill="#18211f" />
      <rect x={0} y={base + 9} width={400} height={11} fill={P.path} />
      <Tree x={40} base={base} r={15} />
      <Tree x={104} base={base} r={11} />
      <Tree x={300} base={base} r={12} />
      <Tree x={362} base={base} r={17} />
      <Lamp x={140} base={base} h={30} />
      <Lamp x={258} base={base} h={30} />
    </CardScene>
  )
}

const HERO_STARS: [number, number, number][] = [
  [70, 150, 1.1],
  [150, 250, 0.9],
  [232, 118, 1],
  [305, 300, 0.9],
  [470, 130, 1.2],
  [540, 262, 0.9],
  [628, 160, 1],
  [706, 316, 0.8],
  [790, 118, 1],
  [868, 232, 0.9],
  [960, 140, 1.1],
  [1052, 296, 0.8],
  [1150, 108, 0.9],
  [1262, 250, 1],
  [1370, 150, 1.1],
]

const HERO_KOS: ArtUnit[] = [true, true, false, true, true].map((occupied) => ({ label: "", occupied }))
const HERO_KIOS: ArtUnit[] = [true, false].map((occupied) => ({ label: "", occupied }))

// Isi hero dalam ruang 1800×300: gedung jauh, apartemen, deret kamar, dan kios di tepi jalan
function HeroScene() {
  const base = 252
  return (
    <g>
      <Skyline from={0} to={1800} base={base} maxH={62} seed={11} />
      <Tower x={500} top={34} w={78} base={base} cols={4} rows={14} seed={1} />
      <Tower x={590} top={76} w={66} base={base} cols={4} rows={11} seed={3} />
      <Tower x={668} top={112} w={56} base={base} cols={3} rows={9} seed={5} />
      <rect x={0} y={base} width={1800} height={48} fill={P.ground} />
      <rect x={0} y={base + 12} width={1800} height={24} fill={P.path} />
      <path d={`M0 ${base + 24}H1800`} stroke={P.frame} strokeWidth={1.2} strokeDasharray="16 22" opacity={0.25} />
      <Tree x={410} base={base} r={22} />
      <Tree x={446} base={base} r={14} />
      <KosRow x0={466} base={base} bay={62} wallH={92} units={HERO_KOS} lamps />
      <KiosRow x0={800} base={base} bay={92} wallH={108} units={HERO_KIOS} lamps />
      <Tree x={1006} base={base} r={18} />
      <Lamp x={384} base={base} />
      <Lamp x={1040} base={base} />
    </g>
  )
}

// Ilustrasi hero. Layar lebar: bangunan di kiri bawah, teks di kanan. Layar sempit: bangunan di tengah bawah
export function HeroArt() {
  return (
    <>
      {/* bintang dan bulan di langit kiri atas (hanya layar lebar, di luar area teks) */}
      <svg viewBox="0 0 1440 380" preserveAspectRatio="xMinYMin slice" className="absolute inset-x-0 top-0 hidden h-[54%] w-full xl:block" aria-hidden="true" focusable="false">
        {HERO_STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.55} />
        ))}
        <circle cx={388} cy={196} r={46} fill="#f4efe2" opacity={0.07} />
        <circle cx={388} cy={196} r={25} fill="#f4efe2" opacity={0.92} />
        <circle cx={398} cy={188} r={22} fill="#252e3b" />
      </svg>
      <svg
        viewBox="290 0 1250 300"
        preserveAspectRatio="xMinYMax meet"
        className="absolute inset-x-0 bottom-0 hidden h-auto w-full xl:block"
        aria-hidden="true"
        focusable="false"
      >
        <HeroScene />
      </svg>
      <svg
        viewBox="21 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[230px] w-full sm:h-[270px] lg:h-[300px] xl:hidden"
        aria-hidden="true"
        focusable="false"
      >
        <HeroScene />
      </svg>
    </>
  )
}
