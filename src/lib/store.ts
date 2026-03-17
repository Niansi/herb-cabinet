import { CabinetProfile, DrawerCell, Prescription, AppSettings, MiscFee, CartPrescription, ClinicSettings } from './types';

// ─── Profiles (药柜) ──────────────────────────────────────────────────────────

export async function loadProfiles(): Promise<CabinetProfile[]> {
  const res = await fetch('/api/cabinets');
  if (!res.ok) return [];
  return res.json() as Promise<CabinetProfile[]>;
}

export async function saveProfiles(profiles: CabinetProfile[]): Promise<void> {
  await fetch('/api/cabinets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profiles),
  });
}

export async function createCabinet(name: string, description?: string): Promise<CabinetProfile | null> {
  const res = await fetch('/api/cabinets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<CabinetProfile>;
}

export async function deleteCabinet(id: string): Promise<void> {
  await fetch(`/api/cabinets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export async function loadPrescriptions(): Promise<Prescription[]> {
  const res = await fetch('/api/prescriptions');
  if (!res.ok) return [];
  return res.json() as Promise<Prescription[]>;
}

export async function savePrescription(prescription: Prescription): Promise<void> {
  await fetch('/api/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prescription),
  });
}

export async function updatePrescriptionNotes(id: string, notes: string): Promise<void> {
  await fetch(`/api/prescriptions?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
}

export async function deletePrescription(id: string): Promise<void> {
  await fetch(`/api/prescriptions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Settings (杂项收费) ──────────────────────────────────────────────────────

export async function loadSettings(): Promise<AppSettings> {
  const res = await fetch('/api/misc-fees');
  if (!res.ok) return { miscFees: [{ id: 'decoction', name: '煎藥費', pricePerDose: 2, enabled: true }] };
  const fees = await res.json() as MiscFee[];
  return { miscFees: fees };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fetch('/api/misc-fees', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings.miscFees),
  });
}

// ─── Clinic Settings (医馆配置) ───────────────────────────────────────────────

export async function loadClinicSettings(): Promise<ClinicSettings> {
  const res = await fetch('/api/clinic-settings');
  if (!res.ok) return { clinicName: '藥斗子診所' };
  return res.json() as Promise<ClinicSettings>;
}

export async function saveClinicSettings(settings: ClinicSettings): Promise<void> {
  await fetch('/api/clinic-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

// ─── Cart（候诊药篓，保留 localStorage 作为客户端临时状态）────────────────────

const CART_KEY = 'herb-cabinet-cart';

export function loadCart(): CartPrescription[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) return JSON.parse(stored) as CartPrescription[];
  } catch {
    // ignore
  }
  return [];
}

export function saveCart(cart: CartPrescription[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

export function buildDrawerGrid(profile: CabinetProfile): DrawerCell[][] {
  const { herbs, config } = profile;
  const grid: DrawerCell[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row: DrawerCell[] = [];
    for (let c = 0; c < config.cols; c++) {
      const cell: DrawerCell = { row: r, col: c };
      const findHerb = (side: string) =>
        herbs.find(
          h => h.position.row === r
            && h.position.col === c
            && h.position.side === side
        );
      cell.left = findHerb('left');
      cell.right = findHerb('right');
      cell.top = findHerb('top');
      cell.bottom = findHerb('bottom');
      cell.center = findHerb('center');
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
}
