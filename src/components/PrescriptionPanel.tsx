'use client';

import { useState } from 'react';
import { PrescriptionItem, Prescription, MiscFee, CartPrescription } from '@/lib/types';

interface PrescriptionPanelProps {
  items: PrescriptionItem[];
  prescriptions: Prescription[];
  miscFees: MiscFee[];
  onUpdateWeight: (herbId: string, weight: number) => void;
  onRemoveItem: (herbId: string) => void;
  onClear: () => void;
  onAddToCart: (p: CartPrescription) => void;
  /** 点击「列印」时触发，传入构造好的 CartPrescription 用于预览 */
  onPrint: (p: CartPrescription) => void;
}

export default function PrescriptionPanel({
  items,
  prescriptions: _prescriptions,
  miscFees,
  onUpdateWeight,
  onRemoveItem,
  onClear,
  onAddToCart,
  onPrint,
}: PrescriptionPanelProps) {
  const [doseCount, setDoseCount] = useState(1);
  const [checkedFees, setCheckedFees] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    miscFees.forEach(f => { init[f.id] = f.enabled; });
    return init;
  });

  const herbPrice = items.reduce(
    (sum, item) => sum + item.herb.pricePerGram * item.weight,
    0
  );

  const totalWeight = items.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  const miscTotal = miscFees.reduce((sum, fee) => {
    if (checkedFees[fee.id]) return sum + fee.pricePerDose;
    return sum;
  }, 0);

  const totalPrice = (herbPrice + miscTotal) * doseCount;

  const buildCartPrescription = (): CartPrescription => ({
    id: `cart-${Date.now()}`,
    name: `藥方 ${new Date().toLocaleDateString('zh-TW')}`,
    items: [...items],
    doseCount,
    checkedFees: { ...checkedFees },
    createdAt: new Date().toISOString(),
  });

  const handleAddToCart = () => {
    if (items.length === 0) return;
    onAddToCart(buildCartPrescription());
    // 投入藥簍後自動清空當前藥方
    onClear();
  };

  const handlePrint = () => {
    if (items.length === 0) return;
    onPrint(buildCartPrescription());
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
          <div className="flex gap-2 flex-wrap justify-end">
            {items.length > 0 && (
              <>
                <button
                  onClick={handleAddToCart}
                  className="px-3 py-1 text-sm rounded-sm transition-colors
                    border text-[var(--ink-light)]
                    hover:bg-green-900/10"
                  style={{ borderColor: '#4a7a4a' }}
                  title="暫存至候診藥簍並清空當前藥方"
                >
                  投入藥簍
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

          {/* 杂项收费 */}
          <div className="space-y-1 mb-2">
            {miscFees.map(fee => (
              <label
                key={fee.id}
                className="flex items-center gap-2 text-sm text-[var(--ink-light)] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checkedFees[fee.id]}
                  onChange={e => setCheckedFees(prev => ({
                    ...prev,
                    [fee.id]: e.target.checked,
                  }))}
                  className="accent-[var(--vermilion)]"
                />
                <span>{fee.name}</span>
                <span className="text-[var(--ink-faded)] text-xs">
                  ¥{fee.pricePerDose.toFixed(2)}/副
                </span>
              </label>
            ))}
          </div>

          {/* 副数 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[var(--ink-light)]">開</span>
            <input
              type="number"
              value={doseCount}
              onChange={e => {
                const val = parseInt(e.target.value);
                setDoseCount(isNaN(val) || val < 1 ? 1 : val);
              }}
              min={1}
              className="w-12 px-1 py-0.5 text-center text-sm
                bg-transparent border-b border-[var(--ink-faded)]/30
                focus:border-[var(--vermilion)] focus:outline-none
                transition-colors"
            />
            <span className="text-sm text-[var(--ink-light)]">副</span>
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
