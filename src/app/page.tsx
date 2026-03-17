'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import {
  Herb,
  PrescriptionItem,
  Prescription,
  DrawerCell,
  CabinetProfile,
  MiscFee,
  CartPrescription,
} from '@/lib/types';
import {
  loadProfiles,
  saveProfiles,
  buildDrawerGrid,
  loadPrescriptions,
  savePrescription,
  loadSettings,
  loadClinicSettings,
  loadCart,
  saveCart,
} from '@/lib/store';
import Cabinet from '@/components/Cabinet';
import PrescriptionPanel from '@/components/PrescriptionPanel';
import CartPanel from '@/components/CartPanel';
import PrintPreviewModal from '@/components/PrintPreviewModal';
import Link from 'next/link';

type RightTab = 'prescription' | 'cart';

export default function Home() {
  const [profiles, setProfiles] = useState<CabinetProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [grid, setGrid] = useState<DrawerCell[][]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [miscFees, setMiscFees] = useState<MiscFee[]>([]);
  const [cart, setCart] = useState<CartPrescription[]>([]);
  const [rightTab, setRightTab] = useState<RightTab>('prescription');
  const [mounted, setMounted] = useState(false);
  const [clinicName, setClinicName] = useState('藥斗子診所');

  // 列印预览
  const [printPrescriptions, setPrintPrescriptions] = useState<CartPrescription[] | null>(null);

  // 当前激活的药柜档案
  const activeProfile = profiles.find(p => p.id === activeId) ?? profiles[0];

  useEffect(() => {
    async function init() {
      const [ps, precs, settings, clinic] = await Promise.all([
        loadProfiles(),
        loadPrescriptions(),
        loadSettings(),
        loadClinicSettings(),
      ]);
      setProfiles(ps);
      const firstId = ps[0]?.id ?? '';
      setActiveId(firstId);
      const profile = ps[0];
      if (profile) setGrid(buildDrawerGrid(profile));
      setPrescriptions(precs);
      setMiscFees(settings.miscFees);
      setClinicName(clinic.clinicName);
      setCart(loadCart());
      setMounted(true);
    }
    init();
  }, []);

  // 切换药柜
  const handleSwitchCabinet = useCallback((id: string) => {
    setActiveId(id);
    const profile = profiles.find(p => p.id === id);
    if (profile) setGrid(buildDrawerGrid(profile));
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

  // 将 CartPrescription 保存到历史处方
  const saveCartPrescriptions = useCallback(async (cps: CartPrescription[]) => {
    for (const cp of cps) {
      const pres: Prescription = {
        id: `pres-${cp.id}`,
        name: cp.name,
        items: cp.items,
        createdAt: cp.createdAt,
      };
      // 避免重复保存
      if (!prescriptions.find(p => p.id === pres.id)) {
        await savePrescription(pres);
        setPrescriptions(prev => {
          if (prev.find(p => p.id === pres.id)) return prev;
          return [pres, ...prev];
        });
      }
    }
  }, [prescriptions]);

  // 投入藥簍（PrescriptionPanel 调用）
  const handleAddToCart = useCallback((p: CartPrescription) => {
    setCart(prev => {
      const next = [...prev, p];
      saveCart(next);
      return next;
    });
  }, []);

  // 当前藥方「列印」→ 打开预览（单张）
  const handlePrintSingle = useCallback((p: CartPrescription) => {
    setPrintPrescriptions([p]);
  }, []);

  // 候診藥簍「列印全部」→ 打开预览（全部）
  const handlePrintAll = useCallback(() => {
    if (cart.length === 0) return;
    setPrintPrescriptions([...cart]);
  }, [cart]);

  // 预览模态框「列印」→ 先保存处方
  const handleBeforePrint = useCallback((cps: CartPrescription[]) => {
    saveCartPrescriptions(cps);
  }, [saveCartPrescriptions]);

  // 从藥簍移除单张处方
  const handleRemoveFromCart = useCallback((id: string) => {
    setCart(prev => {
      const next = prev.filter(p => p.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  // 从藥簍「调整」：将处方移回当前药方，并切换到当前药方 Tab
  const handleRestoreFromCart = useCallback((id: string) => {
    setCart(prev => {
      const target = prev.find(p => p.id === id);
      if (!target) return prev;
      setPrescriptionItems(items => {
        const existing = new Set(items.map(i => i.herbId));
        const toAdd = target.items.filter(i => !existing.has(i.herbId));
        return [...items, ...toAdd];
      });
      const next = prev.filter(p => p.id !== id);
      saveCart(next);
      return next;
    });
    setRightTab('prescription');
  }, []);

  // 清空藥簍
  const handleClearCart = useCallback(() => {
    setCart([]);
    saveCart([]);
  }, []);

  // 更新药柜后同步保存
  const handleProfilesChange = useCallback(async (updated: CabinetProfile[]) => {
    setProfiles(updated);
    await saveProfiles(updated);
  }, []);

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
      {/* 列印预览模态框 */}
      {printPrescriptions && (
        <PrintPreviewModal
          prescriptions={printPrescriptions}
          miscFees={miscFees}
          onClose={() => setPrintPrescriptions(null)}
          onBeforePrint={handleBeforePrint}
        />
      )}

      {/* 医馆名称横幅 */}
      <div
        className="py-3 text-center border-b border-[var(--label-border)]"
        style={{ background: 'var(--rice-paper-dark)' }}
      >
        <h1
          className="text-2xl tracking-[0.5em] font-bold"
          style={{ color: 'var(--ink-black)', fontFamily: "'Noto Serif SC', 'Songti SC', serif" }}
        >
          {clinicName}
        </h1>
        <p
          className="text-xs mt-0.5 tracking-widest"
          style={{ color: 'var(--ink-faded)' }}
        >
          中藥開方管理系統
        </p>
      </div>

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

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-[var(--ink-faded)] hover:text-[var(--vermilion)]
              transition-colors tracking-wider border-b border-transparent
              hover:border-[var(--vermilion)]/40"
          >
            管理藥櫃和處方
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-[var(--ink-faded)] hover:text-[var(--ink-light)]
              transition-colors tracking-wider border-b border-transparent
              hover:border-[var(--label-border)]"
          >
            登出
          </button>
        </div>
      </header>

      {/* Tab 底部分隔线 */}
      <div
        className="mx-4 h-px"
        style={{ background: 'var(--label-border)' }}
      />

      {/* 主内容 */}
      <main className="px-2 md:px-6 pb-8 pt-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 药柜 */}
          <div
            className="flex-1 min-w-0 overflow-hidden flex justify-center items-start"
            style={{
              '--cabinet-max-h': 'calc(100vh - 10rem)',
            } as React.CSSProperties}
          >
            {activeProfile && (
              <Cabinet
                grid={grid}
                config={activeProfile.config}
                cabinetName={activeProfile.name}
                onAddHerb={handleAddHerb}
              />
            )}
          </div>

          {/* 右侧面板：當前藥方 / 候診藥簍 */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="lg:sticky lg:top-4">
              {/* 面板切换 Tab */}
              <div className="flex border-b border-[var(--label-border)] mb-0">
                <button
                  onClick={() => setRightTab('prescription')}
                  className={`px-4 py-2 text-sm tracking-wider transition-all
                    border-t border-l border-r rounded-t-sm
                    ${rightTab === 'prescription'
                      ? 'bg-[var(--rice-paper)] border-[var(--label-border)] text-[var(--ink-black)] font-medium relative top-px z-10'
                      : 'bg-[var(--rice-paper-dark)] border-[var(--label-border)]/50 text-[var(--ink-faded)] hover:text-[var(--ink-light)]'
                    }`}
                >
                  當前藥方
                </button>
                <button
                  onClick={() => setRightTab('cart')}
                  className={`px-4 py-2 text-sm tracking-wider transition-all
                    border-t border-l border-r rounded-t-sm relative ml-0.5
                    ${rightTab === 'cart'
                      ? 'bg-[var(--rice-paper)] border-[var(--label-border)] text-[var(--vermilion)] font-medium top-px z-10'
                      : 'bg-[var(--rice-paper-dark)] border-[var(--label-border)]/50 text-[var(--ink-faded)] hover:text-[var(--ink-light)]'
                    }`}
                >
                  候診藥簍
                  {cart.length > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 text-[10px] font-bold
                        rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ background: 'var(--vermilion)', color: '#fff' }}
                    >
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="h-[calc(100vh-13rem)] lg:h-[calc(100vh-10rem)]">
                {rightTab === 'prescription' ? (
                  <PrescriptionPanel
                    items={prescriptionItems}
                    prescriptions={prescriptions}
                    miscFees={miscFees}
                    onUpdateWeight={handleUpdateWeight}
                    onRemoveItem={handleRemoveItem}
                    onClear={handleClear}
                    onAddToCart={handleAddToCart}
                    onPrint={handlePrintSingle}
                  />
                ) : (
                  <CartPanel
                    cart={cart}
                    miscFees={miscFees}
                    onRemove={handleRemoveFromCart}
                    onClear={handleClearCart}
                    onPrintAll={handlePrintAll}
                    onRestore={handleRestoreFromCart}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
