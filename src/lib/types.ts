export interface CabinetConfig {
  rows: number;
  cols: number;
}

export interface HerbPosition {
  row: number;
  col: number;
  side: 'left' | 'right';
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
  left?: Herb;
  right?: Herb;
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
