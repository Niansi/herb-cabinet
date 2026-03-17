import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { DEFAULT_PROFILES } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string };

    // 校验输入
    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少需要 6 位' }, { status: 400 });
    }

    const sql = getDb();

    // 检查邮箱是否已注册
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // 创建用户
    const hashed = await bcrypt.hash(password, 10);
    const newUsers = await sql`
      INSERT INTO users (email, password)
      VALUES (${email}, ${hashed})
      RETURNING id
    `;
    const userId = (newUsers[0] as { id: string }).id;

    // 初始化默认医馆配置
    await sql`
      INSERT INTO clinic_settings (user_id, clinic_name)
      VALUES (${userId}, '藥斗子診所')
    `;

    // 初始化默认杂项收费（煎药费）
    await sql`
      INSERT INTO misc_fees (id, user_id, name, price_per_dose, enabled, sort_order)
      VALUES (${`decoction-${userId}`}, ${userId}, '煎藥費', 2, true, 0)
    `;

    // 初始化默认药柜（使用 DEFAULT_PROFILES[0]）
    const defaultProfile = DEFAULT_PROFILES[0];
    const cabinetId = `cabinet-${userId}-default`;
    await sql`
      INSERT INTO cabinet_profiles (id, user_id, name, description, rows, cols)
      VALUES (
        ${cabinetId},
        ${userId},
        ${defaultProfile.name},
        ${defaultProfile.description ?? null},
        ${defaultProfile.config.rows},
        ${defaultProfile.config.cols}
      )
    `;

    // 批量插入默认药材
    if (defaultProfile.herbs.length > 0) {
      for (const herb of defaultProfile.herbs) {
        await sql`
          INSERT INTO herbs (id, cabinet_id, user_id, name, name_traditional, price_per_gram, category, pos_row, pos_col, pos_side)
          VALUES (
            ${`${herb.id}-${userId}`},
            ${cabinetId},
            ${userId},
            ${herb.name},
            ${herb.nameTraditional},
            ${herb.pricePerGram},
            ${herb.category ?? null},
            ${herb.position.row},
            ${herb.position.col},
            ${herb.position.side}
          )
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
