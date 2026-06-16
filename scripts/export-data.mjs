// =============================================================================
// تصدير كل بيانات المشروع القديم إلى ملف SQL (seed_data.sql)
// -----------------------------------------------------------------------------
// يقرأ من قاعدة البيانات الحالية عبر مفتاح service_role (يتجاوز RLS) ويولّد
// أوامر INSERT جاهزة تلصقها في SQL Editor للمشروع الجديد (Mumbai).
//
// التشغيل (على جهازك حيث الشبكة مفتوحة):
//   node scripts/export-data.mjs
// يقرأ المفاتيح من .env.local تلقائياً. ينتج ملف: supabase/seed_data.sql
//
// ملاحظة: حسابات الدخول (auth.users) وكلمات السر لا تُصدَّر هنا — تُنقل عبر
// pg_dump كما في MIGRATION.md (الخطوات 4-5). هذا الملف للبيانات فقط:
// packages / profiles / subscriptions / redemptions.
// =============================================================================

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

// حمّل المتغيرات من .env.local ثم .env
config({ path: '.env.local' })
config({ path: '.env' })

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير موجودة في .env.local')
  process.exit(1)
}

const db = createClient(URL, KEY, { auth: { persistSession: false } })

// الجداول بالترتيب الصحيح حسب المفاتيح الأجنبية (FK)
const TABLES = ['packages', 'profiles', 'subscriptions', 'redemptions']

// حوّل قيمة JS إلى قيمة SQL آمنة (escaping للـ single quotes)
function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') {
    // jsonb وغيره
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(v).replace(/'/g, "''")}'`
}

function buildInserts(table, rows) {
  if (!rows.length) return `-- ${table}: لا توجد صفوف\n`
  const cols = Object.keys(rows[0])
  const lines = rows.map((r) => {
    const vals = cols.map((c) => sqlValue(r[c])).join(', ')
    return `  (${vals})`
  })
  return (
    `-- ${table}: ${rows.length} صف\n` +
    `insert into public.${table} (${cols.join(', ')}) values\n` +
    lines.join(',\n') +
    `\non conflict (id) do nothing;\n`
  )
}

async function main() {
  const parts = [
    '-- =====================================================================',
    '-- بيانات المشروع المُصدَّرة تلقائياً — الصقها في SQL Editor للمشروع الجديد',
    `-- المصدر: ${URL}`,
    `-- التاريخ: ${new Date().toISOString()}`,
    '-- ملاحظة: شغّل full_schema.sql أولاً (الجداول)، ثم انقل auth عبر pg_dump،',
    '--         ثم الصق هذا الملف.',
    '-- =====================================================================',
    '',
    'begin;',
    '',
  ]

  for (const table of TABLES) {
    const { data, error } = await db.from(table).select('*')
    if (error) {
      console.error(`❌ خطأ في قراءة ${table}:`, error.message)
      process.exit(1)
    }
    console.log(`✓ ${table}: ${data.length} صف`)
    parts.push(buildInserts(table, data), '')
  }

  parts.push('commit;', '')

  const out = 'supabase/seed_data.sql'
  writeFileSync(out, parts.join('\n'), 'utf8')
  console.log(`\n✅ تم إنشاء ${out}`)
}

main()
