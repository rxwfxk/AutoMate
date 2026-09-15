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
- [x] **Step 5: Maintenance Log Module** — เพิ่มหน้ารายละเอียดรถ `src/app/(app)/vehicles/[id]/page.tsx` (สรุปรถ + timeline ประวัติซ่อมบำรุง). CRUD บันทึกที่ `.../[id]/maintenance/` (new, `[logId]/edit`) ผ่าน Server Actions ที่ sync `vehicles.current_mileage` ให้อัตโนมัติเมื่อบันทึกด้วยเลขไมล์สูงกว่าเดิม (ไม่มีวันลดค่าอัตโนมัติ). รูปใบเสร็จอัปโหลดขึ้น bucket ใหม่ `maintenance-receipts` (migration `0003`, RLS แบบเดียวกับ vehicle-images). สร้าง `src/lib/flag-status.ts` เป็น utility กลาง (ใช้ต่อได้ทั้ง Step 6/7) คำนวณ 🟢🟡🔴 จาก `next_due_date`/`next_due_mileage` เทียบกับวันนี้/เลขไมล์ปัจจุบัน — ค่า default: เตือน 30 วันก่อนถึงกำหนด (ตาม spec), เตือนเมื่อเหลือระยะทาง ≤10% ของ interval เดิม (ไม่มีระบุใน spec, กำหนดเองให้สมเหตุสมผลตามประเภทงาน). ทดสอบผ่าน browser จริงครบ: เพิ่ม/แก้/ลบบันทึกพร้อมรูปใบเสร็จ, mileage sync ทำงานถูกต้อง, และยืนยันธงทั้ง 3 สีขึ้นถูกสีจริงด้วยข้อมูลทดสอบที่ควบคุมเงื่อนไข
- [x] **(นอกแผน 9-step) User Profile + Sidebar Navigation** — ตามคำขอผู้ใช้ระหว่างทาง: (1) เพิ่มช่อง ชื่อ-นามสกุล ใน signup, (2) หน้า `/profile` แก้ไขชื่อได้ (`src/components/profile/profile-form.tsx`, เรียก `supabase.auth.updateUser({ data: {...} })` ตรงจาก client ไม่ผ่าน server action เพราะเป็น auth operation เหมือน login/signup), (3) เปลี่ยนจาก header เดิมเป็น **sidebar** ที่ยุบเป็น drawer บนมือถือ (`src/components/layout/app-shell.tsx` + `app-sidebar.tsx`, ใช้ shadcn `sheet`/`avatar`). หน้าแรกทักทายด้วยชื่อจริงผ่าน `src/lib/user-display.ts` (`getDisplayName` fallback: ชื่อเต็ม → email → "ผู้ใช้"). ทดสอบผ่าน browser จริงทั้ง desktop (sidebar ถาวร) และ mobile viewport 390px (hamburger → drawer → nav → ปิด drawer อัตโนมัติ), แก้ไขชื่อแล้ว sidebar อัปเดตตามภายใน ~1 วินาที (ผ่าน `router.refresh()`, ไม่ใช่บั๊ก)
  - **เพิ่มเติมตามคำขอรอบ 2**: (a) ปุ่มยุบ sidebar บนเดสก์ท็อปเหลือแถบไอคอน (Notion/Linear style) จำค่าไว้ใน `localStorage` (key `sidebar-collapsed`, อ่านหลัง mount กัน hydration mismatch — เริ่มต้นเสมอเป็น expanded ตอน SSR), มือถือไม่ยุบ (ใช้ drawer เต็มอยู่แล้ว), (b) ชื่อ+avatar อยู่ก่อนปุ่มออกจากระบบ (nav → ชื่อ/avatar → ปุ่มออกจากระบบ), (c) อัปโหลดรูปโปรไฟล์ได้ที่หน้า `/profile` — bucket ใหม่ `profile-avatars` (migration `0004`, RLS แบบเดียวกับ vehicle-images), เก็บ URL ใน `user_metadata.avatar_url` (ไม่ใช่ตารางใหม่ เหมือน first_name/last_name), แทนที่รูปเก่าจะลบไฟล์เก่าทิ้งอัตโนมัติ
  - **บั๊กที่เจอและแก้ (รอบ 3)**: sidebar เดิมใช้ `flex min-h-full` ยืดตาม**ความสูงของเนื้อหาหน้านั้นๆ** (flex stretch ตาม main content) ไม่ใช่ตามความสูงจอจริง — หน้าที่เนื้อหายาวเกิน viewport (เช่น รายการรถเยอะๆ) ทำให้ปุ่มออกจากระบบ/ชื่อไปอยู่ล่างสุดของ**เนื้อหาที่ยืดยาว**แทนที่จะอยู่ล่างสุดของ**จอที่มองเห็น** แก้โดยเปลี่ยน `<aside>` เป็น `sticky top-0 h-screen` (`app-shell.tsx`) ตัดขาดความสูงจาก main content โดยสิ้นเชิง ยึดตาม viewport ตลอดไม่ว่าหน้าจะยาวแค่ไหน — ทดสอบด้วยหน้าที่มี 20 รายการ (สูงกว่า viewport ~3 เท่า) ยืนยันว่าปุ่มออกจากระบบอยู่ในจอที่มองเห็นเสมอทั้งก่อนและหลัง scroll เนื้อหาหลัก
  - **บั๊กที่เจอและแก้ (รอบ 4)**: console error "A component that acts as a button expected a native `<button>`" ที่หน้า `/vehicles` และ maintenance log list — สาเหตุคือใช้ `<Button render={<Link .../>}>` ซึ่ง base-ui's `Button` มี `nativeButton` prop เป็น `true` โดย default (คาดหวังว่าสิ่งที่ render ออกมาต้องเป็น `<button>` จริง) แต่ `Link` render เป็น `<a>` ทำให้ขัดแย้งกัน — แก้โดยเปลี่ยนเป็น `buttonVariants({...})` เป็น className บน `<Link>` ตรงๆ แทน (`vehicle-card.tsx`, `maintenance-log-item.tsx`) ตามแพทเทิร์นเดียวกับที่ใช้ใน `vehicles/[id]/page.tsx` อยู่แล้ว — **กฎจำง่าย**: `Button` + `render` ใช้ได้เฉพาะตอน render ออกมาเป็น element ที่เป็น native `<button>` ได้จริง (เช่น อีก `Button`, หรือ `Dialog.Close`/`Dialog.Trigger` ที่เป็น semantic button) ถ้าจะ render เป็น `<a>`/`Link` ให้ใช้ `buttonVariants()` เป็น className แทนเสมอ
  - **แก้ปัญหาที่ไม่ใช่บั๊ก**: ผู้ใช้เจอเว็บเป็นพื้นขาวทั้งที่ควรเป็นดำ (theme dark ตั้งเป็น default อยู่แล้ว) — ตรวจสอบโค้ดแล้วถูกต้อง 100% (ทดสอบซ้ำในเบราว์เซอร์สะอาดได้ผลถูกต้องเสมอ) สาเหตุคือ **localStorage key `theme` ค้างค่าเก่าในเบราว์เซอร์ของผู้ใช้เอง** ไม่เกี่ยวกับโค้ด แก้ด้วยการล้าง localStorage หรือเปิด incognito — ถ้าเจออีกในอนาคต ให้เช็ค `localStorage.getItem('theme')` ก่อนสงสัยโค้ด
