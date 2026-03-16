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
      <div className="flex justify-center mb-4">
        <div
          className="relative px-8 py-2"
          style={{
            background: 'linear-gradient(180deg, #5C3A21 0%, #4A2E18 100%)',
            border: '2px solid #3A1F0E',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.1),
              0 4px 12px rgba(0,0,0,0.3)
            `,
          }}
        >
          <div
            className="absolute inset-[4px] border border-[var(--brass)]/40"
            style={{ pointerEvents: 'none' }}
          />
          <h1
            className="text-2xl md:text-3xl font-bold tracking-[0.3em]"
            style={{
              color: 'var(--brass-light)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {cabinetName ?? '藥斗子'}
          </h1>
        </div>
      </div>

      {/* 药柜主体 */}
      <div
        className="relative p-3 md:p-4 rounded-sm"
        style={{
          background: `linear-gradient(
            180deg,
            #6B3F24 0%,
            #5C3A21 5%,
            #4A2E18 95%,
            #3A1F0E 100%
          )`,
          border: '3px solid #3A1F0E',
          boxShadow: `
            inset 0 2px 0 rgba(255,255,255,0.08),
            inset 0 -2px 0 rgba(0,0,0,0.3),
            0 8px 32px rgba(0,0,0,0.4),
            0 2px 8px rgba(0,0,0,0.2)
          `,
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(0,0,0,0.02) 8px,
              rgba(0,0,0,0.02) 16px
            )
          `,
        }}
      >
        {/* 柜顶装饰线 */}
        <div
          className="absolute top-0 left-4 right-4 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--brass)/40, transparent)',
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

        {/* 柜底装饰线 */}
        <div
          className="absolute bottom-0 left-4 right-4 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--brass)/40, transparent)',
          }}
        />
      </div>

      {/* 柜脚 */}
      <div className="flex justify-between px-4">
        <div
          className="w-8 h-3 rounded-b-sm"
          style={{
            background: 'linear-gradient(180deg, #3A1F0E, #2A150A)',
          }}
        />
        <div
          className="w-8 h-3 rounded-b-sm"
          style={{
            background: 'linear-gradient(180deg, #3A1F0E, #2A150A)',
          }}
        />
      </div>
    </div>
  );
}
