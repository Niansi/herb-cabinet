import * as XLSX from 'xlsx';
import { CabinetProfile, Herb, Prescription } from './types';

// ─── 藥柜导出 ──────────────────────────────────────────────────────────────────

/**
 * 将当前药柜数据导出为 Excel 文件
 * Sheet1: 药材清单，Sheet2: 药柜设定
 */
export function exportCabinetToExcel(profile: CabinetProfile): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 药材清单
  const herbRows = profile.herbs.map(h => ({
    '繁體名': h.nameTraditional,
    '簡體名': h.name,
    '分類': h.category ?? '',
    '單價(元/克)': h.pricePerGram,
    '行(0起)': h.position.row,
    '列(0起)': h.position.col,
    '左右': h.position.side,
  }));
  const ws1 = XLSX.utils.json_to_sheet(herbRows);
  // 设置列宽
  ws1['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 6 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '藥材清單');

  // Sheet 2: 药柜设置
  const configRows = [{
    '藥柜名稱': profile.name,
    '說明': profile.description ?? '',
    '行數': profile.config.rows,
    '列數': profile.config.cols,
    '藥材總數': profile.herbs.length,
    '建立時間': profile.createdAt,
  }];
  const ws2 = XLSX.utils.json_to_sheet(configRows);
  ws2['!cols'] = [
    { wch: 16 }, { wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '藥柜設定');

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = profile.name.replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `藥柜-${safeName}-${dateStr}.xlsx`);
}

// ─── 藥柜导入 ──────────────────────────────────────────────────────────────────

export interface ImportPreview {
  herbs: Herb[];
  config?: { rows: number; cols: number; slotCount?: number };
  name?: string;
  description?: string;
  error?: string;
}

/**
 * 从 Excel 文件解析药柜数据
 * 返回 ImportPreview，供调用方在确认后应用
 */
export function importCabinetFromExcel(file: File): Promise<ImportPreview> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // 读取药材清单 Sheet（第一个 Sheet）
        const ws = wb.Sheets[wb.SheetNames[0]];
        type HerbRow = {
          '繁體名'?: string;
          '簡體名'?: string;
          '分類'?: string;
          '單價(元/克)'?: number | string;
          '行(0起)'?: number | string;
          '列(0起)'?: number | string;
          '左右'?: string;
        };
        const rows = XLSX.utils.sheet_to_json<HerbRow>(ws);

        if (!rows.length) {
          resolve({ herbs: [], error: '未找到藥材資料，請確認第一個 Sheet 為藥材清單' });
          return;
        }

        const herbs: Herb[] = rows
          .filter(r => r['繁體名'] || r['簡體名'])
          .map((r, i) => ({
            id: `imported-${Date.now()}-${i}`,
            name: String(r['簡體名'] ?? r['繁體名'] ?? ''),
            nameTraditional: String(r['繁體名'] ?? r['簡體名'] ?? ''),
            pricePerGram: parseFloat(String(r['單價(元/克)'] ?? '0')) || 0,
            position: {
              row: parseInt(String(r['行(0起)'] ?? '0')) || 0,
              col: parseInt(String(r['列(0起)'] ?? '0')) || 0,
              side: (r['左右'] === 'right' ? 'right' : 'left') as 'left' | 'right',
            },
            category: String(r['分類'] ?? ''),
          }));

        // 尝试读取药柜设置 Sheet
        let config: { rows: number; cols: number } | undefined;
        let name: string | undefined;
        let description: string | undefined;

        if (wb.SheetNames.length >= 2) {
          const ws2 = wb.Sheets[wb.SheetNames[1]];
          type ConfigRow = {
            '藥柜名稱'?: string;
            '說明'?: string;
            '行數'?: number | string;
            '列數'?: number | string;
          };
          const cfgRows = XLSX.utils.sheet_to_json<ConfigRow>(ws2);
          if (cfgRows.length > 0) {
            const cfg = cfgRows[0];
            name = cfg['藥柜名稱'] ? String(cfg['藥柜名稱']) : undefined;
            description = cfg['說明'] ? String(cfg['說明']) : undefined;
            const r = parseInt(String(cfg['行數'] ?? '0'));
            const c = parseInt(String(cfg['列數'] ?? '0'));
            if (r > 0 && c > 0) config = { rows: r, cols: c };
          }
        }

        resolve({ herbs, config, name, description });
      } catch (err) {
        resolve({ herbs: [], error: `解析失敗：${(err as Error).message}` });
      }
    };
    reader.onerror = () => resolve({ herbs: [], error: '文件讀取失敗' });
    reader.readAsArrayBuffer(file);
  });
}