- [x] **Step 6: Document/Renewal Tracker** — ตาราง `documents` (Step 2) แก้ schema ใหม่ (migration `0005_documents_global_driving_license.sql`): แยก **ใบขับขี่เป็นข้อมูลส่วนกลางของผู้ใช้** (`user_id`, ไม่ผูก vehicle) ต่างจากพ.ร.บ./ประกัน/ภาษีที่ยังผูกกับ `vehicle_id` เหมือนเดิม — ใช้ CHECK constraint บังคับ XOR (`(vehicle_id set + user_id null) หรือ (user_id set + vehicle_id null)`, ผูกกับ document_type) และ partial unique index จำกัดใบขับขี่ 1 ใบต่อ user, RLS ใหม่ครอบคลุมทั้ง 2 เส้นทางความเป็นเจ้าของ. เพิ่ม bucket `document-files` (migration `0006`, รองรับ PDF ด้วยไม่ใช่แค่รูป, จำกัด 10MB). UI: section "เอกสาร" ในหน้ารายละเอียดรถ (พ.ร.บ./ประกัน/ภาษี, ฟอร์มมี dropdown เลือกประเภท) + section "ใบขับขี่" ในหน้าโปรไฟล์ (ฟอร์มเดี่ยว ไม่มี dropdown, หน้าเดียวทำหน้าที่ทั้ง create/edit เพราะมีได้แค่ 1 รายการต่อ user) ใช้ `getDateFlagStatus` จาก Step 5 คำนวณธงตามวันหมดอายุ. ทดสอบผ่าน browser จริงครบ: เพิ่มเอกสารรถ 2 ประเภทเห็นธงเหลือง/แดงถูกต้อง, เพิ่ม/แก้ไขใบขับขี่ที่โปรไฟล์, ยืนยัน RLS ป้องกัน cross-user ทั้งสองเส้นทางความเป็นเจ้าของ (vehicle-scoped และ user-scoped)
  - **บั๊กที่เจอและแก้ (รอบ 5, กระทบทุก form ที่มีเลข optional)**: ฟิลด์ตัวเลข optional (`cost`, `year`) ที่ใช้ pattern `if (values.x !== undefined) formData.set(...)` — ถ้า user ไม่กรอกค่า `formData.get()` ฝั่ง server จะได้ `null` ไม่ใช่ `undefined`, แต่ Zod schema (`z.union([...]).optional()`) รับแค่ `undefined` ไม่รับ `null` ทำให้ parse fail เงียบๆ ด้วย error "Invalid input" ที่ไม่มีความหมาย — **บั๊กนี้แฝงอยู่ตั้งแต่ Step 4/5 แล้ว** (ไม่เจอเพราะทดสอบกรอกค่าครบทุกครั้ง) แก้โดยเปลี่ยนเป็น `formData.set("x", values.x !== undefined ? String(values.x) : "")` (ส่ง empty string เสมอแทนการไม่ส่ง key เลย) ใน `vehicle-form.tsx`, `maintenance-log-form.tsx`, `vehicle-document-form.tsx`, `driving-license-form.tsx` — **บทเรียน**: ฟิลด์ optional ทุกตัวควรทดสอบทั้งกรณีกรอกและไม่กรอกเสมอ
  - **บั๊กที่เจอและแก้ (รอบ 5)**: base-ui's `Select` แจ้ง warning "changing from uncontrolled to controlled" เมื่อฟอร์มโหมดสร้างใหม่ไม่ได้กำหนดค่าเริ่มต้นให้ field ที่ผูกกับ `Select` ผ่าน `Controller` (ค่าเริ่มต้นเป็น `undefined` แล้วเปลี่ยนเป็น string ทีหลังตอนเลือก) — แก้โดยตั้ง defaultValues เป็น `""` เสมอสำหรับฟิลด์นี้ใน `maintenance-log-form.tsx` และ `vehicle-document-form.tsx` — เจอเฉพาะตอนทดสอบผ่าน `next dev` (React dev-mode warning ที่ production build ไม่แสดง) เป็นเหตุผลให้ทดสอบผ่านทั้ง dev และ prod build เป็นครั้งคราว
  - **สิ่งที่ตรวจสอบแล้วไม่ใช่บั๊ก**: เจอ console warning "hydration mismatch" พร้อม `style={{caret-color:"transparent"}}` ตอนทดสอบผ่าน Playwright ในหน้าที่ไม่เคยเรียก `.fill()` เลย — พิสูจน์แล้วว่าเป็น artifact ของ Playwright/Chromium automation (ตอน `.fill()` ถูกเรียกบนหน้าอื่นในเบราว์เซอร์เซสชันเดียวกัน ก่อนหน้านั้น) ไม่ปรากฏเลยถ้าเปิดแท็บใหม่ที่ไม่เคยถูก fill() มาก่อน ไม่ใช่บั๊กจริงที่ user ทั่วไปจะเจอ
