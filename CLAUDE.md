@AGENTS.md

# Vehicle Maintenance Log — Project Context

โปรเจกต์เดี่ยว: เว็บแอปบันทึกและติดตามการดูแลรักษามอเตอร์ไซค์ ป้องกันการลืมเปลี่ยนถ่าย/ต่ออายุเอกสารสำคัญ

## วิธีทำงานร่วมกัน (สำคัญ — อ่านก่อนแก้โค้ด)

- ทำทีละ **Step** ตาม 9-Step Build Plan ด้านล่าง ห้ามข้ามหรือรวม step โดยไม่ถามก่อน
- ก่อนเริ่มแต่ละ step ให้ประกาศเลข step ที่กำลังทำให้ชัดเจน
- ถ้าจะแก้โค้ดที่มีอยู่แล้ว (ไม่ใช่ไฟล์ใหม่) ต้องขอ confirm จากผู้ใช้ก่อนทุกครั้ง
- อัปเดตส่วน "สถานะ Build Plan" ในไฟล์นี้ทุกครั้งที่ step เสร็จสมบูรณ์

## Tech Stack (เวอร์ชันจริงที่ติดตั้ง)

| อย่าง | เวอร์ชัน | หมายเหตุ |
|---|---|---|
| Next.js | 16.3.5 (App Router, Turbopack) | อัปเกรดจาก spec เดิม (14) ตามที่ผู้ใช้ยืนยันเพราะ 14 เก่าเกินไปแล้วในปี 2026 |
| React | 19.2.x | มาพร้อม Next 16 |
| TypeScript | ^5 | strict mode ตาม create-next-app default |
| Tailwind CSS | v4 (CSS-based `@theme`, ไม่ใช้ `tailwind.config.js`) | ธีมอยู่ใน `src/app/globals.css` |
| shadcn/ui | style `base-nova` | ตั้งค่าผ่าน `components.json`, ใช้ Lucide เป็น icon library |
| next-themes | latest | จัดการ dark/light toggle, default = dark |
| Supabase | `@supabase/supabase-js` + `@supabase/ssr` | Auth, DB (Postgres), Storage |
| React Hook Form + Zod | + `@hookform/resolvers` | ฟอร์มทั้งหมด |
| Recharts | latest | กราฟใน Dashboard |
| date-fns | latest | คำนวณวันที่/รอบครบกำหนด |

### ⚠️ ข้อควรระวังเฉพาะ Next.js 16 (ต่างจาก training data เก่า)

อ่านเพิ่มเติมที่ `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

- **`middleware.ts` → `proxy.ts`**: ชื่อไฟล์และ export function เปลี่ยนจาก `middleware` เป็น `proxy` — มีผลโดยตรงกับ **Step 3 (Authentication)**
- **Async Request APIs บังคับ**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` ต้อง `await` เสมอ (sync access ถูกถอดออกแล้ว)
- **Turbopack เป็นค่า default** ทั้ง `next dev` และ `next build` (ไม่ต้องใส่ `--turbopack` flag)
- **Parallel routes ต้องมี `default.js`** ถ้าจะใช้ parallel routes ในอนาคต
- ก่อนเขียนโค้ด App Router ที่ไม่แน่ใจ ให้เช็ค docs ใน `node_modules/next/dist/docs/` ก่อน (ตามที่ `AGENTS.md` ระบุ)

## ธีม "Pit Wall" (F1-inspired)

Dark mode คือธีมหลัก/ธรรมชาติของแอป (ไม่ใช่ light mode กลับสี) — ตั้งค่าใน `next-themes` เป็น `defaultTheme="dark"`

