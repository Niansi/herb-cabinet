'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Herb, CabinetProfile, Prescription, MiscFee, CartPrescription } from '@/lib/types';
import {
  loadProfiles,
  saveProfiles,
  deleteCabinet,
  createCabinet,
  loadPrescriptions,
  savePrescription,
  updatePrescriptionNotes,
  deletePrescription as apiDeletePrescription,
  loadSettings,
  saveSettings,
  loadClinicSettings,
  saveClinicSettings,
} from '@/lib/store';
import { DEFAULT_PROFILES } from '@/lib/data';
import {
  exportCabinetToExcel,
  importCabinetFromExcel,
  ImportPreview,
  exportPrescriptionsToExcel,
  importPrescriptionsFromExcel,
} from '@/lib/excel';
import PrintPreviewModal from '@/components/PrintPreviewModal';
import Link from 'next/link';

type TabKey = 'herbs' | 'config';
type SectionKey = 'cabinet' | 'prescription' | 'miscfee' | 'clinic';

const NAV_ITEMS: { key: SectionKey; icon: string; label: string }[] = [
  { key: 'cabinet', icon: '🗄', label: '管理藥櫃' },
  { key: 'prescription', icon: '📋', label: '管理處方' },
  { key: 'miscfee', icon: '💰', label: '雜項收費' },
  { key: 'clinic', icon: '🏥', label: '醫館配置' },
];