- [x] **Step 7: Dashboard** — แทนที่ placeholder "ยินดีต้อนรับ" ที่ `(app)/page.tsx` ด้วย dashboard จริง (ยังคง onboarding card เดิมไว้เป็น empty state เมื่อยังไม่มีรถ). ส่วนประกอบ: (1) stat tiles — จำนวนรถ, รายการที่ต้องดำเนินการ (เหลือง+แดงรวมทุกคัน+ใบขับขี่), ค่าใช้จ่ายเดือนนี้ (2) การ์ดสรุปแต่ละคันแสดง**สถานะแย่ที่สุด**ของคันนั้น (worst-of maintenance+documents, ไม่ได้แจกแจงทีละรายการ — ต้องเข้าหน้ารายละเอียดรถถึงจะเห็นแยก) (3) กิจกรรมล่าสุดข้ามทุกคัน (4) กราฟค่าใช้จ่าย stacked bar (Recharts) แยกซ่อมบำรุง/เอกสาร พร้อม toggle รายเดือน(6 เดือนล่าสุด)/รายปี. Logic คำนวณล้วนอยู่ใน `src/lib/dashboard-data.ts` (pure functions, ไม่ผูก DB) แยกจาก UI. ใช้ **dataviz skill** ก่อนทำกราฟ — เลือกสี categorical 2 สี (blue `#3987e5` / orange `#d95926`) จาก reference palette ของ skill โดยตั้งใจ**ไม่ใช้สีธง teal/gold/red** (กันสับสนความหมาย status กับ category) แล้ว validate ด้วย `scripts/validate_palette.js` จริงกับพื้นหลัง carbon black `#15151e` ของแอป (ผ่านทุกเกณฑ์ CVD/contrast) แทนที่จะเดาสี. ทดสอบผ่าน browser จริง: empty state, stat tiles/flags/activity ตรงกับข้อมูลจริง, toggle เดือน/ปีทำงานถูกต้อง, hover tooltip แสดงยอดแยกประเภท+รวม, ไม่มี console error
  - **สิ่งที่ตรวจสอบแล้วไม่ใช่บั๊ก**: กราฟ Recharts บางครั้งไม่เห็นแท่ง bar ทันทีตอนโหลดหน้าแรก (เห็นแค่แกน/เส้น grid) — เป็น first-paint delay ปกติของ `ResponsiveContainer` ที่ต้องรอ ResizeObserver วัดขนาด container ก่อนถึงจะวาดกราฟได้ (ยืนยันแล้วว่า bar ขึ้นถูกต้องภายใน ~1 วินาที) ไม่ใช่บั๊กโค้ด ไม่จำเป็นต้องแก้สำหรับ MVP
  - **ปรับดีไซน์ตามคำขอผู้ใช้**: เปลี่ยนกราฟจาก 6 เป็น **12 เดือนย้อนหลัง**, แล้วขอ "หน้าใหม่ทั้งหมดให้สวยขึ้น" (คงโครงสร้าง/ข้อมูลเดิม แค่ปรับ UI) — เพิ่ม `src/components/dashboard/section-header.tsx` (icon+title ใช้ร่วมทุก section), stat tiles มีแถบสี accent ซ้าย + icon box, การ์ดรถเปลี่ยนเป็นแบบรูปด้านบน+ธงมุมขวาบน (จากเดิมแถวนอน), กิจกรรมล่าสุดมีเส้น timeline เชื่อมจุด, header banner มีลาย checkered flag จางๆ (`repeating-conic-gradient` + `currentColor`) และป้าย "PIT WALL" — **เจอบั๊ก ฿ ทับตัวเลขซ้ำอีกรอบ** ใน `expense-chart.tsx` (4 จุด) เพราะลืม apply fix เดิมจาก Step 5 ตอนเขียนโค้ดใหม่ — เตือนตัวเอง: **ทุกครั้งที่เขียน ฿ ในโค้ดใหม่ ต้องแยก `<span className="font-sans">฿ </span>` เสมอ ห้ามเขียน `฿{value}` ตรงๆ ในบริบท font-mono**
