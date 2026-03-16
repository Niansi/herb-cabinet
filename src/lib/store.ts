import { CabinetProfile, DrawerCell, Prescription } from './types';
import { DEFAULT_PROFILES } from './data';

const PROFILES_KEY = 'herb-cabinet-profiles';
const ACTIVE_KEY = 'herb-cabinet-active-id';
const PRESCRIPTIONS_KEY = 'herb-cabinet-prescriptions';

// ─── Profiles CRUD ────────────────────────────────────────────────────────────

export function loadProfiles(): CabinetProfile[] {
  if (typeof window === 'undefined') return DEFAULT_PROFILES;
  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) {
      const parsed: CabinetProfile[] = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PROFILES;
}

export function saveProfiles(profiles: CabinetProfile[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function loadActiveProfileId(profiles: CabinetProfile[]): string {
  if (typeof window === 'undefined') return profiles[0]?.id ?? '';
  try {
    const stored = localStorage.getItem(ACTIVE_KEY);
    if (stored && profiles.find(p => p.id === stored)) return stored;
  } catch {
    // ignore
  }
  return profiles[0]?.id ?? '';
}

export function saveActiveProfileId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_KEY, id);
}

// ─── Prescriptions CRUD ───────────────────────────────────────────────────────

export function loadPrescriptions(): Prescription[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRESCRIPTIONS_KEY);
    if (stored) return JSON.parse(stored) as Prescription[];
  } catch {
    // ignore
  }
  return [];
}

export function savePrescriptions(prescriptions: Prescription[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

export function buildDrawerGrid(profile: CabinetProfile): DrawerCell[][] {
  const { herbs, config } = profile;
  const grid: DrawerCell[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row: DrawerCell[] = [];
    for (let c = 0; c < config.cols; c++) {
      const cell: DrawerCell = { row: r, col: c };
      const left = herbs.find(
        h => h.position.row === r
          && h.position.col === c
          && h.position.side === 'left'
      );
      const right = herbs.find(
        h => h.position.row === r
          && h.position.col === c
          && h.position.side === 'right'
      );
      if (left) cell.left = left;
      if (right) cell.right = right;
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
}

// ─── Backward-compatible single-profile helpers (kept for minimal diff) ───────

export function loadHerbs() {
  const profiles = loadProfiles();
  return profiles[0]?.herbs ?? [];
}

export function loadCabinetConfig() {
  const profiles = loadProfiles();
  return profiles[0]?.config ?? { rows: 7, cols: 8 };
}
