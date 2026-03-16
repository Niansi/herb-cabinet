'use client';

import { DrawerCell, Herb } from '@/lib/types';
import HerbLabel from './HerbLabel';

interface DrawerProps {
  cell: DrawerCell;
  onAddHerb: (herb: Herb) => void;
}

export default function Drawer({ cell, onAddHerb }: DrawerProps) {
  return (
    <div
      className={`
        relative flex
        bg-gradient-to-b from-[var(--wood-light)] via-[var(--wood-medium)] to-[var(--wood-dark)]
        border border-[var(--wood-dark)]
        rounded-sm overflow-visible
        aspect-square
      `}
      style={{
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -2px 4px rgba(0,0,0,0.3),
          0 1px 2px rgba(0,0,0,0.2)
        `,
        backgroundImage: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.03) 3px,
            rgba(0,0,0,0.03) 6px
          )
        `,
      }}
    >
      {/* 抽屉内凹效果 */}
      <div
        className="absolute inset-[3px] rounded-sm"
        style={{
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
          background: 'rgba(0,0,0,0.08)',
        }}
      />

      {/* 左右药材标签 */}
      <div className="relative flex w-full h-full z-10">
        <div className="flex-1 flex items-center justify-center">
          {cell.left ? (
            <HerbLabel herb={cell.left} side="left" onAdd={onAddHerb} />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          {cell.right ? (
            <HerbLabel herb={cell.right} side="right" onAdd={onAddHerb} />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      </div>

      {/* 黄铜把手 */}
      <div
        className="absolute left-1/2 bottom-[6px] -translate-x-1/2 z-20"
        style={{
          width: 'clamp(12px, 1.5vw, 20px)',
          height: 'clamp(5px, 0.6vw, 8px)',
          background: `linear-gradient(
            180deg,
            var(--brass-light) 0%,
            var(--brass) 40%,
            var(--brass-dark) 100%
          )`,
          borderRadius: '0 0 4px 4px',
          boxShadow: `
            0 1px 2px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.3)
          `,
        }}
      />
    </div>
  );
}
