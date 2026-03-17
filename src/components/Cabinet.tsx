'use client';

import { DrawerCell, Herb, CabinetConfig } from '@/lib/types';
import DrawerComponent from './Drawer';

interface CabinetProps {
  grid: DrawerCell[][];
  config: CabinetConfig;
  cabinetName?: string;
  onAddHerb: (herb: Herb) => void;
}

export default function Cabinet({ grid, config, cabinetName, onAddHerb }: CabinetProps) {
  return (
    <div className="relative">
      {/* 药柜标题牌匾 */}
      <div className="flex justify-center mb-3">
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
        className="relative p-3 md:p-4 wood-texture"
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

        {/* 网格 */}
        <div
          className="grid gap-[3px] md:gap-1"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
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
