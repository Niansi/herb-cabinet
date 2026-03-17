'use client';

import { DrawerCell, Herb, DrawerSlotCount } from '@/lib/types';
import HerbLabel from './HerbLabel';

interface DrawerProps {
  cell: DrawerCell;
  slotCount: DrawerSlotCount;
  onAddHerb: (herb: Herb) => void;
}

function EmptySlot({ className }: { className?: string }) {
  return <div className={`w-full h-full ${className ?? ''}`} />;
}

export default function Drawer({ cell, slotCount, onAddHerb }: DrawerProps) {
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

      {/* 内部布局 — 根据 slotCount 渲染 */}
      <div className="relative flex w-full h-full z-10">
        {slotCount === 1 && (
          /* 居中展示 1 个标签 */
          <div className="flex-1 flex items-center justify-center">
            {cell.center
              ? <HerbLabel herb={cell.center} side="center" onAdd={onAddHerb} />
              : <EmptySlot />}
          </div>
        )}

        {slotCount === 2 && (
          /* 左1右1，纵向 */
          <>
            <div className="flex-1 flex items-center justify-center">
              {cell.left
                ? <HerbLabel herb={cell.left} side="left" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
            <div className="flex-1 flex items-center justify-center">
              {cell.right
                ? <HerbLabel herb={cell.right} side="right" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
          </>
        )}

        {slotCount === 3 && (
          /* 左上右：左右纵向，上横向 */
          <>
            {/* 左侧：纵向 */}
            <div className="flex items-center justify-center"
              style={{ width: '30%' }}>
              {cell.left
                ? <HerbLabel herb={cell.left} side="left" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
            {/* 中间：上方横向 */}
            <div className="flex flex-col flex-1">
              <div className="flex-1 flex items-center justify-center border-b border-[var(--wood-dark)]/30">
                {cell.top
                  ? <HerbLabel herb={cell.top} side="top" onAdd={onAddHerb} />
                  : <EmptySlot />}
              </div>
              {/* 中间下半区留空 */}
              <div className="flex-1" />
            </div>
            {/* 右侧：纵向 */}
            <div className="flex items-center justify-center"
              style={{ width: '30%' }}>
              {cell.right
                ? <HerbLabel herb={cell.right} side="right" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
          </>
        )}

        {slotCount === 4 && (
          /* 左上右下：左右纵向，上下横向 */
          <>
            {/* 左侧：纵向 */}
            <div className="flex items-center justify-center"
              style={{ width: '28%' }}>
              {cell.left
                ? <HerbLabel herb={cell.left} side="left" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
            {/* 中间：上下横向 */}
            <div className="flex flex-col flex-1">
              <div className="flex-1 flex items-center justify-center border-b border-[var(--wood-dark)]/30">
                {cell.top
                  ? <HerbLabel herb={cell.top} side="top" onAdd={onAddHerb} />
                  : <EmptySlot />}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {cell.bottom
                  ? <HerbLabel herb={cell.bottom} side="bottom" onAdd={onAddHerb} />
                  : <EmptySlot />}
              </div>
            </div>
            {/* 右侧：纵向 */}
            <div className="flex items-center justify-center"
              style={{ width: '28%' }}>
              {cell.right
                ? <HerbLabel herb={cell.right} side="right" onAdd={onAddHerb} />
                : <EmptySlot />}
            </div>
          </>
        )}
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
