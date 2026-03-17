'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Herb,
  PrescriptionItem,
  Prescription,
  DrawerCell,
  CabinetProfile,
} from '@/lib/types';
import {
  loadProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  buildDrawerGrid,
  loadPrescriptions,
  savePrescriptions,
} from '@/lib/store';
import Cabinet from '@/components/Cabinet';
import PrescriptionPanel from '@/components/PrescriptionPanel';
import Link from 'next/link';

export default function Home() {
  const [profiles, setProfiles] = useState<CabinetProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [grid, setGrid] = useState<DrawerCell[][]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [mounted, setMounted] = useState(false);

  // 当前激活的药柜档案
  const activeProfile = profiles.find(p => p.id === activeId) ?? profiles[0];

  useEffect(() => {
    const ps = loadProfiles();
    const aid = loadActiveProfileId(ps);
    setProfiles(ps);
    setActiveId(aid);
    const profile = ps.find(p => p.id === aid) ?? ps[0];
    if (profile) setGrid(buildDrawerGrid(profile));
    setPrescriptions(loadPrescriptions());
    setMounted(true);
  }, []);

  // 切换药柜
  const handleSwitchCabinet = useCallback((id: string) => {
    setActiveId(id);
    saveActiveProfileId(id);
    const profile = profiles.find(p => p.id === id);
    if (profile) setGrid(buildDrawerGrid(profile));
    // 切柜时保留当前方子，支持多药柜共同组方
  }, [profiles]);

  const handleAddHerb = useCallback((herb: Herb) => {
    setPrescriptionItems(prev => {
      const existing = prev.find(item => item.herbId === herb.id);
      if (existing) return prev;
      return [...prev, { herbId: herb.id, herb, weight: 10 }];
    });
  }, []);

  const handleUpdateWeight = useCallback((herbId: string, weight: number) => {
    setPrescriptionItems(prev =>
      prev.map(item => item.herbId === herbId ? { ...item, weight } : item)
    );
  }, []);

  const handleRemoveItem = useCallback((herbId: string) => {
    setPrescriptionItems(prev => prev.filter(item => item.herbId !== herbId));
  }, []);

  const handleClear = useCallback(() => {
    setPrescriptionItems([]);
  }, []);

  // 存方：将当前处方存入历史记录
  const handleSavePrescription = useCallback(() => {
    if (prescriptionItems.length === 0) return;
    const newPres: Prescription = {
      id: `pres-${Date.now()}`,
      name: `藥方 ${new Date().toLocaleDateString('zh-TW')}`,
      items: prescriptionItems,
      createdAt: new Date().toISOString(),
    };
    setPrescriptions(prev => {
      const next = [newPres, ...prev];
      savePrescriptions(next);
      return next;
    });
    alert('已存方！');
  }, [prescriptionItems]);

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--rice-paper)' }}
      >
        <p className="text-[var(--ink-faded)] text-lg tracking-widest">
          載入中⋯
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* 顶部导航 */}
      <header className="px-4 py-2 flex items-center justify-between">
        {/* 药柜切换 Tab */}
        <nav className="flex items-end gap-0">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSwitchCabinet(profile.id)}
              className={`
                relative px-4 py-2 text-sm tracking-wider transition-all duration-200
                border-t border-l border-r
                ${profile.id === activeId
                  ? 'bg-[var(--rice-paper)] border-[var(--label-border)] text-[var(--ink-black)] font-medium -mb-px z-10'
                  : 'bg-[var(--rice-paper-dark)] border-[var(--label-border)]/50 text-[var(--ink-faded)] hover:text-[var(--ink-light)] hover:bg-[var(--label-bg)]'
                }
              `}
              style={{
                borderRadius: '4px 4px 0 0',
                marginRight: '2px',
              }}
            >
              {profile.name}
            </button>
          ))}
        </nav>

        <Link
          href="/admin"
          className="text-sm text-[var(--ink-faded)] hover:text-[var(--vermilion)]
            transition-colors tracking-wider border-b border-transparent
            hover:border-[var(--vermilion)]/40"
        >
          管理藥櫃和處方
        </Link>
      </header>

      {/* Tab 底部分隔线 */}
      <div
        className="mx-4 h-px"
        style={{ background: 'var(--label-border)' }}
      />

      {/* 主内容 */}
      <main className="px-2 md:px-6 pb-8 pt-4">
        <div className="flex flex-col lg:flex-row gap-4 max-w-[1400px] mx-auto">
          {/* 药柜 */}
          <div className="flex-1 min-w-0">
            {activeProfile && (
              <Cabinet
                grid={grid}
                config={activeProfile.config}
                cabinetName={activeProfile.name}
                onAddHerb={handleAddHerb}
              />
            )}
          </div>

          {/* 方子 */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="lg:sticky lg:top-4">
              <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
                <PrescriptionPanel
                  items={prescriptionItems}
                  prescriptions={prescriptions}
                  onUpdateWeight={handleUpdateWeight}
                  onRemoveItem={handleRemoveItem}
                  onClear={handleClear}
                  onSave={handleSavePrescription}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