export default function AdminPage() {
  const [profiles, setProfiles] = useState<CabinetProfile[]>([]);
  const [activeCabinetId, setActiveCabinetId] = useState<string>('');
  const [tab, setTab] = useState<TabKey>('herbs');
  const [section, setSection] = useState<SectionKey>('cabinet');
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  const [editingHerb, setEditingHerb] = useState<Herb | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [miscFees, setMiscFees] = useState<MiscFee[]>([]);
  const [clinicName, setClinicName] = useState('藥斗子診所');
  const [editingClinicName, setEditingClinicName] = useState('');
  const [search, setSearch] = useState('');
  const [showNewCabinet, setShowNewCabinet] = useState(false);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetDesc, setNewCabinetDesc] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [presImportLoading, setPresImportLoading] = useState(false);
  const presImportFileRef = useRef<HTMLInputElement>(null);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [adminPrintPres, setAdminPrintPres] = useState<CartPrescription[] | null>(null);

  useEffect(() => {
    async function init() {
      const [ps, precs, settings, clinic] = await Promise.all([
        loadProfiles(),
        loadPrescriptions(),
        loadSettings(),
        loadClinicSettings(),
      ]);
      setProfiles(ps);
      setActiveCabinetId(ps[0]?.id ?? '');
      setPrescriptions(precs);
      setMiscFees(settings.miscFees);
      setClinicName(clinic.clinicName);
      setEditingClinicName(clinic.clinicName);
      setMounted(true);
    }
    init();
  }, []);

  const activeProfile = profiles.find(p => p.id === activeCabinetId);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateProfile = useCallback(async (updated: CabinetProfile) => {
    setProfiles(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      saveProfiles(next);
      return next;
    });
  }, []);

  const handleDeleteHerb = (id: string) => {
    if (!activeProfile) return;
    updateProfile({ ...activeProfile, herbs: activeProfile.herbs.filter(h => h.id !== id) });
  };

  const handleEditHerb = (herb: Herb) => {
    setEditingHerb({ ...herb });
    setIsAdding(false);
  };

  const handleNewHerb = () => {
    const newHerb: Herb = {
      id: `h${Date.now()}`,
      name: '',
      nameTraditional: '',
      pricePerGram: 0.1,
      position: { row: 0, col: 0, side: 'left' },
      category: '',
    };
    setEditingHerb(newHerb);
    setIsAdding(true);
  };

  const handleSaveEdit = () => {
    if (!editingHerb || !activeProfile) return;
    const herbs = isAdding
      ? [...activeProfile.herbs, editingHerb]
      : activeProfile.herbs.map(h => h.id === editingHerb.id ? editingHerb : h);
    updateProfile({ ...activeProfile, herbs });
    setEditingHerb(null);
    showSaved();
  };

  const handleSaveHerbs = useCallback(async () => {
    if (!activeProfile) return;
    await saveProfiles(profiles);
    showSaved();
  }, [activeProfile, profiles]);

  const handleResetHerbs = () => {
    if (!activeProfile) return;
    const def = DEFAULT_PROFILES.find(p => p.id === activeProfile.id);
    if (!def) { alert('此藥櫃無預設資料'); return; }
    if (!confirm('確定要恢復此藥櫃的預設藥材嗎？')) return;
    updateProfile({ ...activeProfile, herbs: def.herbs });
    showSaved();
  };

  const handleSaveConfig = useCallback(async () => {
    await saveProfiles(profiles);
    showSaved();
  }, [profiles]);

  const handleCreateCabinet = async () => {
    if (!newCabinetName.trim()) return;
    const newProfile = await createCabinet(newCabinetName.trim(), newCabinetDesc.trim() || undefined);
    if (!newProfile) { alert('創建藥櫃失敗，請稍後重試'); return; }
    setProfiles(prev => [...prev, newProfile]);
    setActiveCabinetId(newProfile.id);
    setNewCabinetName('');
    setNewCabinetDesc('');
    setShowNewCabinet(false);
    showSaved();
  };

  const handleDeleteCabinet = async (id: string) => {
    if (profiles.length <= 1) { alert('至少需要保留一個藥櫃'); return; }
    if (!confirm('確定要刪除此藥櫃嗎？')) return;
    await deleteCabinet(id);
    const next = profiles.filter(p => p.id !== id);
    setProfiles(next);
    if (activeCabinetId === id) setActiveCabinetId(next[0]?.id ?? '');
  };

  const handleRenameCabinet = (id: string, name: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    updateProfile({ ...p, name });
  };

  const handleExportCabinet = () => {
    if (!activeProfile) return;
    exportCabinetToExcel(activeProfile);
  };

  const handleImportTrigger = () => importFileRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const preview = await importCabinetFromExcel(file);
    setImportLoading(false);
    setImportPreview(preview);
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview || !activeProfile) return;
    const mergedConfig = importPreview.config
      ? {
          rows: importPreview.config.rows,
          cols: importPreview.config.cols,
          slotCount: (importPreview.config.slotCount ?? activeProfile.config.slotCount ?? 2) as 1 | 2 | 3 | 4,
        }
      : activeProfile.config;
    const updated: CabinetProfile = {
      ...activeProfile,
      herbs: importPreview.herbs,
      config: mergedConfig,
      ...(importPreview.name ? { name: importPreview.name } : {}),
      ...(importPreview.description !== undefined ? { description: importPreview.description } : {}),
    };
    updateProfile(updated);
    setImportPreview(null);
    showSaved();
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('確定要刪除此處方嗎？')) return;
    await apiDeletePrescription(id);
    setPrescriptions(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleExportPrescriptions = () => exportPrescriptionsToExcel(prescriptions);

  const handleSaveNotes = async (id: string) => {
    const notes = editingNotes[id] ?? '';
    await updatePrescriptionNotes(id, notes);
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
    setEditingNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
    showSaved();
  };

  const handleToggleSelectAll = (ids: string[]) => {
    if (ids.every(id => selectedIds.has(id))) {
      setSelectedIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
    } else {
      setSelectedIds(prev => new Set([...prev, ...ids]));
    }
  };

  const handlePrintSelected = (filtered: Prescription[]) => {
    const targets = filtered.filter(p => selectedIds.has(p.id));
    if (targets.length === 0) return;
    setAdminPrintPres(targets.map(p => ({
      id: `admin-${p.id}`,
      name: p.name,
      items: p.items,
      doseCount: 1,
      checkedFees: {},
      createdAt: p.createdAt,
    })));
  };

  const handlePresImportTrigger = () => presImportFileRef.current?.click();

  const handlePresImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPresImportLoading(true);
    const imported = await importPrescriptionsFromExcel(file);
    setPresImportLoading(false);
    e.target.value = '';
    if (!imported || imported.length === 0) { alert('未讀取到有效處方資料'); return; }
    if (!confirm(`讀取到 ${imported.length} 張處方，確定要匯入嗎？\n（將與現有處方合併）`)) return;
    const existingIds = new Set(prescriptions.map(p => p.id));
    const newOnes = imported.filter(p => !existingIds.has(p.id));
    for (const pres of newOnes) await savePrescription(pres);
    setPrescriptions(prev => [...newOnes, ...prev]);
    showSaved();
  };

  const handleSaveClinicName = async () => {
    const trimmed = editingClinicName.trim();
    if (!trimmed) return;
    await saveClinicSettings({ clinicName: trimmed });
    setClinicName(trimmed);
    showSaved();
  };

  const filteredHerbs = (activeProfile?.herbs ?? []).filter(h =>
    !search
    || h.name.includes(search)
    || h.nameTraditional.includes(search)
    || (h.category ?? '').includes(search)
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative z-10" style={{ background: 'var(--rice-paper)' }}>
      {adminPrintPres && (
        <PrintPreviewModal
          prescriptions={adminPrintPres}
          miscFees={[]}
          onClose={() => setAdminPrintPres(null)}
          onBeforePrint={() => {}}
        />
      )}

      {/* 顶栏 */}
      <header
        className="px-6 py-3 flex items-center justify-between border-b border-[var(--label-border)]"
        style={{ background: 'var(--rice-paper-dark)' }}
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors text-sm">
            ← 返回藥櫃
          </Link>
          <h1 className="text-xl font-bold tracking-widest" style={{ color: 'var(--ink-black)' }}>
            {NAV_ITEMS.find(n => n.key === section)?.label ?? '管理後台'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-sm">已儲存</span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-[var(--ink-faded)] hover:text-[var(--ink-light)]
              transition-colors tracking-wider border-b border-transparent hover:border-[var(--label-border)]"
          >
            登出
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* ── 竖向侧边导航 ── */}
        <aside
          className="w-44 shrink-0 border-r border-[var(--label-border)] flex flex-col"
          style={{ background: 'var(--rice-paper-dark)' }}
        >
          {/* 导航按钮 */}
          <nav className="py-3">
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wider
                  border-l-2 transition-all text-left
                  ${section === item.key
                    ? 'border-[var(--vermilion)] bg-[var(--label-bg)] text-[var(--vermilion)] font-medium'
                    : 'border-transparent text-[var(--ink-faded)] hover:bg-[var(--label-bg)]/50 hover:text-[var(--ink-light)]'
                  }
                `}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* 药柜列表（section=cabinet 时显示）*/}
          {section === 'cabinet' && (
            <div className="border-t border-[var(--label-border)] flex flex-col flex-1 min-h-0">
              <div className="px-4 pt-3 pb-1 text-xs text-[var(--ink-faded)] tracking-wider">藥櫃列表</div>
              <div className="flex-1 overflow-y-auto">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className={`
                      group flex items-center px-3 py-2.5 cursor-pointer border-l-2 transition-colors
                      ${profile.id === activeCabinetId
                        ? 'border-[var(--vermilion)] bg-[var(--label-bg)] text-[var(--ink-black)]'
                        : 'border-transparent text-[var(--ink-faded)] hover:bg-[var(--label-bg)]/50 hover:text-[var(--ink-light)]'
                      }
                    `}
                    onClick={() => setActiveCabinetId(profile.id)}
                  >
                    <span className="flex-1 text-xs truncate">{profile.name}</span>
                    {profiles.length > 1 && (
                      <button
                        className="opacity-0 group-hover:opacity-100 text-[var(--ink-faded)]
                          hover:text-[var(--vermilion)] transition-all text-xs ml-1 shrink-0"
                        onClick={e => { e.stopPropagation(); handleDeleteCabinet(profile.id); }}
                        title="刪除此藥櫃"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[var(--label-border)]">
                <button
                  onClick={() => setShowNewCabinet(true)}
                  className="w-full py-1.5 text-xs border border-[var(--brass-dark)]/60
                    text-[var(--ink-faded)] hover:text-[var(--ink-light)]
                    hover:bg-[var(--brass)]/10 transition-colors tracking-wider"
                >
                  + 新增藥櫃
                </button>
              </div>
            </div>
          )}

          {/* 处方侧边简列 */}
          {section === 'prescription' && (
            <div className="border-t border-[var(--label-border)] flex flex-col flex-1 min-h-0">
              <div className="px-4 pt-3 pb-1 text-xs text-[var(--ink-faded)] tracking-wider">
                共 {prescriptions.length} 張
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {prescriptions.length === 0 ? (
                  <div className="text-xs text-[var(--ink-faded)] mt-4 text-center">暫無歷史處方</div>
                ) : (
                  <div className="space-y-1">
                    {prescriptions.slice(0, 20).map((pres, idx) => (
                      <div key={pres.id} className="px-2 py-1.5 text-xs text-[var(--ink-faded)]">
                        <span className="mr-1 opacity-50">#{idx + 1}</span>
                        <span className="truncate">{pres.name}</span>
                      </div>
                    ))}
                    {prescriptions.length > 20 && (
                      <div className="text-xs text-center text-[var(--ink-faded)] py-1">
                        …等 {prescriptions.length} 張
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 杂项收费简列 */}
          {section === 'miscfee' && (
            <div className="border-t border-[var(--label-border)] flex-1 overflow-y-auto px-3 pt-3">
              <div className="text-xs text-[var(--ink-faded)] tracking-wider mb-2">收費項目</div>
              <div className="space-y-1">
                {miscFees.map(fee => (
                  <div key={fee.id} className="px-2 py-1.5 text-xs text-[var(--ink-faded)]">
                    {fee.name} — ¥{fee.pricePerDose}/副
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── 右侧内容 ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ===== 管理藥櫃 ===== */}
          {section === 'cabinet' && (
            activeProfile ? (
              <div className="px-6 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={activeProfile.name}
                    onChange={e => handleRenameCabinet(activeProfile.id, e.target.value)}
                    className="text-lg font-bold tracking-widest bg-transparent border-b
                      border-transparent hover:border-[var(--label-border)]
                      focus:border-[var(--brass)] focus:outline-none transition-colors
                      text-[var(--ink-black)] w-48"
                  />
                  <span className="text-xs text-[var(--ink-faded)]">
                    {activeProfile.herbs.length} 味藥材 ｜{activeProfile.config.rows}×{activeProfile.config.cols} 格
                  </span>
                </div>

                <div className="flex gap-1 border-b border-[var(--label-border)] mb-5">
                  {([['herbs', '藥材管理'], ['config', '藥櫃設定']] as [TabKey, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`px-4 py-2 text-sm tracking-wider transition-colors
                        ${tab === key
                          ? 'border-b-2 border-[var(--vermilion)] text-[var(--vermilion)] -mb-px'
                          : 'text-[var(--ink-faded)] hover:text-[var(--ink-light)]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === 'herbs' && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <input
                        type="text"
                        placeholder="搜尋藥材⋯"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-[var(--label-border)]
                          bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                          transition-colors w-48"
                      />
                      <button onClick={handleNewHerb} className="px-4 py-1.5 text-sm border border-[var(--brass-dark)] text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors">
                        + 新增藥材
                      </button>
                      <button onClick={handleSaveHerbs} className="px-4 py-1.5 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                        儲存變更
                      </button>
                      <button onClick={handleResetHerbs} className="px-4 py-1.5 text-sm text-[var(--ink-faded)] hover:text-[var(--ink-light)] transition-colors">
                        恢復預設
                      </button>
                      <button onClick={handleExportCabinet} className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60 text-[var(--ink-faded)] hover:text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors">
                        匯出 Excel
                      </button>
                      <button onClick={handleImportTrigger} disabled={importLoading}
                        className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60 text-[var(--ink-faded)] hover:text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {importLoading ? '讀取中…' : '匯入 Excel'}
                      </button>
                      <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
                      <span className="text-sm text-[var(--ink-faded)] ml-auto">共 {activeProfile.herbs.length} 味藥材</span>
                    </div>
                    <div className="border border-[var(--label-border)] overflow-hidden" style={{ background: 'var(--rice-paper)' }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: 'var(--rice-paper-dark)' }}>
                            {['繁體名', '簡體名', '分類', '單價(元/克)', '位置', '操作'].map(col => (
                              <th key={col} className="px-3 py-2 text-left font-medium text-[var(--ink-light)] border-b border-[var(--label-border)]">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHerbs.map((herb, i) => (
                            <tr key={herb.id}
                              className="border-b border-[var(--label-border)]/40 hover:bg-[var(--label-bg)]/50 transition-colors"
                              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232,220,200,0.2)' }}>
                              <td className="px-3 py-2 font-medium">{herb.nameTraditional}</td>
                              <td className="px-3 py-2 text-[var(--ink-faded)]">{herb.name}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 text-xs border border-[var(--label-border)] text-[var(--ink-faded)]">
                                  {herb.category || '未分類'}
                                </span>
                              </td>
                              <td className="px-3 py-2">¥{herb.pricePerGram.toFixed(3)}</td>
                              <td className="px-3 py-2 text-[var(--ink-faded)]">
                                第{herb.position.row + 1}行第{herb.position.col + 1}列
                                {herb.position.side === 'left' ? '（左）'
                                  : herb.position.side === 'right' ? '（右）'
                                  : herb.position.side === 'top' ? '（上）'
                                  : herb.position.side === 'bottom' ? '（下）'
                                  : '（居中）'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-3">
                                  <button onClick={() => handleEditHerb(herb)} className="text-[var(--ink-faded)] hover:text-[var(--brass)] transition-colors">編輯</button>
                                  <button onClick={() => handleDeleteHerb(herb.id)} className="text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors">刪除</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredHerbs.length === 0 && (
                        <div className="text-center py-12 text-[var(--ink-faded)]">無符合條件的藥材</div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'config' && (
                  <div className="max-w-md">
                    <div className="p-6 border border-[var(--label-border)]" style={{ background: 'var(--rice-paper)' }}>
                      <h3 className="text-base font-medium mb-6 tracking-wider" style={{ color: 'var(--ink-black)' }}>藥櫃尺寸設定</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="w-24 text-sm text-[var(--ink-light)]">行數（橫）</label>
                          <input type="number" value={activeProfile.config.rows}
                            onChange={e => {
                              const rows = Math.max(1, Math.min(20, parseInt(e.target.value) || 7));
                              updateProfile({ ...activeProfile, config: { ...activeProfile.config, rows } });
                            }}
                            min={1} max={20}
                            className="w-20 px-2 py-1 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-center text-sm" />
                          <span className="text-xs text-[var(--ink-faded)]">（1–20）</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-24 text-sm text-[var(--ink-light)]">列數（縱）</label>
                          <input type="number" value={activeProfile.config.cols}
                            onChange={e => {
                              const cols = Math.max(1, Math.min(20, parseInt(e.target.value) || 8));
                              updateProfile({ ...activeProfile, config: { ...activeProfile.config, cols } });
                            }}
                            min={1} max={20}
                            className="w-20 px-2 py-1 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-center text-sm" />
                          <span className="text-xs text-[var(--ink-faded)]">（1–20）</span>
                        </div>

                        {/* 格子數量配置 */}
                        <div className="flex items-start gap-4">
                          <label className="w-24 text-sm text-[var(--ink-light)] pt-1 shrink-0">格子數量</label>
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-2">
                              {([
                                [1, '1 格', '居中展示 1 個藥材'],
                                [2, '2 格', '左右各 1 個（縱向）'],
                                [3, '3 格', '左右縱向 + 上橫向'],
                                [4, '4 格', '左右縱向 + 上下橫向'],
                              ] as [number, string, string][]).map(([val, label, desc]) => {
                                const isActive = (activeProfile.config.slotCount ?? 2) === val;
                                return (
                                  <button
                                    key={val}
                                    onClick={() => updateProfile({
                                      ...activeProfile,
                                      config: { ...activeProfile.config, slotCount: val as 1 | 2 | 3 | 4 },
                                    })}
                                    className={`
                                      flex flex-col items-start px-3 py-2 border text-left transition-colors
                                      ${isActive
                                        ? 'border-[var(--vermilion)] bg-[var(--vermilion)]/5 text-[var(--vermilion)]'
                                        : 'border-[var(--label-border)] text-[var(--ink-faded)] hover:border-[var(--brass)] hover:text-[var(--ink-light)]'
                                      }
                                    `}
                                  >
                                    <span className="text-sm font-medium">{label}</span>
                                    <span className="text-xs mt-0.5 leading-snug opacity-80">{desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-[var(--ink-faded)] mt-2">
                              更改格子數量後，已配置的藥材位置需重新調整。
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 border border-[var(--label-border)]/60 text-xs text-[var(--ink-faded)]">
                        目前設定：{activeProfile.config.rows} 行 × {activeProfile.config.cols} 列
                        = {activeProfile.config.rows * activeProfile.config.cols} 個抽屜，
                        每格 {activeProfile.config.slotCount ?? 2} 個藥材槽，
                        最多可放 {activeProfile.config.rows * activeProfile.config.cols * (activeProfile.config.slotCount ?? 2)} 味藥材
                      </div>
                      <button onClick={handleSaveConfig}
                        className="mt-6 px-6 py-2 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                        儲存設定
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--ink-faded)]">
                請選擇或新增一個藥櫃
              </div>
            )
          )}

          {/* ===== 管理處方 ===== */}
          {section === 'prescription' && (() => {
            const filtered = prescriptions.filter(pres => {
              const d = pres.createdAt.slice(0, 10);
              if (filterDateFrom && d < filterDateFrom) return false;
              if (filterDateTo && d > filterDateTo) return false;
              return true;
            });
            const filteredIds = filtered.map(p => p.id);
            const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
            const someSelected = filteredIds.some(id => selectedIds.has(id));
            const selectedCount = filteredIds.filter(id => selectedIds.has(id)).length;

            return (
              <div className="px-6 pt-4">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h2 className="text-base font-medium tracking-widest text-[var(--ink-black)] mr-2">已存處方</h2>
                  {someSelected && (
                    <button onClick={() => handlePrintSelected(filtered)}
                      className="px-4 py-1.5 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                      列印選中（{selectedCount}）
                    </button>
                  )}
                  <button onClick={handleExportPrescriptions} disabled={prescriptions.length === 0}
                    className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60 text-[var(--ink-faded)] hover:text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    匯出 Excel
                  </button>
                  <button onClick={handlePresImportTrigger} disabled={presImportLoading}
                    className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60 text-[var(--ink-faded)] hover:text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {presImportLoading ? '讀取中…' : '匯入 Excel'}
                  </button>
                  <input ref={presImportFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handlePresImportFile} />
                  <span className="text-sm text-[var(--ink-faded)] ml-auto">
                    顯示 {filtered.length} / {prescriptions.length} 張
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <span className="text-xs text-[var(--ink-faded)]">日期篩選：</span>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="px-2 py-1 text-xs border border-[var(--label-border)] bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)] transition-colors text-[var(--ink-light)]" />
                  <span className="text-xs text-[var(--ink-faded)]">至</span>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="px-2 py-1 text-xs border border-[var(--label-border)] bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)] transition-colors text-[var(--ink-light)]" />
                  {(filterDateFrom || filterDateTo) && (
                    <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                      className="text-xs text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors">
                      清除篩選
                    </button>
                  )}
                </div>

                {prescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-[var(--ink-faded)] border border-dashed border-[var(--label-border)]">
                    <p className="text-lg mb-2">暫無歷史處方</p>
                    <p className="text-sm">在首頁開方後列印，或從 Excel 匯入</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--ink-faded)] border border-dashed border-[var(--label-border)]">
                    <p className="text-base">所選日期範圍內無處方記錄</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-8">
                    <div className="flex items-center gap-2 px-1">
                      <input type="checkbox" checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => handleToggleSelectAll(filteredIds)}
                        className="accent-[var(--vermilion)] w-4 h-4" />
                      <span className="text-xs text-[var(--ink-faded)]">全選 / 取消全選（當前顯示 {filtered.length} 張）</span>
                    </div>
                    {filtered.map((pres, idx) => {
                      const totalWeight = pres.items.reduce((s, it) => s + it.weight, 0);
                      const totalPrice = pres.items.reduce((s, it) => s + it.herb.pricePerGram * it.weight, 0);
                      const dateStr = new Date(pres.createdAt).toLocaleString('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      });
                      const isSelected = selectedIds.has(pres.id);
                      const notesVal = editingNotes[pres.id] !== undefined ? editingNotes[pres.id] : (pres.notes ?? '');
                      const isEditingThisNote = editingNotes[pres.id] !== undefined;

                      return (
                        <div key={pres.id}
                          className={`border transition-colors ${isSelected ? 'border-[var(--vermilion)]/40' : 'border-[var(--label-border)]'}`}
                          style={{ background: 'var(--rice-paper)' }}>
                          <div className="flex items-center px-4 py-3 gap-2">
                            <input type="checkbox" checked={isSelected}
                              onChange={() => setSelectedIds(prev => {
                                const s = new Set(prev);
                                if (s.has(pres.id)) s.delete(pres.id); else s.add(pres.id);
                                return s;
                              })}
                              className="accent-[var(--vermilion)] w-4 h-4 shrink-0" />
                            <span className="text-xs text-[var(--ink-faded)] w-6 shrink-0">#{idx + 1}</span>
                            <span className="font-medium text-[var(--ink-black)] tracking-wider flex-1">{pres.name}</span>
                            <span className="text-xs text-[var(--ink-faded)] mr-4 shrink-0">{dateStr}</span>
                            <span className="text-xs text-[var(--ink-faded)] mr-4 shrink-0">{pres.items.length} 味 · {totalWeight.toFixed(1)} 克</span>
                            <span className="text-sm font-medium mr-4 shrink-0" style={{ color: 'var(--vermilion)' }}>¥{totalPrice.toFixed(2)}</span>
                            <button
                              onClick={() => setAdminPrintPres([{ id: `admin-${pres.id}`, name: pres.name, items: pres.items, doseCount: 1, checkedFees: {}, createdAt: pres.createdAt }])}
                              className="text-[var(--ink-faded)] hover:text-[var(--ink-black)] transition-colors text-xs px-1 shrink-0">
                              列印
                            </button>
                            <button onClick={() => handleDeletePrescription(pres.id)}
                              className="text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors text-xs px-1 shrink-0">
                              刪除
                            </button>
                          </div>
                          <div className="border-t border-[var(--label-border)]/60 px-4 py-3" style={{ background: 'rgba(232,220,200,0.15)' }}>
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  {['藥材', '重量(克)', '單價(元/克)', '小計(元)'].map(col => (
                                    <th key={col} className="pb-2 text-left text-xs font-medium text-[var(--ink-faded)] border-b border-[var(--label-border)]/40">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {pres.items.map((item, i) => (
                                  <tr key={item.herbId}
                                    className="border-b border-[var(--label-border)]/30"
                                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232,220,200,0.2)' }}>
                                    <td className="py-1.5 font-medium text-[var(--ink-black)]">{item.herb.nameTraditional}</td>
                                    <td className="py-1.5 text-[var(--ink-light)]">{item.weight}</td>
                                    <td className="py-1.5 text-[var(--ink-faded)]">¥{item.herb.pricePerGram.toFixed(3)}</td>
                                    <td className="py-1.5 text-[var(--ink-light)]">¥{(item.herb.pricePerGram * item.weight).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-3 flex items-start gap-2">
                              <span className="text-xs text-[var(--ink-faded)] shrink-0 mt-1">備注：</span>
                              {isEditingThisNote ? (
                                <>
                                  <textarea value={notesVal}
                                    onChange={e => setEditingNotes(prev => ({ ...prev, [pres.id]: e.target.value }))}
                                    rows={2}
                                    className="flex-1 text-xs px-2 py-1 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] transition-colors resize-none"
                                    placeholder="輸入備注…" autoFocus />
                                  <button onClick={() => handleSaveNotes(pres.id)}
                                    className="text-xs text-green-700 hover:text-green-900 transition-colors shrink-0">儲存</button>
                                  <button onClick={() => setEditingNotes(prev => { const n = { ...prev }; delete n[pres.id]; return n; })}
                                    className="text-xs text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors shrink-0">取消</button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-xs text-[var(--ink-light)] whitespace-pre-wrap">
                                    {pres.notes || <span className="text-[var(--ink-faded)] italic">無備注</span>}
                                  </span>
                                  <button onClick={() => setEditingNotes(prev => ({ ...prev, [pres.id]: pres.notes ?? '' }))}
                                    className="text-xs text-[var(--ink-faded)] hover:text-[var(--brass)] transition-colors shrink-0">編輯</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ===== 雜項收費 ===== */}
          {section === 'miscfee' && (
            <div className="px-6 pt-4">
              <h2 className="text-base font-medium tracking-widest text-[var(--ink-black)] mb-4">雜項收費設定</h2>
              <div className="max-w-md">
                <div className="p-6 border border-[var(--label-border)]" style={{ background: 'var(--rice-paper)' }}>
                  <p className="text-xs text-[var(--ink-faded)] mb-4">設定開方時可勾選的附加收費項目，費用按副計算。</p>
                  <div className="space-y-4">
                    {miscFees.map((fee, idx) => (
                      <div key={fee.id} className="flex items-center gap-3 py-2 border-b border-[var(--label-border)]/40">
                        <span className="text-sm text-[var(--ink-black)] font-medium w-20 shrink-0">{fee.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[var(--ink-faded)]">¥</span>
                          <input type="number" value={fee.pricePerDose}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setMiscFees(prev => { const next = [...prev]; next[idx] = { ...next[idx], pricePerDose: isNaN(val) ? 0 : val }; return next; });
                            }}
                            min={0} step="0.5"
                            className="w-20 px-2 py-1 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-center text-sm" />
                          <span className="text-xs text-[var(--ink-faded)]">元/副</span>
                        </div>
                        <label className="flex items-center gap-1 ml-auto cursor-pointer">
                          <input type="checkbox" checked={fee.enabled}
                            onChange={e => {
                              setMiscFees(prev => { const next = [...prev]; next[idx] = { ...next[idx], enabled: e.target.checked }; return next; });
                            }}
                            className="accent-[var(--vermilion)]" />
                          <span className="text-xs text-[var(--ink-faded)]">預設勾選</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={async () => { await saveSettings({ miscFees }); showSaved(); }}
                    className="mt-6 px-6 py-2 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                    儲存設定
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== 醫館配置 ===== */}
          {section === 'clinic' && (
            <div className="px-6 pt-4">
              <h2 className="text-base font-medium tracking-widest text-[var(--ink-black)] mb-4">醫館配置</h2>
              <div className="max-w-md">
                <div className="p-6 border border-[var(--label-border)]" style={{ background: 'var(--rice-paper)' }}>
                  <p className="text-xs text-[var(--ink-faded)] mb-6">
                    設定醫館名稱，將顯示在首頁頂部橫幅。
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="w-24 text-sm text-[var(--ink-light)] shrink-0">醫館名稱</label>
                      <input
                        type="text"
                        value={editingClinicName}
                        onChange={e => setEditingClinicName(e.target.value)}
                        placeholder="如：仁心中醫診所"
                        className="flex-1 px-3 py-2 text-sm border border-[var(--label-border)]
                          bg-transparent focus:outline-none focus:border-[var(--brass)]
                          transition-colors tracking-wider"
                        style={{ color: 'var(--ink-black)' }}
                      />
                    </div>
                    <div
                      className="mt-2 p-4 border border-[var(--label-border)]/60"
                      style={{ background: 'var(--rice-paper-dark)' }}
                    >
                      <p className="text-xs text-[var(--ink-faded)] mb-2 tracking-wider">預覽效果：</p>
                      <div className="text-center py-2">
                        <p
                          className="text-xl tracking-[0.4em] font-bold"
                          style={{ color: 'var(--ink-black)' }}
                        >
                          {editingClinicName || '醫館名稱'}
                        </p>
                        <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'var(--ink-faded)' }}>
                          中藥開方管理系統
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={handleSaveClinicName}
                      disabled={!editingClinicName.trim()}
                      className="px-6 py-2 text-sm border border-[var(--vermilion)]/40
                        text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      儲存設定
                    </button>
                    {clinicName !== editingClinicName && (
                      <button
                        onClick={() => setEditingClinicName(clinicName)}
                        className="text-xs text-[var(--ink-faded)] hover:text-[var(--ink-light)] transition-colors"
                      >
                        還原
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑药材弹窗 */}
      {editingHerb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingHerb(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 p-6 shadow-xl"
            style={{ background: 'var(--rice-paper)', border: '1px solid var(--label-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-lg font-medium tracking-wider mb-5 text-[var(--ink-black)]">
              {isAdding ? '新增藥材' : '編輯藥材'}
            </h3>
            <div className="space-y-3">
              {(
                [['繁體名', 'nameTraditional', 'text'], ['簡體名', 'name', 'text'], ['分類', 'category', 'text'], ['單價（元/克）', 'pricePerGram', 'number']] as [string, keyof Herb, string][]
              ).map(([label, field, type]) => (
                <div key={field as string} className="flex items-center gap-3">
                  <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">{label}</label>
                  <input
                    type={type}
                    value={field === 'pricePerGram' ? editingHerb.pricePerGram : (editingHerb[field] as string) ?? ''}
                    onChange={e => {
                      const val = field === 'pricePerGram' ? parseFloat(e.target.value) || 0 : e.target.value;
                      setEditingHerb(prev => prev ? { ...prev, [field]: val } : prev);
                    }}
                    step={field === 'pricePerGram' ? '0.001' : undefined}
                    className="flex-1 px-2 py-1.5 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-sm transition-colors" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">行（從0）</label>
                <input type="number" value={editingHerb.position.row}
                  onChange={e => setEditingHerb(prev => prev ? { ...prev, position: { ...prev.position, row: parseInt(e.target.value) || 0 } } : prev)}
                  min={0} className="w-20 px-2 py-1.5 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-sm transition-colors text-center" />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">列（從0）</label>
                <input type="number" value={editingHerb.position.col}
                  onChange={e => setEditingHerb(prev => prev ? { ...prev, position: { ...prev.position, col: parseInt(e.target.value) || 0 } } : prev)}
                  min={0} className="w-20 px-2 py-1.5 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-sm transition-colors text-center" />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">槽位</label>
                <select value={editingHerb.position.side}
                  onChange={e => setEditingHerb(prev => prev ? { ...prev, position: { ...prev.position, side: e.target.value as Herb['position']['side'] } } : prev)}
                  className="px-2 py-1.5 border border-[var(--label-border)] bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)] text-sm transition-colors">
                  {(() => {
                    const sc = activeProfile?.config.slotCount ?? 2;
                    if (sc === 1) return <option value="center">居中</option>;
                    if (sc === 2) return (<>
                      <option value="left">左</option>
                      <option value="right">右</option>
                    </>);
                    if (sc === 3) return (<>
                      <option value="left">左（縱向）</option>
                      <option value="top">上（橫向）</option>
                      <option value="right">右（縱向）</option>
                    </>);
                    return (<>
                      <option value="left">左（縱向）</option>
                      <option value="top">上（橫向）</option>
                      <option value="right">右（縱向）</option>
                      <option value="bottom">下（橫向）</option>
                    </>);
                  })()}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveEdit}
                className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                確認
              </button>
              <button onClick={() => setEditingHerb(null)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)] text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入预览弹窗 */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportPreview(null)} />
          <div className="relative z-10 w-full max-w-lg mx-4 p-6 shadow-xl"
            style={{ background: 'var(--rice-paper)', border: '1px solid var(--label-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-lg font-medium tracking-wider mb-4 text-[var(--ink-black)]">匯入預覽</h3>
            {importPreview.error ? (
              <div className="py-4 text-center text-[var(--vermilion)]">{importPreview.error}</div>
            ) : (
              <>
                <div className="space-y-2 text-sm text-[var(--ink-light)] mb-4">
                  {importPreview.name && <div><span className="text-[var(--ink-faded)]">藥柜名稱：</span>{importPreview.name}</div>}
                  {importPreview.config && <div><span className="text-[var(--ink-faded)]">尺寸：</span>{importPreview.config.rows} 行 × {importPreview.config.cols} 列</div>}
                  <div><span className="text-[var(--ink-faded)]">藥材數量：</span><span className="font-medium text-[var(--vermilion)]">{importPreview.herbs.length}</span> 味</div>
                </div>
                <div className="border border-[var(--label-border)] max-h-56 overflow-y-auto mb-4" style={{ background: 'var(--rice-paper)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--rice-paper-dark)' }}>
                        {['繁體名', '簡體名', '分類', '單價'].map(col => (
                          <th key={col} className="px-2 py-1.5 text-left font-medium text-[var(--ink-light)] border-b border-[var(--label-border)]">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.herbs.slice(0, 50).map((h, i) => (
                        <tr key={i} className="border-b border-[var(--label-border)]/40"
                          style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232,220,200,0.2)' }}>
                          <td className="px-2 py-1">{h.nameTraditional}</td>
                          <td className="px-2 py-1 text-[var(--ink-faded)]">{h.name}</td>
                          <td className="px-2 py-1 text-[var(--ink-faded)]">{h.category || '—'}</td>
                          <td className="px-2 py-1">¥{h.pricePerGram.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.herbs.length > 50 && (
                    <div className="text-center py-2 text-[var(--ink-faded)] text-xs">…共 {importPreview.herbs.length} 味，僅顯示前 50 味</div>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-faded)] mb-4">匯入後將覆蓋目前藥柜「{activeProfile?.name}」的所有藥材，此操作不可撤銷。</p>
              </>
            )}
            <div className="flex gap-3 mt-2">
              {!importPreview.error && (
                <button onClick={handleImportConfirm}
                  className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors">
                  確認匯入
                </button>
              )}
              <button onClick={() => setImportPreview(null)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)] text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建药柜弹窗 */}
      {showNewCabinet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewCabinet(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4 p-6 shadow-xl"
            style={{ background: 'var(--rice-paper)', border: '1px solid var(--label-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-lg font-medium tracking-wider mb-5 text-[var(--ink-black)]">新增藥櫃</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-[var(--ink-light)] shrink-0">藥櫃名稱</label>
                <input type="text" value={newCabinetName} onChange={e => setNewCabinetName(e.target.value)}
                  placeholder="如：精選飲片櫃"
                  className="flex-1 px-2 py-1.5 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-sm transition-colors"
                  autoFocus />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-[var(--ink-light)] shrink-0">說明（選填）</label>
                <input type="text" value={newCabinetDesc} onChange={e => setNewCabinetDesc(e.target.value)}
                  placeholder="藥櫃用途說明"
                  className="flex-1 px-2 py-1.5 border border-[var(--label-border)] bg-transparent focus:outline-none focus:border-[var(--brass)] text-sm transition-colors" />
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-faded)]">建立後為空藥櫃（7×8 格），可在藥材管理中添加藥材。</p>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreateCabinet} disabled={!newCabinetName.trim()}
                className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40 text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                建立
              </button>
              <button onClick={() => setShowNewCabinet(false)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)] text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
