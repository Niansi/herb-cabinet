/**
 * 数据库迁移：
 * 1. cabinet_profiles 表添加 slot_count 字段（默认 2）
 * 2. herbs 表删除旧的 pos_side CHECK 约束，添加新的允许 'center','top','bottom' 的约束
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_PN0sIobtacT1@ep-bold-mud-a19xpjmg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

async function run() {
  console.log('开始数据库迁移...\n');

  // 1. 为 cabinet_profiles 添加 slot_count 列（如果不存在）
  try {
    await sql`
      ALTER TABLE cabinet_profiles
      ADD COLUMN IF NOT EXISTS slot_count INT NOT NULL DEFAULT 2
    `;
    console.log('✅ cabinet_profiles.slot_count 列添加成功（或已存在）');
  } catch (e) {
    console.error('❌ 添加 slot_count 列失败:', e.message);
  }

  // 2. 为 slot_count 添加 CHECK 约束（如果不存在）
  try {
    await sql`
      ALTER TABLE cabinet_profiles
      DROP CONSTRAINT IF EXISTS cabinet_profiles_slot_count_check
    `;
    await sql`
      ALTER TABLE cabinet_profiles
      ADD CONSTRAINT cabinet_profiles_slot_count_check
      CHECK (slot_count BETWEEN 1 AND 4)
    `;
    console.log('✅ cabinet_profiles.slot_count CHECK 约束更新成功');
  } catch (e) {
    console.error('❌ 更新 slot_count CHECK 约束失败:', e.message);
  }

  // 3. 更新 herbs.pos_side 的 CHECK 约束（先删除旧约束再添加新的）
  try {
    // 查找旧约束名称
    const constraints = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'herbs'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%pos_side%'
    `;
    for (const c of constraints) {
      await sql.query(`ALTER TABLE herbs DROP CONSTRAINT IF EXISTS "${c.constraint_name}"`);
      console.log(`✅ 删除旧约束: ${c.constraint_name}`);
    }

    await sql`
      ALTER TABLE herbs
      ADD CONSTRAINT herbs_pos_side_check
      CHECK (pos_side IN ('left', 'right', 'top', 'bottom', 'center'))
    `;
    console.log('✅ herbs.pos_side CHECK 约束更新成功（支持 left/right/top/bottom/center）');
  } catch (e) {
    console.error('❌ 更新 herbs.pos_side CHECK 约束失败:', e.message);
    console.log('   尝试直接更新现有约束...');
    // 尝试直接删除所有 herbs check 约束再重建
    try {
      const constraints2 = await sql`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'herbs'::regclass
          AND contype = 'c'
      `;
      for (const c of constraints2) {
        if (c.conname.includes('pos_side')) {
          await sql.query(`ALTER TABLE herbs DROP CONSTRAINT IF EXISTS "${c.conname}"`);
          console.log(`✅ 删除旧约束(pg): ${c.conname}`);
        }
      }
      await sql`
        ALTER TABLE herbs
        ADD CONSTRAINT herbs_pos_side_check
        CHECK (pos_side IN ('left', 'right', 'top', 'bottom', 'center'))
      `;
      console.log('✅ herbs.pos_side CHECK 约束更新成功（备用方案）');
    } catch (e2) {
      console.error('❌ 备用方案也失败:', e2.message);
    }
  }

  // 验证结果
  console.log('\n--- 验证迁移结果 ---');
  try {
    const result = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'cabinet_profiles'
        AND column_name = 'slot_count'
    `;
    if (result.length > 0) {
      console.log('✓ cabinet_profiles.slot_count:', result[0]);
    } else {
      console.log('⚠️  cabinet_profiles.slot_count 列不存在');
    }
  } catch (e) {
    console.error('验证失败:', e.message);
  }

  console.log('\n迁移完成！');
}

run().catch(err => {
  console.error('运行失败:', err);
  process.exit(1);
});
