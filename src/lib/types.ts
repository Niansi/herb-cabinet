/** 每個抽屜格子中的藥材槽數量模式 */
export type DrawerSlotCount = 1 | 2 | 3 | 4;

/**
 * 格子槽位置：
 * slotCount=1: 'center'
 * slotCount=2: 'left' | 'right'（縱向）
 * slotCount=3: 'left' | 'top' | 'right'（左右縱向，上橫向）
 * slotCount=4: 'left' | 'top' | 'right' | 'bottom'（左右縱向，上下橫向）
 */
export type DrawerSlotSide = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface CabinetConfig {
  rows: number;
  cols: number;
  /** 每個抽屜格子的藥材槽數量（1-4），預設 2 */
  slotCount: DrawerSlotCount;
}

export interface HerbPosition {
  row: number;
  col: number;
  side: DrawerSlotSide;
}

export interface Herb {
  id: string;
  name: string;
  nameTraditional: string;
  pricePerGram: number;
  position: HerbPosition;
  category?: string;
}

export interface PrescriptionItem {
  herbId: string;
  herb: Herb;
  weight: number;
}

export interface Prescription {
  id: string;
  name: string;
  items: PrescriptionItem[];
  createdAt: string;
  /** 備注（可選） */
  notes?: string;
}

export interface DrawerCell {
  row: number;
  col: number;
  /** slotCount=2 時使用 */
  left?: Herb;
  right?: Herb;
  /** slotCount=3/4 時使用 */
  top?: Herb;
  bottom?: Herb;
  /** slotCount=1 時使用 */
  center?: Herb;
}

/** 杂项收费项 */
export interface MiscFee {
  id: string;
  name: string;
  /** 每副价格 */
  pricePerDose: number;
  enabled: boolean;
}

/** 一个药柜档案（支持多柜） */
export interface CabinetProfile {
  id: string;
  name: string;
  description?: string;
  config: CabinetConfig;
  herbs: Herb[];
  createdAt: string;
}

/** 全局设置 */
export interface AppSettings {
  miscFees: MiscFee[];
}

/** 候診藥簍中的一張處方（含副數、雜項費用選擇） */
export interface CartPrescription {
  id: string;
  name: string;
  items: PrescriptionItem[];
  doseCount: number;
  checkedFees: Record<string, boolean>;
  createdAt: string;
}

/** 医馆配置 */
export interface ClinicSettings {
  clinicName: string;
}
