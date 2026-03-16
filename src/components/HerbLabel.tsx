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
        transition-all duration-300 ease-out
        ${side === 'left' ? 'border-r border-[var(--wood-dark)]/30' : ''}
      `}
      onClick={() => onAdd(herb)}
      title={`${herb.name} ¥${herb.pricePerGram}/克`}
    >
      {/* 标签纸 */}
      <div
        className={`
          relative px-1 py-2
          bg-gradient-to-b from-[var(--label-bg)] to-[var(--label-aged)]
          border border-[var(--label-border)]
          shadow-sm
          transition-all duration-300 ease-out
          group-hover:scale-125 group-hover:z-30
          group-hover:shadow-lg group-hover:shadow-[var(--wood-dark)]/30
          group-hover:bg-gradient-to-b group-hover:from-[#EDE4D3] group-hover:to-[#E0D4B8]
        `}
        style={{
          minWidth: '28px',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(139, 115, 85, 0.05) 1px,
              rgba(139, 115, 85, 0.05) 2px
            )
          `,
        }}
      >
        {/* 繁体字竖排 */}
        <span
          className={`
            block text-[var(--ink-black)] font-medium
            leading-tight tracking-wider
            transition-colors duration-300
            group-hover:text-[var(--ink-black)]
            select-none
          `}
          style={{
            writingMode: 'vertical-rl',
            fontSize: 'clamp(10px, 1.1vw, 14px)',
          }}
        >
          {herb.nameTraditional}
        </span>
      </div>
    </button>
  );
}
