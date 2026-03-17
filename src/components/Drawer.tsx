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
        relative flex wood-texture
        border border-[var(--wood-shadow)]
        rounded-sm overflow-visible
        aspect-square
      `}
      style={{
        background: `linear-gradient(
          180deg,
          var(--wood-highlight) 0%,
          var(--wood-light) 8%,
          var(--wood-medium) 50%,
          var(--wood-dark) 92%,
          var(--wood-shadow) 100%
        )`,
        boxShadow: `
          inset 0 2px 0 rgba(255,255,255,0.12),
          inset 0 -3px 6px rgba(0,0,0,0.35),
          inset 2px 0 3px rgba(255,255,255,0.06),
          inset -2px 0 3px rgba(0,0,0,0.15),
          0 2px 4px rgba(0,0,0,0.25),
          0 1px 0 rgba(255,255,255,0.05)
        `,
      }}
    >
      {/* 抽屉内凹效果 */}
      <div
        className="absolute inset-[3px] rounded-sm"
        style={{
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.35), inset 0 1px 3px rgba(0,0,0,0.2)',
          background: 'rgba(0,0,0,0.1)',
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

      {/* 黄铜拉手 */}
      <div
        className="absolute left-1/2 bottom-[5px] -translate-x-1/2 z-20"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}
      >
        {/* 底座螺丝钉 */}
        <div
          style={{
            width: 'clamp(16px, 2vw, 26px)',
            height: 'clamp(3px, 0.35vw, 5px)',
            background: `linear-gradient(
              180deg,
              var(--brass-light) 0%,
              var(--brass-dark) 100%
            )`,
            borderRadius: '2px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        />
        {/* 拉手圆柱主体 */}
        <div
          style={{
            width: 'clamp(12px, 1.5vw, 20px)',
            height: 'clamp(5px, 0.6vw, 8px)',
            background: `linear-gradient(
              180deg,
              rgba(255,255,255,0.3) 0%,
              var(--brass-light) 10%,
              var(--brass-rim) 30%,
              var(--brass) 55%,
              var(--brass-dark) 82%,
              #5A4A2A 100%
            )`,
            borderRadius: '2px 2px 4px 4px',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.45),
              inset 0 -1px 0 rgba(0,0,0,0.4),
              inset 1px 0 1px rgba(255,255,255,0.15),
              inset -1px 0 1px rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.45),
              0 1px 2px rgba(0,0,0,0.25)
            `,
          }}
        />
      </div>
    </div>
  );
}
