import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { Prescription, PrescriptionItem, Herb } from '@/lib/types';

// GET /api/prescriptions - 获取当前用户所有处方
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const sql = getDb();

  const rows = await sql`
    SELECT p.id, p.name, p.notes, p.created_at,
           pi.id as item_id, pi.herb_id, pi.herb_json, pi.weight
    FROM prescriptions p
    LEFT JOIN prescription_items pi ON pi.prescription_id = p.id
    WHERE p.user_id = ${userId}
    ORDER BY p.created_at DESC, pi.id ASC
  `;

  // 聚合
  const map = new Map<string, Prescription>();
  for (const row of (rows as Array<{
    id: string; name: string; notes: string | null; created_at: string;
    item_id: number | null; herb_id: string | null; herb_json: Herb | null; weight: string | null;
  }>)) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        notes: row.notes ?? undefined,
        createdAt: row.created_at,
        items: [],
      });
    }
    if (row.item_id !== null && row.herb_json && row.weight !== null) {
      const pres = map.get(row.id)!;
      pres.items.push({
        herbId: row.herb_id!,
        herb: row.herb_json,
        weight: parseFloat(row.weight),
      } as PrescriptionItem);
    }
  }

  return NextResponse.json(Array.from(map.values()));
}

// POST /api/prescriptions - 保存一张处方
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const prescription = await req.json() as Prescription;

  const sql = getDb();

  // Upsert 处方
  await sql`
    INSERT INTO prescriptions (id, user_id, name, notes, created_at)
    VALUES (${prescription.id}, ${userId}, ${prescription.name}, ${prescription.notes ?? null}, ${prescription.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      notes = EXCLUDED.notes
  `;

  // 删除旧 items，重新插入
  await sql`DELETE FROM prescription_items WHERE prescription_id = ${prescription.id}`;
  for (const item of prescription.items) {
    await sql`
      INSERT INTO prescription_items (prescription_id, herb_id, herb_json, weight)
      VALUES (${prescription.id}, ${item.herbId}, ${JSON.stringify(item.herb)}, ${item.weight})
    `;
  }

  return NextResponse.json({ success: true });
}

// PUT /api/prescriptions?id=xxx - 更新处方备注
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });

  const { notes } = await req.json() as { notes: string };
  const sql = getDb();
  await sql`
    UPDATE prescriptions SET notes = ${notes ?? null}
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return NextResponse.json({ success: true });
}

// DELETE /api/prescriptions?id=xxx - 删除处方
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM prescriptions WHERE id = ${id} AND user_id = ${userId}`;

  return NextResponse.json({ success: true });
}
