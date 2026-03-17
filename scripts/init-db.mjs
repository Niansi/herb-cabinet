import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const DATABASE_URL = 'postgresql://neondb_owner:npg_PN0sIobtacT1@ep-bold-mud-a19xpjmg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

const schema = readFileSync('src/lib/db/schema.sql', 'utf-8');

// 去掉注释行，按分号拆分
const statements = schema
  .replace(/--[^\n]*/g, '')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 10);

async function run() {
  console.log(`执行 ${statements.length} 条 SQL 语句...\n`);

  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      const match = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) {
        console.log('✅ 建表成功:', match[1]);
      }
    } catch(e) {
      console.error('❌ 错误:', e.message);
      console.error('   SQL:', stmt.slice(0, 80));
    }
  }

  // 验证：查询所有表
  console.log('\n--- 验证当前数据库表 ---');
  const result = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  if (result.length === 0) {
    console.log('⚠️  没有找到任何表');
  } else {
    console.log('当前数据库中的表：');
    result.forEach(t => console.log(' ✓', t.table_name));
  }
}

run().catch(err => {
  console.error('运行失败:', err);
  process.exit(1);
});
