'use client';

import { useEffect, useRef } from 'react';
import { CartPrescription, MiscFee } from '@/lib/types';

interface PrintPreviewModalProps {
  prescriptions: CartPrescription[];
  miscFees: MiscFee[];
  onClose: () => void;
  /** 打印按钮被点击后，在正式打印前先保存处方，传入所有处方 */
  onBeforePrint: (prescriptions: CartPrescription[]) => void;
}

/** A4 竖向：210×297mm，常用 96dpi 换算约 794×1123px */
const A4_W = 794;
const A4_H = 1123;

function buildPrescriptionHtml(
  p: CartPrescription,
  idx: number,
  total: number,
  miscFees: MiscFee[]
): string {
  const herbPrice = p.items.reduce(
    (sum, item) => sum + item.herb.pricePerGram * item.weight,
    0
  );
  const miscTotal = miscFees.reduce((sum, fee) => {
    if (p.checkedFees[fee.id]) return sum + fee.pricePerDose;
    return sum;
  }, 0);
  const totalPrice = (herbPrice + miscTotal) * p.doseCount;
  const totalWeight = p.items.reduce((sum, item) => sum + item.weight, 0);

  const rows = p.items.map(item => `
    <tr>
      <td>${item.herb.nameTraditional}</td>
      <td style="text-align:right">${item.weight}</td>
      <td style="text-align:right">¥${item.herb.pricePerGram.toFixed(3)}</td>
      <td style="text-align:right">¥${(item.herb.pricePerGram * item.weight).toFixed(2)}</td>
    </tr>
  `).join('');

  const miscRows = miscFees
    .filter(f => p.checkedFees[f.id])
    .map(f => `<div style="text-align:right;margin-bottom:4px;font-size:12px;color:#6B6358;">
      ${f.name} ¥${f.pricePerDose.toFixed(2)}/副
    </div>`)
    .join('');

  const titleSuffix = total > 1 ? `（第 ${idx + 1} 張，共 ${total} 張）` : '';

  return `
    <div class="page-card">
      <div class="p-header">
        <div class="p-title">藥　方${titleSuffix}</div>
        <div class="p-date">開方日期：${new Date(p.createdAt).toLocaleDateString('zh-TW', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}</div>
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
      <div class="p-footer">
        <div class="p-footer-left">
          <div>共 ${p.items.length} 味藥</div>
          <div>總重 ${totalWeight.toFixed(1)} 克</div>
          <div>${p.doseCount} 副</div>
        </div>
        <div>
          <div style="text-align:right;margin-bottom:4px;font-size:12px;color:#6B6358;">藥材小計 ¥${herbPrice.toFixed(2)}</div>
          ${miscRows}
          ${p.doseCount > 1
            ? `<div style="text-align:right;margin-bottom:4px;font-size:12px;color:#6B6358;">× ${p.doseCount} 副</div>`
            : ''}
          <span class="total-label">合　計</span>
          <span class="total-price">¥${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Serif SC','Songti SC','STSong','SimSun',serif;
    background: #F5F0E8;
    color: #2C2C2C;
  }
  .page-card {
    padding: 40px 48px;
    page-break-after: always;
    min-height: 100vh;
  }
  .page-card:last-child { page-break-after: avoid; }
  .p-header { text-align: center; margin-bottom: 28px; }
  .p-title {
    font-size: 24px; font-weight: 900; letter-spacing: 0.4em;
    padding-bottom: 10px; border-bottom: 2px solid #C53D43; display: inline-block;
  }
  .p-date { font-size: 12px; color: #6B6358; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th {
    font-size: 12px; font-weight: 600; color: #4A4A4A;
    border-bottom: 1px solid #C4B090; padding: 7px 8px; text-align: left;
  }
  th:not(:first-child) { text-align: right; }
  td { font-size: 13px; padding: 8px; border-bottom: 1px solid rgba(196,176,144,0.4); }
  tr:nth-child(even) td { background: rgba(232,220,200,0.3); }
  .p-footer {
    margin-top: 20px; border-top: 1px solid #C4B090;
    padding-top: 14px; display: flex; justify-content: space-between; align-items: baseline;
  }
  .p-footer-left { font-size: 12px; color: #6B6358; line-height: 1.8; }
  .total-price { font-size: 24px; font-weight: 700; color: #C53D43; }
  .total-label { font-size: 12px; color: #4A4A4A; margin-right: 8px; }
  .seal { text-align: right; font-size: 11px; color: #B8B0A0; letter-spacing: 0.1em; padding: 12px 48px; }
  @media print {
    body { background: white; }
    .page-card { padding: 20px 28px; }
    @page { size: A4 portrait; margin: 1.2cm; }
  }
`;

export default function PrintPreviewModal({
  prescriptions,
  miscFees,
  onClose,
  onBeforePrint,
}: PrintPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 构建打印 HTML
  const sections = prescriptions
    .map((p, i) => buildPrescriptionHtml(p, i, prescriptions.length, miscFees))
    .join('');

  const grandTotal = prescriptions.reduce((sum, p) => {
    const herbPrice = p.items.reduce(
      (s, item) => s + item.herb.pricePerGram * item.weight,
      0
    );
    const miscTotal = miscFees.reduce((s, fee) => {
      if (p.checkedFees[fee.id]) return s + fee.pricePerDose;
      return s;
    }, 0);
    return sum + (herbPrice + miscTotal) * p.doseCount;
  }, 0);

  const grandTotalBar = prescriptions.length > 1
    ? `<div class="grand-bar">
        <span class="grand-label">合計（共 ${prescriptions.length} 張）</span>
        <span class="grand-price">¥${grandTotal.toFixed(2)}</span>
      </div>`
    : '';

  const printHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <title>列印藥方</title>
  <style>
    ${PRINT_STYLES}
    .grand-bar {
      padding: 28px 48px; border-top: 2px solid #C4B090; background: #EDE4D3;
      display: flex; justify-content: space-between; align-items: baseline;
    }
    .grand-label { font-size: 16px; font-weight: 600; color: #4A4A4A; letter-spacing: 0.2em; }
    .grand-price { font-size: 32px; font-weight: 900; color: #C53D43; }
  </style>
</head>
<body>
  ${sections}
  ${grandTotalBar}
  <div class="seal">藥斗子 · 中藥開方管理系統</div>
</body>
</html>`;

  // 将 HTML 写入 iframe 用于预览
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(printHtml);
    doc.close();
  }, [printHtml]);

  const handlePrint = () => {
    // 先保存处方
    onBeforePrint(prescriptions);
    // 调用 iframe 打印
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.6)' }}>
      {/* 顶栏 */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b"
        style={{
          background: 'var(--rice-paper)',
          borderColor: 'var(--label-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-base font-bold tracking-widest" style={{ color: 'var(--ink-black)' }}>
            列印預覽
          </h2>
          <span className="text-sm text-[var(--ink-faded)]">
            {prescriptions.length} 張藥方 · A4 直向
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-1.5 text-sm font-medium tracking-wider
              border border-[var(--vermilion)]/50 text-[var(--vermilion)]
              hover:bg-[var(--vermilion)]/10 transition-colors rounded-sm"
          >
            列印
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm tracking-wider
              border border-[var(--label-border)] text-[var(--ink-faded)]
              hover:bg-[var(--label-bg)] transition-colors rounded-sm"
          >
            關閉
          </button>
        </div>
      </div>

      {/* 预览区域 — A4 网格 */}
      <div
        className="flex-1 overflow-auto py-6"
        style={{ background: '#888' }}
      >
        {/* A4 网格排版：多张时用 wrap 网格，每格为缩小版 A4 */}
        <div
          className="flex flex-wrap justify-center gap-6 px-6"
        >
          {prescriptions.map((p, idx) => {
            const herbPrice = p.items.reduce(
              (sum, item) => sum + item.herb.pricePerGram * item.weight,
              0
            );
            const miscTotal = miscFees.reduce((sum, fee) => {
              if (p.checkedFees[fee.id]) return sum + fee.pricePerDose;
              return sum;
            }, 0);
            const totalPrice = (herbPrice + miscTotal) * p.doseCount;

            // 预览卡片按照 A4 比例缩放，宽度固定 340px
            const previewW = 340;
            const previewH = Math.round(previewW * (A4_H / A4_W));

            return (
              <div
                key={p.id}
                style={{
                  width: previewW,
                  height: previewH,
                  background: '#F5F0E8',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {/* 内容按比例缩放渲染 */}
                <div
                  style={{
                    width: A4_W,
                    height: A4_H,
                    transform: `scale(${previewW / A4_W})`,
                    transformOrigin: 'top left',
                    padding: '40px 48px',
                    fontFamily: "'Songti SC', 'STSong', 'SimSun', serif",
                    color: '#2C2C2C',
                  }}
                >
                  {/* 标题 */}
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                      fontSize: 24, fontWeight: 900, letterSpacing: '0.4em',
                      paddingBottom: 10, borderBottom: '2px solid #C53D43',
                      display: 'inline-block',
                    }}>
                      藥　方
                      {prescriptions.length > 1 && (
                        <span style={{ fontSize: 14, fontWeight: 400 }}>
                          （第 {idx + 1} 張）
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6358', marginTop: 8 }}>
                      開方日期：{new Date(p.createdAt).toLocaleDateString('zh-TW', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* 药材表 */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #C4B090' }}>
                        {['藥材', '重量', '單價', '小計'].map((col, ci) => (
                          <th key={col} style={{
                            fontSize: 11, color: '#4A4A4A', padding: '5px 6px',
                            textAlign: ci > 0 ? 'right' : 'left', fontWeight: 600,
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.items.map((item, ri) => (
                        <tr
                          key={item.herbId}
                          style={{ background: ri % 2 === 1 ? 'rgba(232,220,200,0.3)' : 'transparent' }}
                        >
                          <td style={{ fontSize: 12, padding: '6px 6px', borderBottom: '1px solid rgba(196,176,144,0.3)' }}>
                            {item.herb.nameTraditional}
                          </td>
                          <td style={{ fontSize: 12, padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid rgba(196,176,144,0.3)' }}>
                            {item.weight}g
                          </td>
                          <td style={{ fontSize: 11, padding: '6px 6px', textAlign: 'right', color: '#6B6358', borderBottom: '1px solid rgba(196,176,144,0.3)' }}>
                            ¥{item.herb.pricePerGram.toFixed(3)}
                          </td>
                          <td style={{ fontSize: 12, padding: '6px 6px', textAlign: 'right', borderBottom: '1px solid rgba(196,176,144,0.3)' }}>
                            ¥{(item.herb.pricePerGram * item.weight).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 底部合计 */}
                  <div style={{
                    borderTop: '1px solid #C4B090', paddingTop: 12,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  }}>
                    <div style={{ fontSize: 12, color: '#6B6358', lineHeight: 1.8 }}>
                      <div>共 {p.items.length} 味藥</div>
                      <div>{p.doseCount} 副</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#6B6358', marginBottom: 2 }}>
                        藥材小計 ¥{herbPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: '#4A4A4A', marginRight: 4, display: 'inline' }}>
                        合　計
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#C53D43' }}>
                        ¥{totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 水印/落款 */}
                  <div style={{
                    position: 'absolute', bottom: 24, right: 48,
                    fontSize: 11, color: '#C8C0B0', letterSpacing: '0.1em',
                  }}>
                    藥斗子 · 中藥開方管理系統
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部信息栏 */}
      {prescriptions.length > 1 && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-2 border-t text-sm"
          style={{ background: 'var(--rice-paper)', borderColor: 'var(--label-border)' }}
        >
          <span className="text-[var(--ink-faded)]">
            共 {prescriptions.length} 張處方
          </span>
          <span className="font-bold" style={{ color: 'var(--vermilion)' }}>
            總計 ¥{grandTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* 隐藏的 iframe 用于实际打印 */}
      <iframe
        ref={iframeRef}
        title="print-frame"
        style={{ position: 'absolute', width: 0, height: 0, border: 'none', opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}
