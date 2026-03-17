import { neon } from '@neondatabase/serverless';

// 每次调用创建一个新的 sql 函数（Neon serverless 推荐用法）
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置，请配置 Neon 数据库连接串');
  }
  return neon(process.env.DATABASE_URL);
}