โครงสร้างสี CSS variables อยู่ใน `src/app/globals.css`:
- `:root` และ `.dark` = ธีมมืด (carbon black) — เหมือนกันโดยตั้งใจ เพราะ dark คือ default
- `.light` = ธีมสว่าง (ทางเลือก, toggle ได้)
- Token พิเศษสำหรับระบบธง: `--color-flag-green` (#00D2BE), `--color-flag-yellow` (#FFD700), `--color-flag-red` (#E10600) — ใช้ผ่าน Tailwind utility เช่น `bg-flag-yellow`, `text-flag-red`
- `--primary` / `--destructive` = race red `#E10600` (ใช้เป็น CTA/accent เท่านั้น ห้ามทำพื้นหลังกว้าง)

### ฟอนต์ (ตั้งค่าใน `src/app/layout.tsx` ผ่าน `next/font/google`)

| Role | Font | CSS variable |
|---|---|---|
| หัวข้อ (heading) | Titillium Web | `--font-titillium-web` → `--font-heading` |
| เนื้อหา/UI | Inter | `--font-inter` → `--font-sans` |
| ภาษาไทย (fallback ทั้ง heading/body) | Noto Sans Thai | `--font-noto-sans-thai` |
| ตัวเลข (เลขไมล์/ราคา) | JetBrains Mono | `--font-jetbrains-mono` → `--font-mono` |

ใช้ผ่าน Tailwind class: `font-heading`, `font-sans` (default), `font-mono`

## ระบบสถานะ (Flag System)

- 🟢 เขียว (`flag-green` / teal #00D2BE) = ยังไม่ถึงกำหนด
- 🟡 เหลือง (`flag-yellow` #FFD700) = ใกล้ถึงกำหนด (default: ภายใน 30 วัน, ตั้งค่าได้)
- 🔴 แดง (`flag-red` / race red #E10600) = เลยกำหนดแล้ว/หมดอายุ

ใช้กับทั้ง Maintenance Log (ตามระยะทาง กม. **หรือ** ระยะเวลา เดือน — เตือนตามเงื่อนไขไหนถึงก่อน) และ Document Tracker (ตามวันหมดอายุ)

## Database Schema แนวคิด (Supabase Postgres)

```
vehicles (id, user_id, name, brand, model, year, license_plate, current_mileage, image_url)
maintenance_types (id, name, default_interval_km, default_interval_months, icon)
maintenance_logs (id, vehicle_id, maintenance_type_id, service_date,
  mileage_at_service, cost, shop_name, receipt_image_url, next_due_mileage, next_due_date)
documents (id, vehicle_id, document_type, issue_date, expiry_date, policy_number,
  cost, file_url)
notification_settings (id, user_id, days_before_alert[], notify_via, email)
```

รายละเอียดจริง (RLS policies, TS types) จะกำหนดใน Step 2

## แจ้งเตือน

Email เท่านั้นสำหรับ MVP — Supabase Edge Function + Cron job เช็ครายวัน ผ่าน Resend API (Step 8)

## Phase 2 (ยังไม่ทำใน MVP นี้)

- Fuel Log คำนวณ กม./ลิตร แบบ full-tank-to-full-tank (ต้องมี field `is_full_tank`)
- AI OCR อ่านใบเสร็จ/เลขไมล์

---

## สถานะ 9-Step Build Plan

- [x] **Step 1: Project Scaffolding** — Next.js 16 + TS + Tailwind v4 + shadcn/ui (`base-nova`) + fonts 4 ตัว + Pit Wall theme tokens + next-themes (dark default) ติดตั้งและ verify แล้ว (`tsc --noEmit`, `next build` ผ่านทั้งคู่)
- [x] **Step 2: Database Schema** — Supabase project สร้างแล้ว (Singapore region), schema 5 ตาราง + RLS + trigger คำนวณ `next_due_*` อัตโนมัติ อยู่ใน `supabase/migrations/0001_init_schema.sql`, seed ข้อมูล maintenance types 11 รายการอยู่ใน `supabase/seed.sql`, TypeScript types เขียนมือให้ตรง schema ที่ `src/types/database.types.ts`. ทดสอบแล้ว: ตารางครบ, trigger คำนวณ next_due ถูกต้อง, RLS บล็อก cross-user access ได้จริง (verify ด้วยสคริปต์ทดสอบชั่วคราว, ลบทิ้งหลังใช้)
- [x] **Step 3: Authentication** — Email+password auth ผ่าน `@supabase/ssr`, เปิดสมัครสมาชิกอิสระ. `src/proxy.ts` + `src/lib/supabase/proxy.ts` (`updateSession`) ป้องกันทุก route ยกเว้น `/login`, `/signup`, `/auth/confirm` และ redirect กลับ `next` param หลัง login. `src/lib/supabase/client.ts`/`server.ts` = browser/server client. ฟอร์ม login/signup ใช้ React Hook Form + Zod (`src/lib/validations/auth.ts`) พร้อมแปล error code ของ Supabase เป็นไทย. `/auth/confirm/route.ts` รับลิงก์ยืนยันอีเมล. `src/app/page.tsx` เป็น authenticated placeholder ชั่วคราว (แสดงอีเมล + ปุ่มออกจากระบบ) รอ Dashboard จริงใน Step 7. ทดสอบผ่าน browser จริงด้วย Playwright: signed-out ถูก redirect ไป /login, ผิดรหัสผ่าน/อีเมลไม่ถูกต้องขึ้นข้อความไทยถูกต้อง, login → home → sign out → ถูกบล็อกอีกครั้งครบวงจร, ไม่มี console error
- [x] **Step 4: Vehicle Profile Module** — CRUD เต็มรูปแบบที่ `src/app/(app)/vehicles/` (list, `/new`, `/[id]/edit`) ผ่าน Server Actions ใน `actions.ts` (สร้าง/แก้ไข/ลบ, เช็ค auth เองทุก action ไม่พึ่ง proxy). รูปรถอัปโหลดขึ้น Supabase Storage bucket `vehicle-images` (public bucket, RLS เขียนได้เฉพาะโฟลเดอร์ `${user_id}/...` ของตัวเอง — migration `0002_vehicle_images_storage.sql`). ลบรถ = ลบรูปใน Storage ด้วย, แทนที่รูป = ลบรูปเก่าทิ้งอัตโนมัติ. จัดกลุ่มหน้า authenticated ทั้งหมดไว้ใต้ `src/app/(app)/layout.tsx` (header/nav ร่วม + sign out) — ย้าย `page.tsx` เดิมเข้ามาด้วย. ฟอร์มใช้ RHF+Zod (`src/lib/validations/vehicle.ts`, ระวัง `z.input`/`z.output` แยกกันเพราะมี `.transform()`), เลขไมล์/ปีใช้ font-mono ตามธีม. ทดสอบผ่าน browser จริงครบ: เพิ่มรถพร้อมรูป → แสดงในลิสต์ → แก้ไขเลขไมล์ → ลบ (ไฟล์ใน storage หายตามด้วย), RLS ผ่านหน้าเว็บจริง (user อื่นมองไม่เห็น, เดา URL edit โดนบล็อก 404), ไม่มี console error
- [ ] Step 5: Maintenance Log Module + auto-calculate รอบถัดไป
- [ ] Step 6: Document/Renewal Tracker + upload ไฟล์
- [ ] Step 7: Dashboard (สรุปภาพรวม + กราฟ)
- [ ] Step 8: Email Notification System (Edge Function + Cron)
- [ ] Step 9: Polish & Testing (responsive, dark mode, edge cases)

### บันทึกการตัดสินใจสำคัญ

- **2026-09-12**: ยืนยันใช้ Next.js 16 (ล่าสุด) แทน 14 ตาม spec เดิม เพราะ 14 เก่าเกินไปในปี 2026 — ทำให้ต้อง track breaking changes ของ v16 (proxy.ts, async APIs) ตลอดการพัฒนา
- **2026-09-12**: เลือก shadcn/ui preset `base-nova` (ค่า default ปัจจุบันของ shadcn CLI)
- **2026-09-12**: ยังไม่ได้ตั้งค่า Supabase project จริง (ต้องขอ URL/anon key จากผู้ใช้ใน Step 2/3)
- **2026-09-13**: Supabase project สร้างแล้ว, credentials อยู่ใน `.env.local` (ไม่ commit) — **ระวัง**: อย่าใส่ค่าจริงใน `.env.local.example` เด็ดขาด เพราะไฟล์นั้นถูก git track ไว้ (เคยเกิดเหตุการณ์นี้ระหว่างพัฒนา แก้ทันก่อน commit)
- **2026-09-13**: สถานะธง (🟢🟡🔴) **ไม่เก็บในฐานข้อมูล** ตั้งใจให้ app คำนวณจาก `next_due_date`/`next_due_mileage` ตอน query/render แทน (เก็บ derived state ที่ผูกกับ "วันนี้" ในตารางจะทำให้ข้อมูลเก่าและต้องมี cron sync เพิ่ม)
- **2026-09-13**: ตาราง `maintenance_types` เป็น global lookup อ่านได้ทุก authenticated user แต่ไม่มี policy insert/update/delete ให้ user ทั่วไป (เพิ่มประเภทงานใหม่ต้องทำผ่าน SQL Editor/migration เท่านั้นใน MVP นี้)
- **2026-09-13**: Auth method = email+password, เปิดสมัครสมาชิกอิสระ (ยืนยันกับผู้ใช้แล้ว) — ยังไม่มี Google OAuth หรือ magic link
- **2026-09-13**: Proxy (`src/proxy.ts`) ทำหน้าที่ redirect เพื่อ UX เท่านั้น **ไม่ใช่เกราะป้องกันความปลอดภัยจริง** — Next.js 16 docs เตือนว่า Server Actions ไม่ได้ผ่าน proxy matcher เสมอไป ตัว RLS (Step 2) คือสิ่งที่ป้องกันข้อมูลจริง ทุก mutation ในอนาคต (Step 4+) ต้องพึ่ง RLS ไม่ใช่ proxy
- **2026-09-13**: shadcn CLI (`base-nova` style) ไม่มีคอมโพเนนต์ `form` wrapper ให้ (add แล้วไม่สร้างไฟล์) — ฟอร์มทั้งหมดต่อ React Hook Form + Zod เข้ากับ Input/Label/Button ตรงๆ แทน
- **2026-09-13**: Supabase free-tier ส่งอีเมลได้จำกัดมาก (rate limit ต่ำ) และบล็อกโดเมนทดสอบอย่าง `@example.com` — ถ้าจะทดสอบ signup จริงด้วยอีเมลจำนวนมากในอนาคต ควรตั้งค่า Custom SMTP ใน Supabase Dashboard
- **2026-09-13**: ต้องตรวจสอบ/ตั้งค่า email template "Confirm signup" ใน Supabase Dashboard (Authentication → Email Templates) ให้ ConfirmationURL ชี้ไปที่ `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` เพื่อให้ตรงกับ `src/app/auth/confirm/route.ts` — ยังไม่ได้ verify ขั้นนี้กับอีเมลจริง (ทดสอบ signup จริงถูกจำกัดด้วย rate limit)
- **2026-09-13**: base-nova style ของ shadcn ใช้ `@base-ui/react` ไม่ใช่ Radix — `Button` **ไม่มี** prop `asChild` แบบ shadcn ทั่วไป ใช้ `render={<Link .../>}` แทน หรือใช้ `buttonVariants({...})` เป็น className บน element อื่นตรงๆ (ใช้แบบหลังเป็นหลักในโปรเจกต์นี้เพื่อความง่าย)
- **2026-09-13**: **บทเรียนสำคัญเรื่อง workflow**: ตอนเริ่ม Step 4 ขอให้ผู้ใช้รัน migration ใหม่ (storage bucket) แต่ดันเขียนโค้ดและเริ่มทดสอบต่อทันทีโดยไม่รอ user ยืนยันว่ารันเสร็จ ทำให้เทสต์แรกพังเพราะ bucket ยังไม่มี — **ต่อไปนี้ต้องรอ user ยืนยันจริงๆ ก่อนจะทดสอบ feature ที่พึ่งพา migration ที่เพิ่งขอให้รัน**
- **2026-09-13**: Supabase JS Database generic ต้องมี `Relationships` ในทุก table และ `Views`/`Functions` ที่ระดับ schema (`Record<string, never>` ถ้าไม่มี) ไม่งั้น TypeScript จะ infer เป็น `never` เงียบๆ ทุก query — ต้องเขียนให้ครบทุกครั้งที่แก้ `database.types.ts` มือ (จนกว่าจะ generate จริงผ่าน Supabase CLI)
- **2026-09-13**: Zod schema ที่มี `.transform()` (เช่น รับ string จาก `<input>` แล้วแปลงเป็น number) ต้องแยก `z.input<>` (ให้ RHF field values) กับ `z.output<>` (ให้ onSubmit) และใช้ `useForm<TFieldValues, TContext, TTransformedValues>` แบบ 3 generic ไม่งั้น type ไม่ตรงกัน
