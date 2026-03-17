-- =====================================================
-- 藥斗子診所管理系統 Database Schema
-- 在 Neon SQL Editor 中执行此文件完成建表
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 医馆配置表（每个用户一条）
CREATE TABLE IF NOT EXISTS clinic_settings (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL DEFAULT '藥斗子診所',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 药柜档案表
CREATE TABLE IF NOT EXISTS cabinet_profiles (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  rows        INT NOT NULL DEFAULT 7,
  cols        INT NOT NULL DEFAULT 8,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 药材表
CREATE TABLE IF NOT EXISTS herbs (
  id               TEXT PRIMARY KEY,
  cabinet_id       TEXT NOT NULL REFERENCES cabinet_profiles(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL,
  name             TEXT NOT NULL,
  name_traditional TEXT NOT NULL,
  price_per_gram   NUMERIC(10,4) NOT NULL DEFAULT 0.1,
  category         TEXT,
  pos_row          INT NOT NULL,
  pos_col          INT NOT NULL,
  pos_side         TEXT NOT NULL CHECK (pos_side IN ('left','right'))
);

-- 处方表
CREATE TABLE IF NOT EXISTS prescriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 处方药材表
CREATE TABLE IF NOT EXISTS prescription_items (
  id              SERIAL PRIMARY KEY,
  prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  herb_id         TEXT NOT NULL,
  herb_json       JSONB NOT NULL,
  weight          NUMERIC(10,2) NOT NULL
);

-- 杂项收费表
CREATE TABLE IF NOT EXISTS misc_fees (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price_per_dose NUMERIC(10,2) NOT NULL DEFAULT 0,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INT NOT NULL DEFAULT 0
);
