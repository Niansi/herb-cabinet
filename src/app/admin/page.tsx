'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Herb, CabinetProfile, Prescription } from '@/lib/types';
import { loadProfiles, saveProfiles, loadPrescriptions, savePrescriptions } from '@/lib/store';
import { DEFAULT_PROFILES } from '@/lib/data';
import {
  exportCabinetToExcel,
  importCabinetFromExcel,
  ImportPreview,
  exportPrescriptionsToExcel,
  importPrescriptionsFromExcel,
} from '@/lib/excel';
import Link from 'next/link';

type TabKey = 'herbs' | 'config';
type SectionKey = 'cabinet' | 'prescription';

export default function AdminPage() {
  const [profiles, setProfiles] = useState<CabinetProfile[]>([]);
  const [activeCabinetId, setActiveCabinetId] = useState<string>('');
  const [tab, setTab] = useState<TabKey>('herbs');
  const [section, setSection] = useState<SectionKey>('cabinet');
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  // 编辑药材弹窗
  const [editingHerb, setEditingHerb] = useState<Herb | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 搜索
  const [search, setSearch] = useState('');

  // 新建药柜弹窗
  const [showNewCabinet, setShowNewCabinet] = useState(false);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetDesc, setNewCabinetDesc] = useState('');

  // 导入预览弹窗
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // 处方管理
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [presImportLoading, setPresImportLoading] = useState(false);
  const presImportFileRef = useRef<HTMLInputElement>(null);
  // 日期筛选
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const ps = loadProfiles();
    setProfiles(ps);
    setActiveCabinetId(ps[0]?.id ?? '');
    setPrescriptions(loadPrescriptions());
    setMounted(true);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeCabinetId);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // 更新某个 profile
  const updateProfile = useCallback((updated: CabinetProfile) => {
    setProfiles(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      saveProfiles(next);
      return next;
    });
  }, []);

  // ── 药材操作 ──────────────────────────────────────────────────────────────

  const handleDeleteHerb = (id: string) => {
    if (!activeProfile) return;
    updateProfile({
      ...activeProfile,
      herbs: activeProfile.herbs.filter(h => h.id !== id),
    });
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

  const handleSaveHerbs = useCallback(() => {
    if (!activeProfile) return;
    saveProfiles(profiles);
    showSaved();
  }, [activeProfile, profiles]);

  const handleResetHerbs = () => {
    if (!activeProfile) return;
    const def = DEFAULT_PROFILES.find(p => p.id === activeProfile.id);
    if (!def) {
      alert('此藥櫃無預設資料');
      return;
    }
    if (!confirm('確定要恢復此藥櫃的預設藥材嗎？')) return;
    updateProfile({ ...activeProfile, herbs: def.herbs });
    showSaved();
  };

  // ── 药柜配置 ──────────────────────────────────────────────────────────────

  const handleSaveConfig = useCallback(() => {
    saveProfiles(profiles);
    showSaved();
  }, [profiles]);

  // ── 多药柜管理 ──────────────────────────────────────────────────────────────

  const handleCreateCabinet = () => {
    if (!newCabinetName.trim()) return;
    const newProfile: CabinetProfile = {
      id: `cabinet-${Date.now()}`,
      name: newCabinetName.trim(),
      description: newCabinetDesc.trim(),
      config: { rows: 7, cols: 8 },
      herbs: [],
      createdAt: new Date().toISOString(),
    };
    const next = [...profiles, newProfile];
    setProfiles(next);
    saveProfiles(next);
    setActiveCabinetId(newProfile.id);
    setNewCabinetName('');
    setNewCabinetDesc('');
    setShowNewCabinet(false);
    showSaved();
  };

  const handleDeleteCabinet = (id: string) => {
    if (profiles.length <= 1) {
      alert('至少需要保留一個藥櫃');
      return;
    }
    if (!confirm('確定要刪除此藥櫃嗎？')) return;
    const next = profiles.filter(p => p.id !== id);
    setProfiles(next);
    saveProfiles(next);
    if (activeCabinetId === id) setActiveCabinetId(next[0]?.id ?? '');
  };

  const handleRenameCabinet = (id: string, name: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    updateProfile({ ...p, name });
  };

  // ── 导出 / 导入（药柜）──────────────────────────────────────────────────────────────

  const handleExportCabinet = () => {
    if (!activeProfile) return;
    exportCabinetToExcel(activeProfile);
  };

  const handleImportTrigger = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const preview = await importCabinetFromExcel(file);
    setImportLoading(false);
    setImportPreview(preview);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview || !activeProfile) return;
    const updated: CabinetProfile = {
      ...activeProfile,
      herbs: importPreview.herbs,
      ...(importPreview.config ? { config: importPreview.config } : {}),
      ...(importPreview.name ? { name: importPreview.name } : {}),
      ...(importPreview.description !== undefined
        ? { description: importPreview.description }
        : {}),
    };
    updateProfile(updated);
    setImportPreview(null);
    showSaved();
  };

  // ── 处方管理操作 ──────────────────────────────────────────────────────────────

  const handleDeletePrescription = (id: string) => {
    if (!confirm('確定要刪除此處方嗎？')) return;
    setPrescriptions(prev => {
      const next = prev.filter(p => p.id !== id);
      savePrescriptions(next);
      return next;
    });
  };

  const handleExportPrescriptions = () => {
    exportPrescriptionsToExcel(prescriptions);
  };

  const handlePresImportTrigger = () => {
    presImportFileRef.current?.click();
  };

  const handlePresImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPresImportLoading(true);
    const imported = await importPrescriptionsFromExcel(file);
    setPresImportLoading(false);
    e.target.value = '';
    if (!imported || imported.length === 0) {
      alert('未讀取到有效處方資料');
      return;
    }
    if (!confirm(`讀取到 ${imported.length} 張處方，確定要匯入嗎？\n（將與現有處方合併）`)) return;
    setPrescriptions(prev => {
      // 合并，避免重复 id
      const existingIds = new Set(prev.map(p => p.id));
      const newOnes = imported.filter(p => !existingIds.has(p.id));
      const next = [...newOnes, ...prev];
      savePrescriptions(next);
      return next;
    });
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
    <div
      className="min-h-screen relative z-10"
      style={{ background: 'var(--rice-paper)' }}
    >
      {/* 顶栏 */}
      <header
        className="px-6 py-3 flex items-center justify-between border-b border-[var(--label-border)]"
        style={{ background: 'var(--rice-paper-dark)' }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[var(--ink-faded)] hover:text-[var(--vermilion)] transition-colors text-sm"
          >
            ← 返回藥櫃
          </Link>
          <h1
            className="text-xl font-bold tracking-widest"
            style={{ color: 'var(--ink-black)' }}
          >
            {section === 'cabinet' ? '管理藥櫃' : '管理處方'}
          </h1>
        </div>
        {saved && (
          <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-sm">
            已儲存
          </span>
        )}
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        {/* ── 左侧导航 ── */}
        <aside
          className="w-48 shrink-0 border-r border-[var(--label-border)] flex flex-col"
          style={{ background: 'var(--rice-paper-dark)' }}
        >
          {/* 一级分区 */}
          <div className="flex border-b border-[var(--label-border)]">
            <button
              onClick={() => setSection('cabinet')}
              className={`
                flex-1 py-2.5 text-xs tracking-wider transition-colors
                ${section === 'cabinet'
                  ? 'text-[var(--vermilion)] border-b-2 border-[var(--vermilion)] -mb-px'
                  : 'text-[var(--ink-faded)] hover:text-[var(--ink-light)]'
                }
              `}
            >
              管理藥櫃
            </button>
            <button
              onClick={() => setSection('prescription')}
              className={`
                flex-1 py-2.5 text-xs tracking-wider transition-colors
                ${section === 'prescription'
                  ? 'text-[var(--vermilion)] border-b-2 border-[var(--vermilion)] -mb-px'
                  : 'text-[var(--ink-faded)] hover:text-[var(--ink-light)]'
                }
              `}
            >
              管理處方
            </button>
          </div>

          {section === 'cabinet' && (
            <>
              <div className="px-3 pt-4 pb-2 text-xs text-[var(--ink-faded)] tracking-wider">
                藥櫃列表
              </div>
              <div className="flex-1 overflow-y-auto">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className={`
                      group flex items-center px-3 py-2.5 cursor-pointer
                      border-l-2 transition-colors
                      ${profile.id === activeCabinetId
                        ? 'border-[var(--vermilion)] bg-[var(--label-bg)] text-[var(--ink-black)]'
                        : 'border-transparent text-[var(--ink-faded)] hover:bg-[var(--label-bg)]/50 hover:text-[var(--ink-light)]'
                      }
                    `}
                    onClick={() => setActiveCabinetId(profile.id)}
                  >
                    <span className="flex-1 text-sm truncate">{profile.name}</span>
                    {profiles.length > 1 && (
                      <button
                        className="opacity-0 group-hover:opacity-100 text-[var(--ink-faded)]
                          hover:text-[var(--vermilion)] transition-all text-xs ml-1 shrink-0"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteCabinet(profile.id);
                        }}
                        title="刪除此藥櫃"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* 新建药柜 */}
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
            </>
          )}

          {section === 'prescription' && (
            <div className="flex-1 overflow-y-auto px-3 pt-4">
              <div className="text-xs text-[var(--ink-faded)] tracking-wider mb-2">
                共 {prescriptions.length} 張處方
              </div>
              {prescriptions.length === 0 ? (
                <div className="text-xs text-[var(--ink-faded)] mt-6 text-center leading-relaxed">
                  暫無歷史處方
                </div>
              ) : (
                <div className="space-y-1">
                  {prescriptions.map((pres, idx) => (
                    <div
                      key={pres.id}
                      className="px-2 py-1.5 text-xs text-[var(--ink-faded)]"
                    >
                      <span className="mr-1">#{idx + 1}</span>
                      <span className="truncate">{pres.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── 右侧内容 ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ===== 管理藥櫃内容 ===== */}
          {section === 'cabinet' && (
            activeProfile ? (
              <div className="px-6 pt-4">
                {/* 药柜名编辑 */}
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
                    {activeProfile.herbs.length} 味藥材
                    ｜{activeProfile.config.rows}×{activeProfile.config.cols} 格
                  </span>
                </div>

                {/* 标签页 */}
                <div className="flex gap-1 border-b border-[var(--label-border)] mb-5">
                  {([['herbs', '藥材管理'], ['config', '藥櫃設定']] as [TabKey, string][]).map(
                    ([key, label]) => (
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
                    )
                  )}
                </div>

                {/* 药材管理 */}
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
                      <button
                        onClick={handleNewHerb}
                        className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]
                          text-[var(--ink-light)] hover:bg-[var(--brass)]/10 transition-colors"
                      >
                        + 新增藥材
                      </button>
                      <button
                        onClick={handleSaveHerbs}
                        className="px-4 py-1.5 text-sm border border-[var(--vermilion)]/40
                          text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors"
                      >
                        儲存變更
                      </button>
                      <button
                        onClick={handleResetHerbs}
                        className="px-4 py-1.5 text-sm text-[var(--ink-faded)]
                          hover:text-[var(--ink-light)] transition-colors"
                      >
                        恢復預設
                      </button>
                      <button
                        onClick={handleExportCabinet}
                        className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60
                          text-[var(--ink-faded)] hover:text-[var(--ink-light)]
                          hover:bg-[var(--brass)]/10 transition-colors"
                      >
                        匯出 Excel
                      </button>
                      <button
                        onClick={handleImportTrigger}
                        disabled={importLoading}
                        className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60
                          text-[var(--ink-faded)] hover:text-[var(--ink-light)]
                          hover:bg-[var(--brass)]/10 transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {importLoading ? '讀取中…' : '匯入 Excel'}
                      </button>
                      {/* 隐藏文件输入 */}
                      <input
                        ref={importFileRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleImportFile}
                      />
                      <span className="text-sm text-[var(--ink-faded)] ml-auto">
                        共 {activeProfile.herbs.length} 味藥材
                      </span>
                    </div>

                    <div
                      className="border border-[var(--label-border)] overflow-hidden"
                      style={{ background: 'var(--rice-paper)' }}
                    >
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: 'var(--rice-paper-dark)' }}>
                            {['繁體名', '簡體名', '分類', '單價(元/克)', '位置', '操作'].map(col => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left font-medium text-[var(--ink-light)]
                                  border-b border-[var(--label-border)]"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHerbs.map((herb, i) => (
                            <tr
                              key={herb.id}
                              className="border-b border-[var(--label-border)]/40
                                hover:bg-[var(--label-bg)]/50 transition-colors"
                              style={{
                                background: i % 2 === 0 ? 'transparent' : 'rgba(232,220,200,0.2)',
                              }}
                            >
                              <td className="px-3 py-2 font-medium">{herb.nameTraditional}</td>
                              <td className="px-3 py-2 text-[var(--ink-faded)]">{herb.name}</td>
                              <td className="px-3 py-2">
                                <span
                                  className="px-2 py-0.5 text-xs border border-[var(--label-border)]
                                    text-[var(--ink-faded)]"
                                >
                                  {herb.category || '未分類'}
                                </span>
                              </td>
                              <td className="px-3 py-2">¥{herb.pricePerGram.toFixed(3)}</td>
                              <td className="px-3 py-2 text-[var(--ink-faded)]">
                                第{herb.position.row + 1}行第{herb.position.col + 1}列
                                {herb.position.side === 'left' ? '（左）' : '（右）'}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleEditHerb(herb)}
                                    className="text-[var(--ink-faded)] hover:text-[var(--brass)]
                                      transition-colors"
                                  >
                                    編輯
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHerb(herb.id)}
                                    className="text-[var(--ink-faded)] hover:text-[var(--vermilion)]
                                      transition-colors"
                                  >
                                    刪除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredHerbs.length === 0 && (
                        <div className="text-center py-12 text-[var(--ink-faded)]">
                          無符合條件的藥材
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 药柜设置 */}
                {tab === 'config' && (
                  <div className="max-w-md">
                    <div
                      className="p-6 border border-[var(--label-border)]"
                      style={{ background: 'var(--rice-paper)' }}
                    >
                      <h3
                        className="text-base font-medium mb-6 tracking-wider"
                        style={{ color: 'var(--ink-black)' }}
                      >
                        藥櫃尺寸設定
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="w-24 text-sm text-[var(--ink-light)]">行數（橫）</label>
                          <input
                            type="number"
                            value={activeProfile.config.rows}
                            onChange={e => {
                              const rows = Math.max(1, Math.min(20, parseInt(e.target.value) || 7));
                              updateProfile({ ...activeProfile, config: { ...activeProfile.config, rows } });
                            }}
                            min={1}
                            max={20}
                            className="w-20 px-2 py-1 border border-[var(--label-border)]
                              bg-transparent focus:outline-none focus:border-[var(--brass)]
                              text-center text-sm"
                          />
                          <span className="text-xs text-[var(--ink-faded)]">（1–20）</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="w-24 text-sm text-[var(--ink-light)]">列數（縱）</label>
                          <input
                            type="number"
                            value={activeProfile.config.cols}
                            onChange={e => {
                              const cols = Math.max(1, Math.min(20, parseInt(e.target.value) || 8));
                              updateProfile({ ...activeProfile, config: { ...activeProfile.config, cols } });
                            }}
                            min={1}
                            max={20}
                            className="w-20 px-2 py-1 border border-[var(--label-border)]
                              bg-transparent focus:outline-none focus:border-[var(--brass)]
                              text-center text-sm"
                          />
                          <span className="text-xs text-[var(--ink-faded)]">（1–20）</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 border border-[var(--label-border)]/60 text-xs text-[var(--ink-faded)]">
                        目前設定：{activeProfile.config.rows} 行 × {activeProfile.config.cols} 列
                        = {activeProfile.config.rows * activeProfile.config.cols} 個抽屜，
                        最多可放 {activeProfile.config.rows * activeProfile.config.cols * 2} 味藥材
                      </div>
                      <button
                        onClick={handleSaveConfig}
                        className="mt-6 px-6 py-2 text-sm border border-[var(--vermilion)]/40
                          text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors"
                      >
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

          {/* ===== 管理處方内容 ===== */}
          {section === 'prescription' && (() => {
            // 日期筛选逻辑
            const filtered = prescriptions.filter(pres => {
              const d = pres.createdAt.slice(0, 10);
              if (filterDateFrom && d < filterDateFrom) return false;
              if (filterDateTo && d > filterDateTo) return false;
              return true;
            });

            return (
              <div className="px-6 pt-4">
                {/* 操作栏 */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h2 className="text-base font-medium tracking-widest text-[var(--ink-black)] mr-2">
                    已存處方
                  </h2>
                  <button
                    onClick={handleExportPrescriptions}
                    disabled={prescriptions.length === 0}
                    className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60
                      text-[var(--ink-faded)] hover:text-[var(--ink-light)]
                      hover:bg-[var(--brass)]/10 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    匯出 Excel
                  </button>
                  <button
                    onClick={handlePresImportTrigger}
                    disabled={presImportLoading}
                    className="px-4 py-1.5 text-sm border border-[var(--brass-dark)]/60
                      text-[var(--ink-faded)] hover:text-[var(--ink-light)]
                      hover:bg-[var(--brass)]/10 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {presImportLoading ? '讀取中…' : '匯入 Excel'}
                  </button>
                  <input
                    ref={presImportFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handlePresImportFile}
                  />
                  <span className="text-sm text-[var(--ink-faded)] ml-auto">
                    顯示 {filtered.length} / {prescriptions.length} 張
                  </span>
                </div>

                {/* 日期筛选栏 */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <span className="text-xs text-[var(--ink-faded)]">日期篩選：</span>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    className="px-2 py-1 text-xs border border-[var(--label-border)]
                      bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                      transition-colors text-[var(--ink-light)]"
                  />
                  <span className="text-xs text-[var(--ink-faded)]">至</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    className="px-2 py-1 text-xs border border-[var(--label-border)]
                      bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                      transition-colors text-[var(--ink-light)]"
                  />
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                      className="text-xs text-[var(--ink-faded)] hover:text-[var(--vermilion)]
                        transition-colors"
                    >
                      清除篩選
                    </button>
                  )}
                </div>

                {prescriptions.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-24
                      text-[var(--ink-faded)] border border-dashed border-[var(--label-border)]"
                  >
                    <p className="text-lg mb-2">暫無歷史處方</p>
                    <p className="text-sm">在首頁開方後點擊「存方」，或從 Excel 匯入</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16
                      text-[var(--ink-faded)] border border-dashed border-[var(--label-border)]"
                  >
                    <p className="text-base">所選日期範圍內無處方記錄</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((pres, idx) => {
                      const totalWeight = pres.items.reduce((s, it) => s + it.weight, 0);
                      const totalPrice = pres.items.reduce(
                        (s, it) => s + it.herb.pricePerGram * it.weight,
                        0
                      );
                      const dateStr = new Date(pres.createdAt).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={pres.id}
                          className="border border-[var(--label-border)]"
                          style={{ background: 'var(--rice-paper)' }}
                        >
                          {/* 处方头部 */}
                          <div className="flex items-center px-4 py-3">
                            <span className="text-xs text-[var(--ink-faded)] w-7 shrink-0">
                              #{idx + 1}
                            </span>
                            <span
                              className="font-medium text-[var(--ink-black)] tracking-wider flex-1"
                            >
                              {pres.name}
                            </span>
                            <span className="text-xs text-[var(--ink-faded)] mr-4">
                              {dateStr}
                            </span>
                            <span className="text-xs text-[var(--ink-faded)] mr-4">
                              {pres.items.length} 味 · {totalWeight.toFixed(1)} 克
                            </span>
                            <span
                              className="text-sm font-medium mr-4"
                              style={{ color: 'var(--vermilion)' }}
                            >
                              ¥{totalPrice.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleDeletePrescription(pres.id)}
                              className="text-[var(--ink-faded)] hover:text-[var(--vermilion)]
                                transition-colors text-xs px-1"
                              title="刪除此處方"
                            >
                              刪除
                            </button>
                          </div>

                          {/* 药材明细（始终展开）*/}
                          <div
                            className="border-t border-[var(--label-border)]/60 px-4 py-3"
                            style={{ background: 'rgba(232,220,200,0.15)' }}
                          >
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  {['藥材', '重量(克)', '單價(元/克)', '小計(元)'].map(col => (
                                    <th
                                      key={col}
                                      className="pb-2 text-left text-xs font-medium
                                        text-[var(--ink-faded)] border-b border-[var(--label-border)]/40"
                                    >
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {pres.items.map((item, i) => (
                                  <tr
                                    key={item.herbId}
                                    className="border-b border-[var(--label-border)]/30"
                                    style={{
                                      background: i % 2 === 0
                                        ? 'transparent'
                                        : 'rgba(232,220,200,0.2)',
                                    }}
                                  >
                                    <td className="py-1.5 font-medium text-[var(--ink-black)]">
                                      {item.herb.nameTraditional}
                                    </td>
                                    <td className="py-1.5 text-[var(--ink-light)]">
                                      {item.weight}
                                    </td>
                                    <td className="py-1.5 text-[var(--ink-faded)]">
                                      ¥{item.herb.pricePerGram.toFixed(3)}
                                    </td>
                                    <td className="py-1.5 text-[var(--ink-light)]">
                                      ¥{(item.herb.pricePerGram * item.weight).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── 编辑药材弹窗 ── */}
      {editingHerb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingHerb(null)}
          />
          <div
            className="relative z-10 w-full max-w-md mx-4 p-6 shadow-xl"
            style={{
              background: 'var(--rice-paper)',
              border: '1px solid var(--label-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3 className="text-lg font-medium tracking-wider mb-5 text-[var(--ink-black)]">
              {isAdding ? '新增藥材' : '編輯藥材'}
            </h3>
            <div className="space-y-3">
              {(
                [
                  ['繁體名', 'nameTraditional', 'text'],
                  ['簡體名', 'name', 'text'],
                  ['分類', 'category', 'text'],
                  ['單價（元/克）', 'pricePerGram', 'number'],
                ] as [string, keyof Herb, string][]
              ).map(([label, field, type]) => (
                <div key={field as string} className="flex items-center gap-3">
                  <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={
                      field === 'pricePerGram'
                        ? editingHerb.pricePerGram
                        : (editingHerb[field] as string) ?? ''
                    }
                    onChange={e => {
                      const val = field === 'pricePerGram'
                        ? parseFloat(e.target.value) || 0
                        : e.target.value;
                      setEditingHerb(prev => prev ? { ...prev, [field]: val } : prev);
                    }}
                    step={field === 'pricePerGram' ? '0.001' : undefined}
                    className="flex-1 px-2 py-1.5 border border-[var(--label-border)]
                      bg-transparent focus:outline-none focus:border-[var(--brass)]
                      text-sm transition-colors"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">行（從0）</label>
                <input
                  type="number"
                  value={editingHerb.position.row}
                  onChange={e => setEditingHerb(prev => prev
                    ? { ...prev, position: { ...prev.position, row: parseInt(e.target.value) || 0 } }
                    : prev
                  )}
                  min={0}
                  className="w-20 px-2 py-1.5 border border-[var(--label-border)]
                    bg-transparent focus:outline-none focus:border-[var(--brass)]
                    text-sm transition-colors text-center"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">列（從0）</label>
                <input
                  type="number"
                  value={editingHerb.position.col}
                  onChange={e => setEditingHerb(prev => prev
                    ? { ...prev, position: { ...prev.position, col: parseInt(e.target.value) || 0 } }
                    : prev
                  )}
                  min={0}
                  className="w-20 px-2 py-1.5 border border-[var(--label-border)]
                    bg-transparent focus:outline-none focus:border-[var(--brass)]
                    text-sm transition-colors text-center"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-28 text-sm text-[var(--ink-light)] shrink-0">左/右</label>
                <select
                  value={editingHerb.position.side}
                  onChange={e => setEditingHerb(prev => prev
                    ? { ...prev, position: { ...prev.position, side: e.target.value as 'left' | 'right' } }
                    : prev
                  )}
                  className="px-2 py-1.5 border border-[var(--label-border)]
                    bg-[var(--rice-paper)] focus:outline-none focus:border-[var(--brass)]
                    text-sm transition-colors"
                >
                  <option value="left">左</option>
                  <option value="right">右</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40
                  text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors"
              >
                確認
              </button>
              <button
                onClick={() => setEditingHerb(null)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)]
                  text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 导入预览弹窗 ── */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setImportPreview(null)}
          />
          <div
            className="relative z-10 w-full max-w-lg mx-4 p-6 shadow-xl"
            style={{
              background: 'var(--rice-paper)',
              border: '1px solid var(--label-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3 className="text-lg font-medium tracking-wider mb-4 text-[var(--ink-black)]">
              匯入預覽
            </h3>

            {importPreview.error ? (
              <div className="py-4 text-center text-[var(--vermilion)]">
                {importPreview.error}
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm text-[var(--ink-light)] mb-4">
                  {importPreview.name && (
                    <div>
                      <span className="text-[var(--ink-faded)]">藥柜名稱：</span>
                      {importPreview.name}
                    </div>
                  )}
                  {importPreview.config && (
                    <div>
                      <span className="text-[var(--ink-faded)]">尺寸：</span>
                      {importPreview.config.rows} 行 × {importPreview.config.cols} 列
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--ink-faded)]">藥材數量：</span>
                    <span className="font-medium text-[var(--vermilion)]">
                      {importPreview.herbs.length}
                    </span>
                    {' '}味
                  </div>
                </div>

                {/* 药材预览表 */}
                <div
                  className="border border-[var(--label-border)] max-h-56 overflow-y-auto mb-4"
                  style={{ background: 'var(--rice-paper)' }}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--rice-paper-dark)' }}>
                        {['繁體名', '簡體名', '分類', '單價'].map(col => (
                          <th
                            key={col}
                            className="px-2 py-1.5 text-left font-medium text-[var(--ink-light)]
                              border-b border-[var(--label-border)]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.herbs.slice(0, 50).map((h, i) => (
                        <tr
                          key={i}
                          className="border-b border-[var(--label-border)]/40"
                          style={{
                            background: i % 2 === 0
                              ? 'transparent'
                              : 'rgba(232,220,200,0.2)',
                          }}
                        >
                          <td className="px-2 py-1">{h.nameTraditional}</td>
                          <td className="px-2 py-1 text-[var(--ink-faded)]">{h.name}</td>
                          <td className="px-2 py-1 text-[var(--ink-faded)]">
                            {h.category || '—'}
                          </td>
                          <td className="px-2 py-1">¥{h.pricePerGram.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.herbs.length > 50 && (
                    <div className="text-center py-2 text-[var(--ink-faded)] text-xs">
                      …共 {importPreview.herbs.length} 味，僅顯示前 50 味
                    </div>
                  )}
                </div>

                <p className="text-xs text-[var(--ink-faded)] mb-4">
                  匯入後將覆蓋目前藥柜「{activeProfile?.name}」的所有藥材，此操作不可撤銷。
                </p>
              </>
            )}

            <div className="flex gap-3 mt-2">
              {!importPreview.error && (
                <button
                  onClick={handleImportConfirm}
                  className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40
                    text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors"
                >
                  確認匯入
                </button>
              )}
              <button
                onClick={() => setImportPreview(null)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)]
                  text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 新建药柜弹窗 ── */}
      {showNewCabinet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNewCabinet(false)}
          />
          <div
            className="relative z-10 w-full max-w-sm mx-4 p-6 shadow-xl"
            style={{
              background: 'var(--rice-paper)',
              border: '1px solid var(--label-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h3 className="text-lg font-medium tracking-wider mb-5 text-[var(--ink-black)]">
              新增藥櫃
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-[var(--ink-light)] shrink-0">
                  藥櫃名稱
                </label>
                <input
                  type="text"
                  value={newCabinetName}
                  onChange={e => setNewCabinetName(e.target.value)}
                  placeholder="如：精選飲片櫃"
                  className="flex-1 px-2 py-1.5 border border-[var(--label-border)]
                    bg-transparent focus:outline-none focus:border-[var(--brass)]
                    text-sm transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-[var(--ink-light)] shrink-0">
                  說明（選填）
                </label>
                <input
                  type="text"
                  value={newCabinetDesc}
                  onChange={e => setNewCabinetDesc(e.target.value)}
                  placeholder="藥櫃用途說明"
                  className="flex-1 px-2 py-1.5 border border-[var(--label-border)]
                    bg-transparent focus:outline-none focus:border-[var(--brass)]
                    text-sm transition-colors"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-faded)]">
              建立後為空藥櫃（7×8 格），可在藥材管理中添加藥材。
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleCreateCabinet}
                disabled={!newCabinetName.trim()}
                className="flex-1 py-2 text-sm border border-[var(--vermilion)]/40
                  text-[var(--vermilion)] hover:bg-[var(--vermilion)]/10 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                建立
              </button>
              <button
                onClick={() => setShowNewCabinet(false)}
                className="flex-1 py-2 text-sm border border-[var(--label-border)]
                  text-[var(--ink-faded)] hover:bg-[var(--label-bg)] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