// ─── 藥方记录导出 ──────────────────────────────────────────────────────────────

/**
 * 将所有历史药方导出为 Excel
 * 使用单一 Sheet，每方之间用空行分隔
 */
export function exportPrescriptionsToExcel(prescriptions: Prescription[]): void {
  if (prescriptions.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  let rowIndex = 0;

  const setCells = (rowData: (string | number | null)[]) => {
    rowData.forEach((val, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (val === null) return;
      ws[cellRef] = {
        v: val,
        t: typeof val === 'number' ? 'n' : 's',
      };
    });
    rowIndex++;
  };

  prescriptions.forEach((pres, idx) => {
    // 方标题行（含备注）
    const dateStr = new Date(pres.createdAt).toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    setCells([`【${idx + 1}】${pres.name}　開方時間：${dateStr}`, null, null, null]);

    // 如有备注，额外加一行
    if (pres.notes) {
      setCells([`備注：${pres.notes}`, null, null, null]);
    }

    // 列头
    setCells(['藥材', '重量(克)', '單價(元/克)', '小計(元)']);

    // 药材行
    const totalWeight = pres.items.reduce((s, it) => s + it.weight, 0);
    const totalPrice = pres.items.reduce(
      (s, it) => s + it.herb.pricePerGram * it.weight,
      0
    );

    pres.items.forEach(item => {
      setCells([
        item.herb.nameTraditional,
        item.weight,
        item.herb.pricePerGram,
        parseFloat((item.herb.pricePerGram * item.weight).toFixed(4)),
      ]);
    });

    // 合计行
    setCells([
      `共 ${pres.items.length} 味藥　總重 ${totalWeight.toFixed(1)} 克`,
      null,
      '合計',
      parseFloat(totalPrice.toFixed(4)),
    ]);

    // 空行分隔
    rowIndex++;
  });

  // 更新 sheet 范围
  ws['!ref'] = XLSX.utils.encode_range(
    { r: 0, c: 0 },
    { r: rowIndex - 1, c: 3 }
  );

  // 设置列宽
  ws['!cols'] = [
    { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '藥方記錄');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `藥方記錄-${dateStr}.xlsx`);
}

// ─── 藥方导入 ──────────────────────────────────────────────────────────────

/**
 * 从 Excel 文件导入处方记录（与 exportPrescriptionsToExcel 格式对应）
 * 返回解析到的处方数组，解析失败或格式不匹配返回空数组
 */
export function importPrescriptionsFromExcel(file: File): Promise<Prescription[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
          header: 1,
          defval: '',
        });

        const prescriptions: Prescription[] = [];
        let i = 0;

        while (i < rows.length) {
          const row = rows[i];
          // 标题行格式：【N】处方名　开方时间：...
          const titleCell = String(row[0] ?? '').trim();
          if (!titleCell.startsWith('【')) {
            i++;
            continue;
          }

          // 解析处方名 & 时间
          const nameMatch = titleCell.match(/^【\d+】(.+?)(?:　|　|開方時間：|$)/);
          const presName = nameMatch ? nameMatch[1].trim() : titleCell;

          // 下一行是列头，再下一行起是药材
          i += 2; // 跳过列头行
          const items: import('./types').PrescriptionItem[] = [];

          while (i < rows.length) {
            const dataRow = rows[i];
            const herbName = String(dataRow[0] ?? '').trim();
            // 遇到合计行或空行则结束当前处方
            if (!herbName || herbName.startsWith('共 ')) break;
            const weight = parseFloat(String(dataRow[1] ?? '0')) || 0;
            const pricePerGram = parseFloat(String(dataRow[2] ?? '0')) || 0;
            const herbId = `imported-${Date.now()}-${i}`;
            items.push({
              herbId,
              herb: {
                id: herbId,
                name: herbName,
                nameTraditional: herbName,
                pricePerGram,
                position: { row: 0, col: 0, side: 'left' },
                category: '',
              },
              weight,
            });
            i++;
          }

          if (items.length > 0) {
            prescriptions.push({
              id: `imported-pres-${Date.now()}-${prescriptions.length}`,
              name: presName,
              items,
              createdAt: new Date().toISOString(),
            });
          }
        }

        resolve(prescriptions);
      } catch {
        resolve([]);
      }
    };
    reader.onerror = () => resolve([]);
    reader.readAsArrayBuffer(file);
  });
}
