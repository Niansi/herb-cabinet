'use client';

import { useRef, useCallback } from 'react';
import { DrawerCell, Herb, CabinetConfig } from '@/lib/types';
import DrawerComponent from './Drawer';

interface CabinetProps {
  grid: DrawerCell[][];
  config: CabinetConfig;
  cabinetName?: string;
  onAddHerb: (herb: Herb) => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function Cabinet({ grid, config, cabinetName, onAddHerb, hasPrev, hasNext, onPrev, onNext }: CabinetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    startY.current = e.pageY - el.offsetTop;
    scrollLeft.current = el.scrollLeft;
    scrollTop.current = el.scrollTop;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const y = e.pageY - el.offsetTop;
    el.scrollLeft = scrollLeft.current - (x - startX.current);
    el.scrollTop = scrollTop.current - (y - startY.current);
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = scrollRef.current;
    if (!el) return;
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  }, []);

  const onMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      const el = scrollRef.current;
      if (!el) return;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, []);

  return (
    <div className="relative inline-flex flex-col max-w-full min-w-0">
      {/* 药柜标题牌匾（含左右切换按钮） */}
      <div className="flex items-center justify-center gap-3 mb-3">
        {/* 左侧切换按钮 */}
        {hasPrev ? (
          <button
            onClick={onPrev}
            aria-label="上一個藥櫃"
            className="flex-shrink-0 transition-opacity hover:opacity-70 active:scale-95"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="14" stroke="var(--brass)" strokeWidth="1.5" fill="rgba(74,42,16,0.7)" />
              <path d="M17 9L11 15L17 21" stroke="var(--brass-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-[30px] flex-shrink-0" />
        )}

        <div
          className="relative px-10 py-3"
          style={{
            background: 'linear-gradient(180deg, #6B3F1A 0%, #4A2A10 50%, #3A1F0A 100%)',
            border: '3px solid #2A1508',
            borderRadius: '2px',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -2px 4px rgba(0,0,0,0.4),
              0 6px 16px rgba(0,0,0,0.4),
              0 2px 4px rgba(0,0,0,0.2)
            `,
          }}
        >
          {/* 双线内框 */}
          <div
            className="absolute inset-[5px] border-2 border-[var(--brass)]/30"
            style={{ pointerEvents: 'none', borderRadius: '1px' }}
          />
          <div
            className="absolute inset-[8px] border border-[var(--brass)]/20"
            style={{ pointerEvents: 'none', borderRadius: '1px' }}
          />
          {/* 四角装饰点 */}
          {[
            'top-[7px] left-[7px]',
            'top-[7px] right-[7px]',
            'bottom-[7px] left-[7px]',
            'bottom-[7px] right-[7px]',
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-[4px] h-[4px] rounded-full`}
              style={{ background: 'var(--brass)', opacity: 0.6 }}
            />
          ))}
          <h1
            className="relative text-2xl md:text-3xl font-bold tracking-[0.35em] z-10"
            style={{
              color: 'var(--brass-light)',
              textShadow: `
                0 1px 0 rgba(0,0,0,0.6),
                0 -1px 0 rgba(255,255,255,0.08),
                0 0 16px rgba(212,168,67,0.5),
                0 0 32px rgba(212,168,67,0.2)
              `,
            }}
          >
            {cabinetName ?? '藥斗子'}
          </h1>
        </div>

        {/* 右侧切换按钮 */}
        {hasNext ? (
          <button
            onClick={onNext}
            aria-label="下一個藥櫃"
            className="flex-shrink-0 transition-opacity hover:opacity-70 active:scale-95"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="14" stroke="var(--brass)" strokeWidth="1.5" fill="rgba(74,42,16,0.7)" />
              <path d="M13 9L19 15L13 21" stroke="var(--brass-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-[30px] flex-shrink-0" />
        )}
      </div>

      {/* 柜体顶部檐口 */}
      <div
        className="mx-1 wood-texture"
        style={{
          height: '14px',
          background: `linear-gradient(
            180deg,
            var(--wood-highlight) 0%,
            var(--wood-light) 40%,
            var(--wood-dark) 100%
          )`,
          border: '2px solid var(--wood-shadow)',
          borderBottom: 'none',
          borderRadius: '3px 3px 0 0',
          boxShadow: `
            inset 0 2px 0 rgba(255,255,255,0.1),
            0 -2px 6px rgba(0,0,0,0.2)
          `,
        }}
      />

      {/* 药柜主体 */}
      <div
        className="relative wood-texture"
        style={{
          background: `linear-gradient(
            180deg,
            #6B3F24 0%,
            #5C3A21 5%,
            #4A2E18 95%,
            #3A1F0E 100%
          )`,
          border: '3px solid var(--wood-shadow)',
          borderTop: 'none',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -2px 0 rgba(0,0,0,0.35),
            inset 3px 0 6px rgba(0,0,0,0.1),
            inset -3px 0 6px rgba(0,0,0,0.1),
            0 8px 32px rgba(0,0,0,0.45),
            0 2px 8px rgba(0,0,0,0.25)
          `,
        }}
      >
        {/* 柜顶铜装饰线 */}
        <div
          className="absolute top-0 left-6 right-6 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--brass-rim), transparent)',
            opacity: 0.5,
          }}
        />

        {/* 可滚动区域 — 内容放得下时自然大小；放不下时 max-h/max-w 触发滚动 */}
        <div
          ref={scrollRef}
          className="overflow-auto p-3 md:p-4"
          style={{
            cursor: 'grab',
            maxHeight: 'var(--cabinet-max-h, none)',
            maxWidth: '100%',
            width: 'max-content',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* 网格 — 宽度由内容决定，当超出容器时触发横向滚动 */}
          <div
            className="grid gap-[3px] md:gap-1"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(120px, 150px))`,
              width: 'max-content',
            }}
          >
            {grid.map((row, ri) =>
              row.map((cell, ci) => (
                <DrawerComponent
                  key={`${ri}-${ci}`}
                  cell={cell}
                  onAddHerb={onAddHerb}
                />
              ))
            )}
          </div>
        </div>

        {/* 柜底铜装饰线 */}
        <div
          className="absolute bottom-0 left-6 right-6 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--brass-rim), transparent)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* 柜脚（四脚梯形） */}
      <div className="flex justify-between px-3 mx-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="wood-texture"
            style={{
              width: 'clamp(16px, 2.5vw, 28px)',
              height: '14px',
              background: `linear-gradient(180deg, var(--wood-dark) 0%, var(--wood-shadow) 100%)`,
              clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
