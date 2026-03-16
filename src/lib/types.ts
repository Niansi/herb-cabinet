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
}

export interface DrawerCell {
  row: number;
  col: number;
  left?: Herb;
  right?: Herb;
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
