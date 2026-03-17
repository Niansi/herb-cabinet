'use client';

import { CartPrescription, MiscFee } from '@/lib/types';

interface CartPanelProps {
  cart: CartPrescription[];
  miscFees: MiscFee[];
  onRemove: (id: string) => void;
  onClear: () => void;
  /** 点击「列印全部」时触发，交由父组件打开预览 */
  onPrintAll: () => void;
  /** 点击「调整」，将该处方移回当前药方 */
  onRestore: (id: string) => void;
}

/** 计算单张处方总价 */
function calcPrescriptionTotal(p: CartPrescription, miscFees: MiscFee[]): number {
  const herbPrice = p.items.reduce(
    (sum, item) => sum + item.herb.pricePerGram * item.weight,
    0
  );
  const miscTotal = miscFees.reduce((sum, fee) => {
    if (p.checkedFees[fee.id]) return sum + fee.pricePerDose;
    return sum;
  }, 0);
  return (herbPrice + miscTotal) * p.doseCount;
}

export default function CartPanel({ cart, miscFees, onRemove, onClear, onPrintAll, onRestore }: CartPanelProps) {
  const grandTotal = cart.reduce(
    (sum, p) => sum + calcPrescriptionTotal(p, miscFees),
    0
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: `linear-gradient(180deg, #F5F0E8 0%, #EDE4D3 100%)`,
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
            候診藥簍
          </h2>
          {cart.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onPrintAll}
                className="px-3 py-1 text-sm rounded-sm transition-colors
                  border border-[var(--brass-dark)] text-[var(--ink-light)]
                  hover:bg-[var(--brass)]/10"
                title="預覽並列印所有處方"
              >
                列印全部
              </button>
              <button
                onClick={onClear}
                className="px-3 py-1 text-sm rounded-sm transition-colors
                  border border-[var(--vermilion)]/40 text-[var(--vermilion)]
                  hover:bg-[var(--vermilion)]/10"
              >
                清空藥簍
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 处方列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--ink-faded)]">
            <p className="text-4xl mb-4">🧺</p>
            <p className="text-lg mb-2">藥簍尚空</p>
            <p className="text-sm">在藥方面板點擊「投入藥簍」</p>
            <p className="text-sm">即可暫存處方</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((p, idx) => {
              const herbPrice = p.items.reduce(
                (sum, item) => sum + item.herb.pricePerGram * item.weight,
                0
              );
              const miscTotal = miscFees.reduce((sum, fee) => {
                if (p.checkedFees[fee.id]) return sum + fee.pricePerDose;
                return sum;
              }, 0);
              const totalPrice = (herbPrice + miscTotal) * p.doseCount;

              return (
                <div
                  key={p.id}
                  className="border border-dashed border-[var(--label-border)] rounded-sm p-3"
                >
                  {/* 处方标题行 */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span
                        className="text-sm font-bold tracking-wider"
                        style={{ color: 'var(--ink-black)' }}
                      >
                        第 {idx + 1} 張
                      </span>
                      <span className="text-xs text-[var(--ink-faded)] ml-2">
                        {new Date(p.createdAt).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestore(p.id)}
                        className="text-xs text-[var(--ink-faded)] hover:text-[var(--brass)]
                          transition-colors border border-[var(--label-border)]/60
                          hover:border-[var(--brass)]/50 px-1.5 py-0.5 rounded-sm"
                        title="移回當前藥方繼續調整"
                      >
                        調整
                      </button>
                      <button
                        onClick={() => onRemove(p.id)}
                        className="text-[var(--vermilion)]/50 hover:text-[var(--vermilion)]
                          transition-colors text-sm"
                        title="移除此方"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 药材列表（紧凑） */}
                  <div className="space-y-0.5 mb-2">
                    {p.items.map(item => (
                      <div
                        key={item.herbId}
                        className="flex justify-between text-xs text-[var(--ink-light)]"
                      >
                        <span>{item.herb.nameTraditional}</span>
                        <span>{item.weight}克</span>
                      </div>
                    ))}
                  </div>

                  {/* 杂项费用 */}
                  {miscFees.some(f => p.checkedFees[f.id]) && (
                    <div className="space-y-0.5 mb-2 pt-1 border-t border-[var(--label-border)]/40">
                      {miscFees.filter(f => p.checkedFees[f.id]).map(f => (
                        <div
                          key={f.id}
                          className="flex justify-between text-xs text-[var(--ink-faded)]"
                        >
                          <span>{f.name}</span>
                          <span>¥{f.pricePerDose.toFixed(2)}/副</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 副数 & 小计 */}
                  <div
                    className="flex justify-between items-baseline pt-1 border-t border-[var(--label-border)]/40"
                  >
                    <span className="text-xs text-[var(--ink-faded)]">
                      {p.items.length} 味 · {p.doseCount} 副
                    </span>
                    <span
                      className="text-base font-bold"
                      style={{ color: 'var(--vermilion)' }}
                    >
                      ¥{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 总计 */}
      {cart.length > 0 && (
        <div
          className="px-4 py-3 border-t border-[var(--label-border)]"
          style={{ background: 'rgba(139, 115, 85, 0.05)' }}
        >
          <div className="flex justify-between text-sm text-[var(--ink-faded)] mb-1">
            <span>共 {cart.length} 張處方</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[var(--ink-light)]">藥簍總計</span>
            <span
              className="text-2xl font-bold"
              style={{ color: 'var(--vermilion)' }}
            >
              ¥{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
