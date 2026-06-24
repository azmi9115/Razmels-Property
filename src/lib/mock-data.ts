export type Building = {
  id: string;
  code: string;
  type: "Kontrakan" | "Kosan";
  rent_price: number;
  rent_period: "Bulanan" | "Tahunan";
};

export type Tenant = {
  id: string;
  name: string;
  nik: string;
  phone_1: string;
  phone_2?: string;
  emergency_contact?: string;
  building_id: string;
  entry_date: string; // ISO Date String
  exit_date?: string | null; // ISO Date String
  status: "Active" | "Deactive";
};

export type Payment = {
  id: string;
  tenant_id: string;
  amount: number;
  transfer_date: string;
  rent_duration_months: number;
  rent_end_date: string;
};

export type Cashflow = {
  id: string;
  type: "Pemasukan" | "Pengeluaran";
  category: string;
  transaction_date: string;
  description: string;
  amount: number;
};

// --- MOCK DATA ---

export const mockBuildings: Building[] = [
  { id: "b1", code: "DA01", type: "Kontrakan", rent_price: 35000000, rent_period: "Tahunan" },
  { id: "b2", code: "DA02", type: "Kontrakan", rent_price: 32500000, rent_period: "Tahunan" },
  { id: "b3", code: "B01", type: "Kosan", rent_price: 750000, rent_period: "Bulanan" },
  { id: "b4", code: "B02", type: "Kosan", rent_price: 750000, rent_period: "Bulanan" },
];

export const mockTenants: Tenant[] = [
  {
    id: "t1",
    name: "Budi Santoso",
    nik: "3201012345678901",
    phone_1: "081234567890",
    building_id: "b1",
    entry_date: "2023-01-15",
    status: "Active",
  },
  {
    id: "t2",
    name: "Siti Aminah",
    nik: "3201019876543210",
    phone_1: "085678901234",
    building_id: "b3",
    entry_date: "2024-05-01",
    status: "Active",
  },
  {
    id: "t3",
    name: "Agus Pratama",
    nik: "3201015555555555",
    phone_1: "089912345678",
    building_id: "b4",
    entry_date: "2022-03-10",
    exit_date: "2023-03-10",
    status: "Deactive",
  },
];

export const mockPayments: Payment[] = [
  {
    id: "p1",
    tenant_id: "t1",
    amount: 35000000,
    transfer_date: "2023-01-15",
    rent_duration_months: 12,
    rent_end_date: "2024-01-15",
  },
  {
    id: "p2",
    tenant_id: "t1",
    amount: 35000000,
    transfer_date: "2024-01-10",
    rent_duration_months: 12,
    rent_end_date: "2025-01-15",
  },
  {
    id: "p3",
    tenant_id: "t2",
    amount: 750000,
    transfer_date: "2024-05-01",
    rent_duration_months: 1,
    rent_end_date: "2024-06-01",
  },
];

export const mockCashflow: Cashflow[] = [
  {
    id: "c1",
    type: "Pemasukan",
    category: "Sewa Kosan",
    transaction_date: "2024-05-01",
    description: "Sewa kos B01 a.n Siti Aminah",
    amount: 750000,
  },
  {
    id: "c2",
    type: "Pengeluaran",
    category: "Listrik & Air",
    transaction_date: "2024-05-05",
    description: "Bayar token listrik kosan",
    amount: 250000,
  },
  {
    id: "c3",
    type: "Pemasukan",
    category: "Sewa Kontrakan",
    transaction_date: "2024-01-10",
    description: "Sewa kontrakan DA01 a.n Budi Santoso",
    amount: 35000000,
  },
];
