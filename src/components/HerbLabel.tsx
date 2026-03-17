'use client';

import { Herb, DrawerSlotSide } from '@/lib/types';

interface HerbLabelProps {
  herb: Herb;
  side: DrawerSlotSide;
  onAdd: (herb: Herb) => void;
}

export default function HerbLabel({ herb, side, onAdd }: HerbLabelProps) {
  // 横向标签（top/bottom）采用横排文字，纵向/居中采用竖排文字
  const isHorizontal = side === 'top' || side === 'bottom';

  return (
    <button
      className={`
        group relative flex items-center justify-center
        w-full h-full cursor-pointer
        ${side === 'left' ? 'border-r border-[var(--wood-dark)]/30' : ''}
      `}
      onClick={() => onAdd(herb)}
      title={`${herb.name} ¥${herb.pricePerGram}/克`}
    >
      {/* 标签纸主体 */}
      <div
        className="label-card relative bg-gradient-to-b from-[var(--label-tape)] to-[var(--label-aged)] border border-[var(--label-border)]"
        style={{
          minWidth: isHorizontal ? 'unset' : '38px',
          padding: isHorizontal ? '4px 8px' : '16px 8px',
          backgroundImage: `
            linear-gradient(
              to bottom,
              var(--label-tape) 0%,
              var(--label-bg) 20%,
              var(--label-aged) 100%
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(139, 115, 85, 0.06) 1px,
              rgba(139, 115, 85, 0.06) 2px
            )
          `,
          backgroundBlendMode: 'normal, multiply',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -1px 0 rgba(0,0,0,0.08),
            1px 1px 3px rgba(0,0,0,0.18),
            0 2px 4px rgba(0,0,0,0.12)
          `,
        }}
      >
        {/* 顶部胶带痕迹 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px]"
          style={{
            width: '70%',
            height: '4px',
            background: 'rgba(240, 220, 170, 0.55)',
            borderRadius: '1px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        />

        {/* 药材名称 — 横向时横排，竖向/居中时竖排 */}
        <span
          className="block text-[var(--ink-black)] font-medium leading-tight tracking-wider select-none"
          style={{
            writingMode: isHorizontal ? 'horizontal-tb' : 'vertical-rl',
            fontSize: 'clamp(11px, 1.3vw, 16px)',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
            whiteSpace: isHorizontal ? 'nowrap' : undefined,
          }}
        >
          {herb.nameTraditional}
        </span>

        {/* 右下角折角 */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 0 7px 7px',
            borderColor: `transparent transparent var(--wood-medium) transparent`,
            filter: 'drop-shadow(-1px -1px 1px rgba(0,0,0,0.12))',
          }}
        />

        {/* 印章红点 */}
        <div
          className="absolute bottom-[10px] left-1/2 -translate-x-1/2"
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--vermilion)',
            opacity: 0.55,
            boxShadow: '0 0 3px var(--vermilion)',
          }}
        />
      </div>
    </button>
  );
}
