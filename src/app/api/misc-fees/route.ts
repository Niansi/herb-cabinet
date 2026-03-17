import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { MiscFee } from '@/lib/types';

// GET /api/misc-fees - 获取当前用户杂项收费配置
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const sql = getDb();

  const rows = await sql`
    SELECT id, name, price_per_dose, enabled
    FROM misc_fees
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, id ASC
  `;

  const fees: MiscFee[] = (rows as Array<{
    id: string; name: string; price_per_dose: string; enabled: boolean;
  }>).map(r => ({
    id: r.id,
    name: r.name,
    pricePerDose: parseFloat(r.price_per_dose),
    enabled: r.enabled,
  }));

  return NextResponse.json(fees);
}

// PUT /api/misc-fees - 整体保存杂项收费配置
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const fees = await req.json() as MiscFee[];

  const sql = getDb();
  // 删除旧记录，重新插入
  await sql`DELETE FROM misc_fees WHERE user_id = ${userId}`;
  for (let i = 0; i < fees.length; i++) {
    const fee = fees[i];
    await sql`
      INSERT INTO misc_fees (id, user_id, name, price_per_dose, enabled, sort_order)
      VALUES (${fee.id}, ${userId}, ${fee.name}, ${fee.pricePerDose}, ${fee.enabled}, ${i})
    `;
  }

  return NextResponse.json({ success: true });
}
