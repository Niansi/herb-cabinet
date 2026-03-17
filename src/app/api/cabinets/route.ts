import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { CabinetProfile, Herb } from '@/lib/types';

// GET /api/cabinets - 获取当前用户所有药柜（含 herbs）
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const sql = getDb();

  const cabinets = await sql`
    SELECT id, name, description, rows, cols, created_at
    FROM cabinet_profiles
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `;

  const herbs = await sql`
    SELECT h.id, h.cabinet_id, h.name, h.name_traditional, h.price_per_gram,
           h.category, h.pos_row, h.pos_col, h.pos_side
    FROM herbs h
    WHERE h.user_id = ${userId}
  `;

  const profiles: CabinetProfile[] = (cabinets as Array<{
    id: string; name: string; description: string | null;
    rows: number; cols: number; created_at: string;
  }>).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    config: { rows: c.rows, cols: c.cols },
    herbs: (herbs as Array<{
      id: string; cabinet_id: string; name: string; name_traditional: string;
      price_per_gram: string; category: string | null;
      pos_row: number; pos_col: number; pos_side: 'left' | 'right';
    }>)
      .filter(h => h.cabinet_id === c.id)
      .map(h => ({
        id: h.id,
        name: h.name,
        nameTraditional: h.name_traditional,
        pricePerGram: parseFloat(h.price_per_gram),
        category: h.category ?? undefined,
        position: { row: h.pos_row, col: h.pos_col, side: h.pos_side },
      } as Herb)),
    createdAt: c.created_at,
  }));

  return NextResponse.json(profiles);
}

// POST /api/cabinets - 新建药柜
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { name, description, rows, cols } = await req.json() as {
    name: string; description?: string; rows?: number; cols?: number;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: '药柜名称不能为空' }, { status: 400 });
  }

  const sql = getDb();
  const id = `cabinet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await sql`
    INSERT INTO cabinet_profiles (id, user_id, name, description, rows, cols)
    VALUES (${id}, ${userId}, ${name.trim()}, ${description ?? null}, ${rows ?? 7}, ${cols ?? 8})
  `;

  return NextResponse.json({ id, name: name.trim(), description: description ?? null, config: { rows: rows ?? 7, cols: cols ?? 8 }, herbs: [], createdAt: new Date().toISOString() });
}

// PUT /api/cabinets - 批量保存所有药柜（含 herbs）
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const profiles = await req.json() as CabinetProfile[];

  const sql = getDb();

  for (const profile of profiles) {
    // Upsert cabinet profile
    await sql`
      INSERT INTO cabinet_profiles (id, user_id, name, description, rows, cols, created_at)
      VALUES (${profile.id}, ${userId}, ${profile.name}, ${profile.description ?? null},
              ${profile.config.rows}, ${profile.config.cols}, ${profile.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        rows = EXCLUDED.rows,
        cols = EXCLUDED.cols
    `;

    // 删除该药柜的所有旧药材，再重新插入
    await sql`DELETE FROM herbs WHERE cabinet_id = ${profile.id} AND user_id = ${userId}`;

    for (const herb of profile.herbs) {
      await sql`
        INSERT INTO herbs (id, cabinet_id, user_id, name, name_traditional, price_per_gram, category, pos_row, pos_col, pos_side)
        VALUES (
          ${herb.id}, ${profile.id}, ${userId},
          ${herb.name}, ${herb.nameTraditional}, ${herb.pricePerGram},
          ${herb.category ?? null}, ${herb.position.row}, ${herb.position.col}, ${herb.position.side}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          name_traditional = EXCLUDED.name_traditional,
          price_per_gram = EXCLUDED.price_per_gram,
          category = EXCLUDED.category,
          pos_row = EXCLUDED.pos_row,
          pos_col = EXCLUDED.pos_col,
          pos_side = EXCLUDED.pos_side
      `;
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/cabinets?id=xxx - 删除药柜
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
  await sql`DELETE FROM cabinet_profiles WHERE id = ${id} AND user_id = ${userId}`;

  return NextResponse.json({ success: true });
}
