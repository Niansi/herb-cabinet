'use client';

import { Herb } from '@/lib/types';

interface HerbLabelProps {
  herb: Herb;
  side: 'left' | 'right';
  onAdd: (herb: Herb) => void;
}

export default function HerbLabel({ herb, side, onAdd }: HerbLabelProps) {
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
        className="label-card relative px-1 py-2 bg-gradient-to-b from-[var(--label-tape)] to-[var(--label-aged)] border border-[var(--label-border)]"
        style={{
          minWidth: '28px',
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

        {/* 繁体字竖排 */}
        <span
          className="block text-[var(--ink-black)] font-medium leading-tight tracking-wider select-none"
          style={{
            writingMode: 'vertical-rl',
            fontSize: 'clamp(10px, 1.1vw, 14px)',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
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