- [ ] Step 8: Email Notification System (Edge Function + Cron) — **ข้ามไปก่อนตามคำขอผู้ใช้** (2026-09-15) จะกลับมาทำทีหลัง
- [x] **Step 9: Polish & Testing** — ทดสอบผ่านบัญชี QA ที่สร้างชั่วคราวผ่าน Supabase Admin API (`email_confirm: true`, ลบทิ้งหลังใช้เสร็จตามธรรมเนียมโปรเจกต์) ด้วยสคริปต์ Playwright ชั่วคราว (ลบทิ้งแล้ว) ไล่ 3 หมวดตามแผน:
  - **Responsive**: ทุกหน้าหลัก (dashboard, vehicles list/detail, profile, ฟอร์มทั้งหมด, login/signup) ที่ 3 breakpoint (390/768/1440px) — ผ่านหมด ยกเว้น Dashboard ที่พบ overflow แนวนอนบนมือถือ/แท็บเล็ต (แก้แล้ว ดูด้านล่าง)
  - **Dark/Light mode**: ทุกหน้าที่ 2 ธีม ไม่มีจุดไหนลืมเผื่อสี — แต่พบว่า**ไม่มี UI ให้ผู้ใช้สลับธีมเลย**ทั้งที่ CSS/`next-themes` รองรับ `.light` ไว้ครบ (เพิ่มปุ่มแล้ว ดูด้านล่าง)
  - **Edge cases**: ฟิลด์ optional เว้นว่างทุกฟอร์ม, ชื่อรถยาวมาก, เลขไมล์ 0/สูงมาก, login ผิดรหัสผ่าน, ธง 🟢🟡🔴 ครบทั้ง maintenance (date+mileage) และ documents/ใบขับขี่ พร้อม worst-of บน dashboard — ผ่านหมด ยกเว้น double-submit (แก้แล้ว ดูด้านล่าง) ไม่มี console error/warning หลุดเลยตลอดการทดสอบ

  **บั๊กที่เจอและแก้**:
  1. **Dashboard overflow มือถือ/แท็บเล็ต** — [stat-tile.tsx](src/components/dashboard/stat-tile.tsx) div หลักของ stat tile ไม่มี `min-w-0` ทำให้ grid item (ใน `grid-cols-2 sm:grid-cols-3`) ไม่ยอมหดต่ำกว่าความกว้างเนื้อหาขั้นต่ำ ดันทั้งหน้าล้นขวา — เป็นปัญหา CSS Grid ที่พบบ่อย (grid item ต้องมี `min-width:0` เอง ไม่ได้มาจาก `grid-cols-N` อัตโนมัติ) แก้โดยเพิ่ม `min-w-0` เข้าไปที่ div เดียว ยืนยันด้วย Playwright ซ้ำว่า scrollWidth = clientWidth แล้วทั้ง 390px/768px
  2. **Double-submit สร้างข้อมูลซ้ำ** — ทุกฟอร์ม (vehicle, maintenance log, document, driving license) พึ่ง `disabled={isSubmitting}` ของ RHF อย่างเดียว ซึ่งไม่ทันป้องกันคลิกรัวจริง เพราะ `isSubmitting` เพิ่งเปลี่ยนหลัง validation resolver ทำงานเสร็จ (มี gap แบบ async) — ลองแก้รอบแรกด้วย `useRef` guard **ข้างใน** `onSubmit` แล้วยังพังอยู่ (พิสูจน์ด้วย browser console log จริง) เพราะ guard นั้นมาช้าเกินไป สุดท้ายย้าย guard ไปที่ **`<form onSubmit>` ตรงๆ** (เช็ค/ตั้งค่า ref ก่อนเรียก `handleSubmit()` เลย ไม่ผ่าน RHF's validation gap) ถึงจะปิดช่องโหว่ได้จริง — ทดสอบยืนยันด้วยคลิกรัว 2 ครั้งจริงผ่าน Playwright (ไม่ใช้ `force:true` เพราะนั่นคือการบายพาส `disabled` attribute ที่เมาส์จริงทำไม่ได้ ทำให้ผลทดสอบไม่สะท้อนพฤติกรรมผู้ใช้จริง) ได้ผลลัพธ์ถูกต้อง (สร้างแค่ 1 รายการ) ทั้ง 4 ฟอร์มใช้แพทเทิร์นเดียวกัน
  3. **เพิ่มปุ่มสลับธีม light/dark** — ไม่มีมาก่อนเลย เพิ่มไอคอน Sun/Moon ใน [app-sidebar.tsx](src/components/layout/app-sidebar.tsx) แถวหัว (โผล่ทั้ง desktop rail และ mobile drawer เพราะ component เดียวกัน) ใช้ `useTheme` จาก `next-themes`, guard ด้วย `mounted` state กัน hydration mismatch (แพทเทิร์นเดียวกับที่ใช้กับ sidebar-collapsed ใน Step 4)

  ยืนยันทั้งหมดด้วย `tsc --noEmit` ผ่าน และ Playwright สคริปต์ทดสอบซ้ำ (ลบทิ้งหลังใช้) ยืนยันทั้ง 3 จุดแก้ไขทำงานถูกต้องจริงในเบราว์เซอร์ ไม่ใช่แค่ตรวจโค้ด

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
- **2026-09-13**: base-ui's `Select.Value` **แสดง raw value ดิบๆ** (เช่น UUID) แทนชื่อที่อ่านได้ ถ้าไม่ส่ง children เป็น render-function `(value) => label` เข้าไปเอง — ไม่เหมือน Radix ที่ snapshot DOM ของ item ที่เลือกให้อัตโนมัติ (เจอบั๊กนี้ตอนสร้าง dropdown เลือกประเภทงานซ่อมบำรุง)
- **2026-09-13**: JetBrains Mono (font-mono) ไม่มี glyph สัญลักษณ์ ฿ ที่ถูกต้อง ทำให้ทับกับตัวเลขข้างๆ — แก้โดยแยก span สัญลักษณ์ให้เป็น font-sans (Inter) แล้วเว้นวรรคก่อนตัวเลข mono แทนที่จะชนกันเป็น string เดียว
- **2026-09-13**: เพิ่มช่อง **ชื่อ-นามสกุล** ในฟอร์มสมัครสมาชิก (`signup-form.tsx`) ตามคำขอผู้ใช้ — เก็บใน **Supabase Auth `user_metadata`** (`first_name`/`last_name` ผ่าน `signUp({ options: { data: {...} } })`) **ไม่ได้สร้างตาราง `profiles` ใหม่** เพราะเป็นแค่ข้อมูลประกอบบัญชี ไม่ใช่ business data ที่ต้อง query/join กับตารางอื่น ถ้า Step ต่อไปต้องการแสดงชื่อผู้ใช้ (เช่น ใน header หรือ Dashboard) อ่านได้จาก `user.user_metadata.first_name`/`last_name` โดยตรง ไม่ต้อง join ตาราง — ทดสอบแล้วว่า validation ภาษาไทยและการเก็บ metadata ทำงานถูกต้อง
- **2026-09-13**: เพิ่ม sidebar navigation + หน้า `/profile` ตามคำขอผู้ใช้ (ไม่ได้อยู่ใน 9-step plan เดิม) — แทนที่ top header เดิมใน `(app)/layout.tsx` ทั้งหมด ถ้าจะเพิ่มเมนูใหม่ในอนาคต (เช่น Documents ใน Step 6, Dashboard ใน Step 7) ให้แก้ที่ `NAV_ITEMS` ใน `src/components/layout/app-sidebar.tsx` จุดเดียว
- **2026-09-15**: Deploy ขึ้น production ครั้งแรก — Vercel (เชื่อม GitHub repo `rxwfxk/AutoMate`, auto-deploy ทุก push ขึ้น `master`) เท่านั้น ไม่ใช้ Vercel Marketplace integration สำหรับ Supabase (ใช้ project เดิมที่มีข้อมูลอยู่แล้ว ตั้งค่าผ่าน manual Environment Variables 2 ตัวแทน) — ต้องจำไว้ว่าถ้า Supabase project เปลี่ยน ต้องอัปเดต Environment Variables ในหน้า Vercel dashboard เองด้วย ไม่ได้ sync อัตโนมัติจาก `.env.local`
- **2026-09-15**: **บั๊กใหญ่ที่เจอหลัง deploy จริง — อัปโหลดไฟล์ผ่าน Server Action ใช้ไม่ได้บน production**: ผู้ใช้รายงานว่ากด "เพิ่มรถ" บนมือถือแล้วค้างโหลดตลอดไป (ไม่ใช่เน็ตช้า) พบว่าเซิร์ฟเวอร์ตอบ **HTTP 413** เกือบทันทีแต่แอปไม่จับ error เลย ปุ่มเลยหมุนค้างไม่มีข้อความ สาเหตุซ้อนกัน 2 ชั้น: (1) Next.js Server Actions จำกัด request body ไว้แค่ **1MB โดย default** (ไม่เคยตั้ง `serverActions.bodySizeLimit` ใน `next.config.ts`) (2) **Vercel เองมีเพดานตายตัวที่ 4.5MB สำหรับ request body ของ Serverless Function ทุกแผน (Hobby/Pro/Enterprise) แก้ผ่าน config ไม่ได้เลย** เป็น hard limit ของแพลตฟอร์ม กระทบทุกจุดอัปโหลดที่ยังผ่าน Server Action (รูปรถ, รูปใบเสร็จ, ไฟล์เอกสาร, ใบขับขี่) — ไม่เคยเจอตอน dev/test ก่อนหน้าเพราะใช้รูปตัวอย่างเล็กๆ ตลอด ไม่เคยลองไฟล์จริงจากมือถือ (2-8MB ขึ้นไปแทบทุกใบ)
  - **ทางแก้ที่เลือก (สถาปัตยกรรมถูกต้อง ไม่ใช่ patch ชั่วคราว)**: ย้ายการอัปโหลดไฟล์ทั้งหมดไปทำ**ฝั่ง client โดยตรงขึ้น Supabase Storage** (เหมือนที่ avatar ใน `profile-form.tsx` ทำอยู่แล้วตั้งแต่แรกเพราะเป็น auth operation ไม่ผ่าน Server Action) — client อัปโหลดไฟล์เองด้วย browser Supabase client (session ที่ login ไว้อยู่แล้ว) ได้ URL กลับมา แล้วส่งแค่ URL (string ธรรมดา) เข้า Server Action เพื่อบันทึกลง DB เท่านั้น ทำให้ payload ของ Server Action เหลือแค่ text fields เล็กๆ ไม่มีทางชน 4.5MB อีกต่อไป ไม่ว่าไฟล์จะใหญ่แค่ไหน (แค่ไม่เกิน limit ของ Supabase Storage bucket เอง)
  - **ผลข้างเคียงต่อสถาปัตยกรรม**: entity ID (vehicle/maintenance log/document) ที่แต่เดิม generate ด้วย `randomUUID()` ฝั่ง server ตอน insert ต้อง**ย้ายมา generate ฝั่ง client แทนด้วย `crypto.randomUUID()`** (Web Crypto API มาตรฐาน รองรับทุก browser สมัยใหม่) เพราะต้องมี ID ก่อนจะอัปโหลดไฟล์ (ใช้เป็นส่วนหนึ่งของ storage path) ก่อนที่ DB row จะถูกสร้างด้วยซ้ำ — Server Action รับ id ที่ client generate มาผ่าน FormData field `id` แทนที่จะ generate เอง (สำหรับ create), ส่วน update ยังใช้ id เดิมของ record ตามปกติ
  - **ทดสอบยืนยันจริง**: จำลองไฟล์ 5MB ทดสอบผ่าน Playwright ทั้ง local dev และ production URL จริง (`auto-mate-ruddy-psi.vercel.app`) ก่อนแก้เห็น 413 ชัดเจน หลังแก้อัปโหลดสำเร็จภายใน ~3-7 วินาทีทั้งคู่ ตรวจสอบ request log เห็น request อัปโหลดไปที่ `*.supabase.co/storage/v1/object/...` ตรงๆ ไม่ผ่าน Vercel function อีกต่อไป
  - **บทเรียนสำหรับ Step ต่อๆ ไป**: การทดสอบ upload ระหว่าง dev ต้องลองไฟล์ขนาดใหญ่จริง (ใกล้เคียง limit ที่ตั้งไว้ เช่น 4-5MB สำหรับรูป, 8-10MB สำหรับเอกสาร) ไม่ใช่แค่ไฟล์ตัวอย่างเล็กๆ เพราะ framework/platform limit บางอย่าง (Server Actions 1MB, Vercel 4.5MB) ไม่โผล่ให้เห็นเลยถ้าไฟล์ทดสอบเล็กกว่านั้นเสมอ
- **2026-09-15**: **แก้ปัญหา Server Action ช้า (~3.2 วิต่อครั้ง)** — เพิ่ม `vercel.json` ตั้ง `regions: ["sin1"]` (Singapore) เพราะ Vercel ใช้ `iad1` (Washington D.C.) เป็นค่าเริ่มต้นเสมอสำหรับโปรเจกต์ใหม่ทุกโปรเจกต์ ในขณะที่ Supabase project อยู่ Singapore ทำให้ทุก Server Action ต้องวิ่งข้ามซีกโลกไปกลับ ยิ่ง action ที่คุยกับ DB หลายรอบต่อเนื่อง (เช่น insert + sync mileage) ยิ่งทบต้น — วัดผลจริงก่อน/หลังแก้ผ่าน Playwright บน production: **3.2 วิ → 1.6-1.8 วิ** (ลดลงเกือบครึ่ง) ส่วนที่เหลือคาดว่าเป็น cold start ของ Vercel Hobby plan + ธรรมชาติของ Server Actions ที่ต้อง round-trip หลายรอบต่อ action เดียว ไม่ใช่บั๊ก — ถ้าจะลดต่ออีกต้องพิจารณาลดจำนวน sequential Supabase call ต่อ action หรืออัป Vercel plan เพื่อลด cold start ในอนาคต (ยังไม่ทำใน MVP นี้)
