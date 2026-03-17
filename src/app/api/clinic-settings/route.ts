import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';

// GET /api/clinic-settings - 获取医馆配置
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const sql = getDb();

  const rows = await sql`
    SELECT clinic_name FROM clinic_settings WHERE user_id = ${userId} LIMIT 1
  `;

  const clinicName = rows.length > 0
    ? (rows[0] as { clinic_name: string }).clinic_name
    : '藥斗子診所';

  return NextResponse.json({ clinicName });
}

// PUT /api/clinic-settings - 更新医馆配置
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { clinicName } = await req.json() as { clinicName: string };

  if (!clinicName?.trim()) {
    return NextResponse.json({ error: '医馆名称不能为空' }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO clinic_settings (user_id, clinic_name, updated_at)
    VALUES (${userId}, ${clinicName.trim()}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      clinic_name = EXCLUDED.clinic_name,
      updated_at = NOW()
  `;

  return NextResponse.json({ success: true });
}
