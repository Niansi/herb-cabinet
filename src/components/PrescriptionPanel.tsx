'use client';

import { PrescriptionItem, Prescription } from '@/lib/types';
import { exportPrescriptionsToExcel } from '@/lib/excel';

interface PrescriptionPanelProps {
  items: PrescriptionItem[];
  prescriptions: Prescription[];
  onUpdateWeight: (herbId: string, weight: number) => void;
  onRemoveItem: (herbId: string) => void;
  onClear: () => void;
  onSave: () => void;
}

export default function PrescriptionPanel({
  items,
  prescriptions,
  onUpdateWeight,
  onRemoveItem,
  onClear,
  onSave,
}: PrescriptionPanelProps) {
  const totalPrice = items.reduce(
    (sum, item) => sum + item.herb.pricePerGram * item.weight,
    0
  );

  const totalWeight = items.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  const handlePrint = () => {
    const rows = items.map(item => `
      <tr>
        <td>${item.herb.nameTraditional}</td>
        <td style="text-align:right">${item.weight}</td>
        <td style="text-align:right">¥${item.herb.pricePerGram.toFixed(3)}</td>
        <td style="text-align:right">¥${(item.herb.pricePerGram * item.weight).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>藥方</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif;
      background: #F5F0E8;
      color: #2C2C2C;
      padding: 48px 56px;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.4em;
      color: #2C2C2C;
      padding-bottom: 12px;
      border-bottom: 2px solid #C53D43;
      display: inline-block;
    }
    .date {
      font-size: 13px;
      color: #6B6358;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    th {
      font-size: 13px;
      font-weight: 600;
      color: #4A4A4A;
      border-bottom: 1px solid #C4B090;
      padding: 8px 10px;
      text-align: left;
    }
    th:not(:first-child) { text-align: right; }
    td {
      font-size: 14px;
      padding: 9px 10px;
      border-bottom: 1px solid rgba(196,176,144,0.4);
    }
    tr:nth-child(even) td { background: rgba(232,220,200,0.3); }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #C4B090;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .footer-left { font-size: 13px; color: #6B6358; line-height: 1.8; }
    .total-price { font-size: 26px; font-weight: 700; color: #C53D43; }
    .total-label { font-size: 13px; color: #4A4A4A; margin-right: 8px; }
    .seal {
      margin-top: 48px;
      text-align: right;
      font-size: 12px;
      color: #B8B0A0;
      letter-spacing: 0.1em;
    }
    @media print {
      body { padding: 24px 32px; background: white; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">藥　方</div>
    <div class="date">開方日期：${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>藥材</th>
        <th style="text-align:right">重量（克）</th>
        <th style="text-align:right">單價（元/克）</th>
        <th style="text-align:right">小計（元）</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <div class="footer-left">
      <div>共 ${items.length} 味藥</div>
      <div>總重 ${totalWeight.toFixed(1)} 克</div>
    </div>
    <div>
      <span class="total-label">合　計</span>
      <span class="total-price">¥${totalPrice.toFixed(2)}</span>
    </div>
  </div>
  <div class="seal">藥斗子 · 中藥開方管理系統</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onafterprint = () => URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
      alert('請允許彈出視窗以使用列印功能');
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: `linear-gradient(
          180deg,
          #F5F0E8 0%,
          #EDE4D3 100%
        )`,
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139, 115, 85, 0.03) 2px,
            rgba(139, 115, 85, 0.03) 4px
          )
        `,
        border: '1px solid var(--label-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      }}
    >
      {/* 标题 */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--label-border)]">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold tracking-widest"
            style={{ color: 'var(--ink-black)' }}
          >
            藥方
          </h2>
          <div className="flex gap-2">
            {items.length > 0 && (
              <>
                <button
                  onClick={onSave}
                  className="px-3 py-1 text-sm rounded-sm transition-colors
                    border border-[var(--brass-dark)] text-[var(--ink-light)]
                    hover:bg-[var(--brass)]/10"
                  title="存入歷史記錄"
                >
                  存方
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 text-sm rounded-sm transition-colors
                    border border-[var(--brass-dark)] text-[var(--ink-light)]
                    hover:bg-[var(--brass)]/10"
                >
                  列印
                </button>
                <button
                  onClick={onClear}
                  className="px-3 py-1 text-sm rounded-sm transition-colors
                    border border-[var(--vermilion)]/40 text-[var(--vermilion)]
                    hover:bg-[var(--vermilion)]/10"
                >
                  清方
                </button>
              </>
            )}
            <button
              onClick={() => exportPrescriptionsToExcel(prescriptions)}
              disabled={prescriptions.length === 0}
              className="px-3 py-1 text-sm rounded-sm transition-colors
                border border-[var(--brass-dark)]/60 text-[var(--ink-faded)]
                hover:text-[var(--ink-light)] hover:bg-[var(--brass)]/10
                disabled:opacity-30 disabled:cursor-not-allowed"
              title={`匯出 ${ prescriptions.length } 備歷史藥方`}
            >
              匯出記錄
            </button>
          </div>
        </div>
      </div>

      {/* 药材列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--ink-faded)]">
            <p className="text-lg mb-2">點擊藥櫃中的藥材</p>
            <p className="text-sm">即可加入藥方</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={item.herbId}
                className="flex items-center gap-2 py-2 border-b border-[var(--label-border)]/50
                  group/item"
              >
                {/* 序号 */}
                <span className="text-xs text-[var(--ink-faded)] w-5 text-right shrink-0">
                  {index + 1}.
                </span>

                {/* 药名 */}
                <span
                  className="font-medium text-[var(--ink-black)] shrink-0"
                  style={{ minWidth: '3.5em' }}
                >
                  {item.herb.nameTraditional}
                </span>

                {/* 重量输入 */}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    value={item.weight || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      onUpdateWeight(item.herbId, isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-14 px-1 py-0.5 text-right text-sm
                      bg-transparent border-b border-[var(--ink-faded)]/30
                      focus:border-[var(--vermilion)] focus:outline-none
                      transition-colors"
                  />
                  <span className="text-xs text-[var(--ink-faded)]">克</span>
                </div>

                {/* 单价 x 重量 = 小计 */}
                <span className="text-sm text-[var(--ink-light)] w-16 text-right shrink-0">
                  ¥{(item.herb.pricePerGram * item.weight).toFixed(2)}
                </span>

                {/* 删除 */}
                <button
                  onClick={() => onRemoveItem(item.herbId)}
                  className="opacity-0 group-hover/item:opacity-100 transition-opacity
                    text-[var(--vermilion)]/60 hover:text-[var(--vermilion)]
                    text-sm ml-1 shrink-0"
                  title="移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 合计 */}
      {items.length > 0 && (
        <div
          className="px-4 py-3 border-t border-[var(--label-border)]"
          style={{ background: 'rgba(139, 115, 85, 0.05)' }}
        >
          <div className="flex justify-between text-sm text-[var(--ink-faded)] mb-1">
            <span>共 {items.length} 味藥</span>
            <span>總重 {totalWeight.toFixed(1)} 克</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[var(--ink-light)]">合計</span>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--vermilion)' }}
            >
              ¥{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
