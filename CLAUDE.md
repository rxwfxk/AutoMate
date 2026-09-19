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
| next-themes | latest | **เลิกใช้จริงแล้ว 2026-09-18** — เคยจัดการ dark/light toggle ของธีม Pit Wall เดิม แต่หลังรีดีไซน์เป็น warm cream (ดูหัวข้อ "รีดีไซน์ UI/UX") ปุ่มสลับธีมถูกถอดออกทั้งหมดเพราะกดแล้วไม่มีผลกับหน้าที่รีดีไซน์แล้ว (แอปเป็นธีมเดียวโดยตั้งใจ) — `ThemeProvider` ใน `layout.tsx` ยังคงอยู่เฉยๆ (ไม่ผูก UI ใดๆ แล้ว) |
| Supabase | `@supabase/supabase-js` + `@supabase/ssr` | Auth, DB (Postgres), Storage |
| React Hook Form + Zod | + `@hookform/resolvers` | ฟอร์มทั้งหมด |
| Recharts | latest | กราฟใน Dashboard |
| date-fns | latest | คำนวณวันที่/รอบครบกำหนด |
| gsap | ^3.15 | **เพิ่มใหม่ 2026-09-19** — ใช้เฉพาะ `src/components/auth/lamp-auth-shell.tsx` (Draggable plugin) สำหรับแอนิเมชันดึงเชือกโคมไฟหน้า login/signup ไม่ได้ใช้ที่อื่นในแอป |

### ⚠️ ข้อควรระวังเฉพาะ Next.js 16 (ต่างจาก training data เก่า)

อ่านเพิ่มเติมที่ `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

- **`middleware.ts` → `proxy.ts`**: ชื่อไฟล์และ export function เปลี่ยนจาก `middleware` เป็น `proxy` — มีผลโดยตรงกับ **Step 3 (Authentication)**
- **Async Request APIs บังคับ**: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` ต้อง `await` เสมอ (sync access ถูกถอดออกแล้ว)
- **Turbopack เป็นค่า default** ทั้ง `next dev` และ `next build` (ไม่ต้องใส่ `--turbopack` flag)
- **Parallel routes ต้องมี `default.js`** ถ้าจะใช้ parallel routes ในอนาคต
- ก่อนเขียนโค้ด App Router ที่ไม่แน่ใจ ให้เช็ค docs ใน `node_modules/next/dist/docs/` ก่อน (ตามที่ `AGENTS.md` ระบุ)

## ธีม "Pit Wall" (F1-inspired) — ⚠️ ธีมเดิม แทนที่ด้วย warm cream แล้ว (ดูหัวข้อ "รีดีไซน์ UI/UX" ด้านล่าง)

**สถานะปัจจุบัน (2026-09-18)**: ทุกหน้าในแอปใช้ธีมใหม่ "warm cream" แล้ว ธีม Pit Wall ด้านล่างนี้เหลือแค่ใน token CSS เดิม (ยังไม่ลบทิ้ง) ที่ใช้โดยของเก่าจุดเดียวที่ยังไม่ได้แตะ: dialog ยืนยันลบ (`AlertDialog`+`Button` เดิม) — เก็บหัวข้อนี้ไว้เพื่ออธิบายว่า token เดิมพวกนี้คืออะไรถ้าไปเจอในโค้ด ไม่ใช่ธีมที่ใช้งานจริงของแอปอีกต่อไป

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

## สถาปัตยกรรม Frontend/Backend (REST API แยกชัดเจน)

**อัปเดต 2026-09-16** — ตามคำขอผู้ใช้ (นอกแผน 9-step เดิม, ทำหลัง Step 9): refactor จาก Next.js Server Actions ทั้งหมด ไปเป็น **REST API แยกชัดเจนระหว่าง frontend/backend** ภายในโปรเจกต์เดียวกัน (ไม่ได้แยกเป็นคนละ repo/คนละ deploy) เหตุผล: (1) อยากมี backend ที่ทดสอบผ่าน POSTMAN ได้จริงสำหรับงานมหาลัย (2) อยากเรียนรู้สถาปัตยกรรม REST จริงจัง — ทำทีละโมดูล 4 โมดูล ทดสอบผ่านจริงทุกโมดูลก่อนไปโมดูลถัดไป (เหมือนสไตล์ 9-step เดิม)

### โครงสร้าง 2 ชั้นชัดเจน

```
src/app/(app)/**, src/components/**   ← Frontend ล้วนๆ (React, "use client" ทั้งหมด)
src/app/api/**                        ← Backend ล้วนๆ (Next.js Route Handlers)
```

### API ทั้งหมดที่มีตอนนี้ (`src/app/api/`)

| Endpoint | Methods | หมายเหตุ |
|---|---|---|
| `/api/vehicles` | GET, POST | list/create รถ |
| `/api/vehicles/[id]` | GET, PUT, DELETE | รายละเอียด (พร้อม logs+documents nested), แก้ไข, ลบ |
| `/api/vehicles/[id]/maintenance-logs` | POST | สร้างบันทึกซ่อมบำรุง |
| `/api/vehicles/[id]/maintenance-logs/[logId]` | PUT, DELETE | แก้ไข/ลบบันทึก |
| `/api/vehicles/[id]/documents` | POST | สร้างเอกสารรถ (พ.ร.บ./ประกัน/ภาษี) |
| `/api/vehicles/[id]/documents/[docId]` | PUT, DELETE | แก้ไข/ลบเอกสารรถ |
| `/api/driving-license` | GET, POST, PUT, DELETE | ใบขับขี่ — **ไม่มี id ใน URL** เพราะมีได้แค่ 1 ต่อ user (ค้นด้วย `document_type = driving_license` + RLS) |
| `/api/maintenance-types` | GET | global lookup อ่านอย่างเดียว |
| `/api/documents` | GET | เอกสารรถทุกคันของ user (join ชื่อรถ), `vehicle_id is not null` กันใบขับขี่หลุด — เพิ่มระหว่างงานเดสก์ท็อป (Turn 4) สำหรับหน้า `/documents` รวมทุกคัน |

### Auth: Bearer token ล้วน ไม่มี cookie fallback

ทุก endpoint ต้องมี header `Authorization: Bearer <access_token>` เหมือนกันหมด **ทั้ง frontend ของแอปเองและ POSTMAN/เครื่องมือภายนอก** ใช้วิธีเดียวกันเป๊ะ — ไม่ได้พึ่ง cookie session แบบที่หน้าเว็บอื่น (login/signup) ใช้ ทำให้ `src/proxy.ts` ต้องเพิ่มข้อยกเว้น `/api` ออกจาก matcher (ไม่งั้น request ที่ไม่มี cookie จะโดน redirect ไป `/login` แทนที่จะได้ 401 JSON ที่ถูกต้อง)

**โครงสร้างพื้นฐานที่ใช้ร่วมกัน**:
- `src/lib/api/auth.ts` — `authenticateRequest()` เช็ค Bearer token แล้วคืน Supabase client ที่ผูกกับ token นั้น (RLS ยังบังคับสิทธิ์เหมือนเดิมทุกประการ ไม่ได้ใช้ service role key)
- `src/lib/api/respond.ts` — `ok()`/`fail()` ให้ response หน้าตาเดียวกันทุก route (`{error, data, msg}`)
- `src/lib/api-client.ts` (ฝั่ง frontend) — `apiFetch()` แนบ Bearer token จาก session ปัจจุบันให้อัตโนมัติทุกครั้งที่เรียก
- `src/lib/api/maintenance.ts` — `syncVehicleMileage()` ใช้ร่วมกันระหว่าง create/update maintenance log

### หน้าเว็บ (pages) เปลี่ยนจาก Server Component เป็น Client Component

เกือบทุกหน้าใน `(app)/` เปลี่ยนจาก async Server Component ที่ query Supabase ตรงๆ เป็น `"use client"` component ที่ fetch ข้อมูลผ่าน API ตอน mount (มี loading state) — แลกกับการเสีย SSR/first-paint ไปบ้าง เพื่อให้ frontend คุยกับ "backend ของตัวเอง" ผ่าน HTTP จริงๆ เท่านั้น ไม่ import โค้ดฝั่งเซิร์ฟเวอร์มาเรียกตรงๆ อีกต่อไป

### สิ่งที่**ไม่ได้แตะ** (ยังเหมือนเดิมทุกประการ)

- **Auth (login/signup/sign out)** และ **Profile** (แก้ชื่อ-นามสกุล/รูปโปรไฟล์) — ยังคุยกับ Supabase Auth ตรงๆ จาก client เหมือนเดิม เพราะเป็น auth operation ไม่ใช่การเขียนตาราง business data (เหตุผลเดียวกับที่ตัดสินใจไว้ตั้งแต่ก่อนหน้านี้)
- Database schema, RLS policies — ไม่มีการแก้ไขเลย
- การอัปโหลดไฟล์ตรงจาก browser ขึ้น Supabase Storage (จาก Step "แก้ 413 upload bug") — ยังทำแบบเดิม แค่เปลี่ยนจากส่งเข้า Server Action เป็นส่งเข้า REST API แทน

### ไฟล์ backend แบบเก่า (Server Actions) ที่ลบทิ้งแล้ว

`vehicles/actions.ts`, `vehicles/[id]/maintenance/actions.ts`, `documents/actions.ts` — ไม่มีใครเรียกใช้แล้ว ถูกแทนที่ด้วย API routes ทั้งหมด

### สถานะ

ทดสอบผ่านจริงครบทุกโมดูล (API ตรง + browser จริง + smoke test รวมทั้งแอป ไม่มี console error) **แต่ยังไม่ได้ commit/push ขึ้น GitHub** ตามคำขอผู้ใช้ — รอทดสอบเองยืนยันก่อน ถ้าจะ push ต้องเช็คให้แน่ใจว่า deploy ขึ้น Vercel แล้ว environment variable ยังครบ (ไม่ต้องเพิ่มอะไรใหม่ เพราะ API routes ใช้ `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` ตัวเดิม)

## รีดีไซน์ UI/UX "Warm Cream" (design_handoff_automate_redesign)

**เริ่ม 2026-09-17** — ตามคำขอผู้ใช้ (นอกแผน 9-step เดิม, ทำหลัง REST API refactor เสร็จ): รีดีไซน์หน้าตาทั้งหมดของแอปจากธีม "Pit Wall" (F1-inspired, มืด, เน้นวัยรุ่นทั่วไป) เป็นธีมใหม่ **"warm cream"** (พื้นครีมอบอุ่น, ตัวอักษรกลมอ่านสบาย, การ์ดมนใหญ่, ตัวเลข monospace) ตาม design mockup ที่ผู้ใช้ทำเองใน claude.ai/design แล้วส่งออกมาเป็นไฟล์ในโฟลเดอร์ `design_handoff_automate_redesign/` (`README.md` = สเปกหลักทั้งหมด: design tokens, screens, behavior; `AutoMate - Redesign.dc.html` = mockup อ้างอิงที่เขียนด้วย HTML ล้วน ไม่ใช่โค้ดให้ copy ตรงๆ) — **ไม่เปลี่ยนโครงข้อมูล ไม่เปลี่ยน business logic เปลี่ยนเฉพาะชั้นการนำเสนอเท่านั้น**

ทำทีละ step ตามลำดับที่ README แนะนำ (8 step แรก = มือถือ, ต่อมาผู้ใช้ขยาย README เพิ่มเป็น 13 step ครอบเดสก์ท็อปด้วย — ดูหัวข้อ "Turn 3/4" ด้านล่าง) ประกาศ step ก่อนเริ่มเสมอ + ขอ confirm ก่อนแก้ไฟล์เดิมทุกครั้งเหมือนกฎเดิมของโปรเจกต์ ทดสอบผ่านเบราว์เซอร์จริงทุก step ก่อนไปต่อ

### Design tokens ใหม่ (`src/app/globals.css`)

เพิ่มแบบ **additive ทั้งหมด ไม่ทับ token เดิมของ Pit Wall** (เหตุผล: ตอนเริ่ม Step 1 ยังไม่รู้ว่าจะรีดีไซน์ครบทุกหน้าได้เมื่อไหร่ ถ้าทับเลยจะพังหน้าที่ยังไม่ได้รีดีไซน์ทันที) — raw values เก็บใน `--rd-*` แล้ว map เข้า Tailwind theme ผ่าน `@theme inline`:
- **สี**: `bg-base`, `surface`, `surface-card`, `ink`/`ink-2`/`ink-3`/`ink-muted`/`ink-faint`, `line`/`line-strong`/`line-dash`, `ink-line`, `ink-deep-2`/`ink-deep-3`, `cta`(+`cta-hover`/`cta-soft`/`cta-soft-line`/`cta-ink`), สถานะ `flag-overdue`/`flag-due-soon`/`flag-ok`(+`-soft`, +`-soft-foreground`, +`-on-dark`) — ตั้งชื่อ**แยก**จาก `flag-red`/`flag-yellow`/`flag-green` เดิมของ Pit Wall เพราะสีชุดเดิมปรับไว้สำหรับพื้นมืดโดยเฉพาะ (คนละ contrast requirement กับพื้นครีม), สีกราฟ (`chart-maintenance`/`chart-documents`/`chart-bar-soft`) คงค่าเดิมจาก Step 7 ของแผนเก่า
- **ฟอนต์**: `font-nunito`/`font-ibm-plex-mono` — **ยังไม่ได้ wire ผ่าน `next/font/google` จริง** ใช้ fallback stack ธรรมดาไปก่อน (ตั้งใจ แยกสโคปออกจากงาน token ล้วนๆ)
- **Radius/shadow**: `rounded-card`/`rounded-list`/`rounded-button`/`rounded-icon`/`rounded-sheet-top`, `shadow-card`/`shadow-sheet`/`shadow-fab`
- **ระยะห่าง**: ไม่ต้องเพิ่ม token ใหม่เลย — สเกล 4px ที่ README ขอ ตรงกับ Tailwind v4's default fluid spacing scale อยู่แล้ว (`p-4.5` = 18px ใช้ได้ทันที)

### Primitive components ใหม่ (`src/components/redesign/`)

`Card` (tone `surface`/`dark`, size `main`/`list`), `StatTile`, `StatusDot`/`StatusBadge` (รียูส `FlagStatus` type จาก `@/lib/flag-status` เดิมตรงๆ — **ไม่ได้สร้าง status vocabulary ใหม่ซ้อนของเดิม**), `Button` (native `<button>` ไม่ใช่ base-ui's Button, 3 variants: `cta`/`dark`/`outline`, export `buttonVariants` ให้ใช้เป็น className บน `Link` ตามแพทเทิร์นเดิมของโปรเจกต์), `FormField`+`fieldInputClassName`, `PlaceholderImage` (โชว์รูปจริงผ่าน `next/image` ถ้ามี `src`, ไม่งั้น fallback เป็นลายทางเฉียงตาม spec)

**เพิ่มระหว่างงานเดสก์ท็อป (Turn 3/4, ดูหัวข้อด้านล่าง)**: `Chip` (filter/quick-select pill), `Toggle` (48×28 switch), `PageHeader`+`Breadcrumb` (pattern ที่ใช้ซ้ำทุกหน้าเดสก์ท็อป), `DataRow`+`DataCell` (แถวตารางแบบ flex ไม่ใช้ `<table>`, `DataCell` มี `overflow-hidden` built-in กันข้อความชนกันในคอลัมน์กว้างคงที่), `ConfirmDeleteDialog` (dialog ยืนยันลบ — ดูหัวข้อ 4b ด้านล่าง)

### สถานะ: รีดีไซน์ครบทุกหน้าในแอปแล้ว (2026-09-18)

- **หน้า/ฟอร์มที่รีดีไซน์**: Dashboard (มือถือ+เดสก์ท็อป แยก layout กันเพราะเดสก์ท็อปมีกราฟ 12 เดือน มือถือไม่มีตาม spec), หน้ารายละเอียดรถ (เปลี่ยนจาก 2 section ซ้อนกันเป็น tabs ซ่อมบำรุง/เอกสาร), ฟอร์มเพิ่ม/แก้ไข (รถ, บันทึกซ่อมบำรุง — มีกล่อง "คำนวณรอบถัดไปแบบสด" ใหม่ที่ไม่มีในโค้ดเดิม, เอกสารรถ, ใบขับขี่), หน้ารายการรถ, หน้าโปรไฟล์ (ฟอร์มชื่อ/รูป + การ์ดใบขับขี่), login/signup, Shell เดสก์ท็อป (sidebar ใหม่)
- **Sidebar มือถือ → Bottom nav** (2026-09-18, ตามคำขอผู้ใช้แยกจาก 8-step เดิม): มือถือเปลี่ยนจาก hamburger+drawer เป็น **bottom nav 4 แท็บ** ติดล่างจอ (แดชบอร์ด/รถของฉัน/เพิ่มบันทึก/โปรไฟล์ — `src/components/layout/mobile-bottom-nav.tsx`), แท็บ "เพิ่มบันทึก" เปิด **bottom sheet** (`src/components/layout/add-sheet.tsx`, รียูส `Sheet` เดิมแค่ restyle) แทนเปลี่ยนหน้า มี 4 ตัวเลือกที่ต้องเลือกรถก่อน (พาไปหน้า `/vehicles`) ยกเว้น "รถคันใหม่" ที่ไปตรงได้เลย (เพราะแอปนี้ไม่มี flow "เพิ่มบันทึกแบบไม่ระบุรถ") เดสก์ท็อปยัง sidebar เหมือนเดิม ไม่กระทบ — ปุ่มออกจากระบบ/สลับธีมที่เคยอยู่ใน sidebar ถูกย้ายไปไว้ที่หน้าโปรไฟล์แทน (จุดเดียวที่ยังเข้าถึงได้บนมือถือหลัง drawer หายไป)
- **ปุ่มสลับธีม light/dark ถูกถอดออกทั้งหมด** (2026-09-18) — เพราะดีไซน์ใหม่เป็น warm cream ธีมเดียวตามตั้งใจ (README ระบุไว้ว่า "ธีมมืดยังไม่ได้กำหนดพาเลต") ปุ่มเดิมกดแล้วไม่มีผลกับหน้าที่รีดีไซน์แล้วเลยสักหน้า (ธีม `.dark`/`.light` เดิมมีผลแค่กับ dialog ยืนยันลบที่ยังไม่ได้แตะ) — ถือเป็นการแก้บั๊ก (ปุ่มค้าง ไม่ทำงานจริง) ไม่ใช่การตัดฟีเจอร์ที่ใช้งานได้ออก
- **ลบไฟล์เก่าที่ไม่มีใครเรียกใช้แล้ว**: shadcn `input`/`label`/`select`/`avatar`/`textarea`/`flag-badge`, dashboard เก่า (`stat-tile`/`vehicle-overview-card`/`recent-activity`/`section-header`), `sign-out-button.tsx` (logic ย้ายเข้าไปเขียนตรงใน sidebar/profile แทน)

### สิ่งที่**ไม่ได้แตะ**

- ตั้งค่าการแจ้งเตือนที่ทำงานได้จริง (Step 8 เดิม/Email notification ยังข้ามอยู่ — การ์ดแจ้งเตือนใน 3e เป็น UI เปล่าๆ, ดูหัวข้อ Turn 3/4), Fuel Log (Phase 2)
- Database schema, RLS policies, business logic ทุกจุด — ไม่มีการแก้ไขเลยตลอดการรีดีไซน์ (ยกเว้นเพิ่ม function ใหม่แบบ additive เช่น `getUsageSummary`, `getTopUrgentItems` — ไม่ได้แก้ของเดิม)

> **Dialog ยืนยันลบ** (รถ/บันทึก/เอกสาร/ใบขับขี่) เคยอยู่ในหัวข้อนี้ (ยังใช้ `AlertDialog`+`Button` เดิม) — **ทำเสร็จแล้วในงานเดสก์ท็อป (Turn 3/4, ดูด้านล่าง)**

### บั๊กที่เจอระหว่างรีดีไซน์และแก้แล้ว

1. **พื้นหลังไม่เต็มจอบนเดสก์ท็อป** — หลายหน้าฟอร์ม (`vehicles/new`, `vehicles/[id]/edit`, `maintenance/new`, `maintenance/[logId]/edit`, `documents/new`, `documents/[docId]/edit`, `profile/driving-license`, `vehicles/[id]`) ใช้ pattern เดียวกันคือใส่ `bg-base` กับ `max-w-md`/`max-w-3xl` + `mx-auto` ไว้ใน div เดียวกัน ทำให้**พื้นสีครีมเองก็ถูกจำกัดความกว้างไปด้วย** ส่วนที่เหลือของจอ (นอกกล่องแคบตรงกลาง) เลยโชว์พื้นหลังธีมเก่า (มืด) โผล่มาแทน ดูเหมือนหน้าไม่เต็มจอทั้งที่จริงๆ คือบั๊ก layout — แก้โดยแยกเป็น div นอกสุด (เต็มความกว้าง มีพื้นครีม) + div ชั้นในจำกัดความกว้างเนื้อหาไว้ที่ระดับอ่านง่าย (ไม่ยืด input จนกว้างเป็นเมตร) ใช้กับทุกหน้าที่มี pattern เดียวกันรวดเดียวเพื่อความสม่ำเสมอ
2. **ช่องว่างพื้นหลังธีมเก่าใต้เนื้อหาสั้นๆ บนมือถือ** (เจอตอนเพิ่ม bottom nav) — `min-h-full` (percentage-based height) ที่ root ของ `app-shell.tsx` มีจุดอ่อนแฝงอยู่ในโครงสร้าง flex ที่ซ้อนกันหลายชั้น (body → layout wrapper → shell root → main) ทำให้ความสูงเต็มจอไม่ไหลลงมาถึงชั้นในสุดจริงๆ เมื่อ parent เป็น `display:flex` — แฝงมานานตั้งแต่มี sidebar (นอกแผน 9-step เดิม) แต่ไม่เคยเห็นเพราะทุกหน้าก่อนหน้านี้เนื้อหายาวพอจะเต็มจอเองอยู่แล้ว เพิ่งโผล่ให้เห็นชัดตอนมี bottom nav แบบ `fixed` มาทำให้สังเกตช่องว่างได้ (หน้า dashboard ที่มีรถแค่คันเดียว) — แก้โดยเปลี่ยน root ของ `app-shell.tsx` จาก `min-h-full` เป็น **`min-h-dvh`** (หน่วยอิงหน้าจอจริง ไม่ต้องพึ่ง percentage chain ของ ancestor) จุดเดียว ยืนยันด้วยการวัด `getBoundingClientRect()` จริงทุกชั้น DOM ก่อน-หลังแก้ผ่าน Playwright ไม่ใช่แค่ดูภาพหน้าจอเฉยๆ
3. **font rendering quirk เฉพาะ headless browser ที่ใช้ทดสอบ** (ไม่ใช่บั๊กจริง): ข้อความ "พ.ร.บ." บางครั้งเรนเดอร์เป็นตัวอักษรละตินเพี้ยนๆ ในภาพหน้าจอที่ถ่ายผ่าน Playwright — เช็ค `textContent`/codepoint ผ่าน DOM โดยตรงแล้วพบว่าข้อมูลจริงถูกต้อง 100% เป็นแค่ font-glyph rendering ของ headless Chromium ช่วงเวลาที่ capture ไม่ใช่บั๊กที่ user จริงจะเจอ (ข้อความไทยอื่นๆ ในหน้าเดียวกันเรนเดอร์ถูกหมด)

### Turn 3/4 — ขยายรีดีไซน์ไปเดสก์ท็อป 1440px (2026-09-18/19)

**เริ่มหลังรีดีไซน์มือถือเสร็จ** — ผู้ใช้ขยาย `README.md` เพิ่มเอง (Turn 3 = 5 หน้าเดสก์ท็อป 3a–3e, Turn 4 = เอกสารรวมทุกคัน + Dialog ยืนยันลบ + ข้อตกลงแก้สเปกบางจุดให้ตรงแอปจริง) แล้วตั้ง**กฎเข้มขึ้นกว่าเดิม**: **"ห้ามแก้ของเดิม ยกเว้นเพิ่มคลาส breakpoint (`lg:`)"** — ก่อนเขียนโค้ดทุก step ต้องไล่อ่าน component ที่มีอยู่ก่อน รายงานว่าตัวไหนใช้ซ้ำ/ตัวไหนสร้างใหม่ รอ approve ก่อนเขียนเสมอ

**เทคนิคหลักที่ใช้ซ้ำทุก step**: ห่อ JSX มือถือเดิมทั้งก้อนด้วย `lg:hidden` (ไม่แก้ตัวมันเองแม้แต่บรรทัดเดียว) แล้วเพิ่ม sibling block ใหม่ `hidden ... lg:flex` แยกต่างหากสำหรับเดสก์ท็อป — ถ้า desktop ต้องการ data ที่มือถือไม่เคย fetch (เช่น ประวัติรถทุกคันสำหรับ "สรุปการใช้งาน") ให้เพิ่ม `useEffect` ใหม่แยกจากของเดิม ไม่ไปแก้ effect เดิม

ทำตามลำดับ 13 ข้อที่ผู้ใช้ยืนยันไว้ ("ทำตามลำดับนี้ใช่มั้ย"):

1. โทเคนสี/ฟอนต์ — ทำไปแล้วตอนรีดีไซน์มือถือ
2. **Primitive เพิ่ม**: `Chip`, `Toggle` (ดูหัวข้อ primitives ด้านบน)
3. **App shell**: sidebar เพิ่ม vehicle-count badge, `PageHeader`+`Breadcrumb` ใหม่ — sidebar "force-collapse 768–1023px" **ข้ามไปตามคำแนะนำ** (ทำไม่ได้จริงถ้าไม่แก้ logic เดิม + impact ต่ำ ผู้ใช้เห็นด้วย)
4. **รายละเอียดรถ 3b** — hero การ์ดมืดแนวนอน, ตาราง `DataRow`/`DataCell` ซ่อมบำรุง/เอกสาร (chip สลับแท็บ, sort ตามความเร่งด่วน, "ดูทั้งหมด" แบบ expand ในหน้า), การ์ดงานด่วน/เอกสาร/อัปเดตเลขไมล์ทางขวา
5. **รถของฉัน 3a** — กริดการ์ด 3 คอลัมน์ (เพิ่ม `getTopUrgentItems` ใน `dashboard-data.ts` — แยกจาก `getMostUrgentItem` เดิมเพราะ logic คล้ายแต่คืนหลายรายการ ไม่แก้ของเดิม), การ์ดเทียบค่าใช้จ่ายรายคัน
6. **แดชบอร์ดเดสก์ท็อป sync สเปก** — เจอ**บั๊กจริง**: breakpoint สลับที่ `md:` (768px) ทั้งที่ควรเป็น `lg:` (1024px) ตามสเปก แก้เป็น `lg:` ทั่วทั้งไฟล์, ปรับ `StatTile` ตัวเลขเดสก์ท็อปเป็น 32px, เพิ่มลิงก์ "เพิ่มบันทึก" ที่ empty state ของกราฟ, เปลี่ยน header เป็น `PageHeader`
7. **ฟอร์มเพิ่มบันทึก 3c** — `MaintenanceLogFormDesktop` (ไฟล์ใหม่แยกจากฟอร์มมือถือ ก็อปปี้ logic submit/upload มาปรับ เพราะ layout กับ logic ผูกกันในไฟล์เดิม แยกไม่ได้โดยไม่แตะ) มี chip เลือกประเภทงานเร็ว, กล่อง "บันทึกแล้วจะเกิดอะไร" คำนวณสด (คำนวณวันครบกำหนดด้วย `addMonthsClamped` ให้ตรงกับ trigger `set_maintenance_next_due` ของ Postgres เป๊ะ ไม่ใช่ naive date math), กล่อง "ครั้งล่าสุดของงานนี้"
8. **เอกสารรวมทุกคัน `/documents`** — รวบเข้ากับข้อ 11 เดิมทำทีเดียว (เพราะ 3d ในสเปก Turn 3 คือหน้ารวมทุกคัน ต้องมี API ใหม่ก่อนถึงจะทำได้ ส่วนมือถือ "หน้า 4" per-vehicle เดิมตรงสเปกอยู่แล้วไม่ต้องแก้): เพิ่ม `GET /api/documents`, หน้า `/documents` ใหม่ (มือถือ 4a + เดสก์ท็อป 3d ในไฟล์เดียว, ไม่มีแถบใบขับขี่ตาม Turn 4, มีแถวสรุป "ค่าเอกสารรวมทั้งปี"), เพิ่มเมนู "เอกสาร" ใน sidebar (จุดเตือนสีส้มถ้ามีฉบับ 🟡/🔴) และขยาย bottom nav มือถือเป็น **5 แท็บ**
9. **โปรไฟล์ 3e** — การ์ดบัญชี (reuse `ProfileForm` เดิม), ปุ่ม "เปลี่ยนรหัสผ่าน" ทำงานจริง (`resetPasswordForEmail`), การ์ดการแจ้งเตือน **เป็น UI เปล่าล้วนๆ ตามที่ Turn 4 สั่ง** (toggle/chip ทั้งหมด `disabled` + ป้าย "เร็วๆ นี้" ไม่มี state/backend ใดๆ ผูกเลย รอ Step แยกในอนาคตดูข้อ 13), การ์ดสรุปการใช้งาน (เพิ่ม `getUsageSummary` ใน `dashboard-data.ts` — นิยาม "ตรงเวลา" เอง เพราะ spec ไม่ได้กำหนดไว้: เทียบวันที่ทำจริงกับ due date/mileage ของบันทึกก่อนหน้าประเภทเดียวกัน), "ข้อมูลของฉัน" — CSV export **ทำงานได้จริง** (`src/lib/export-csv.ts`, ฝั่ง client ล้วนๆ ไม่ต้องมี backend ใหม่) ส่วนปุ่ม "ลบบัญชี" ทำแค่ UI `disabled` (ยังไม่มี API ลบบัญชีจริง + ยังไม่มี dialog ยืนยันตอนนั้น)
10. **Dialog ยืนยันลบ 4b** — สร้าง `ConfirmDeleteDialog` **1 component เดียว** ปรับตัวเป็นทั้ง modal กลางจอ (เดสก์ท็อป) และ bottom sheet (มือถือ) ด้วย Tailwind breakpoint ในไฟล์เดียว (ต่างจาก step อื่นที่แยกไฟล์ เพราะไม่มีของเดิมที่ต้องรักษาไว้ — เขียนใหม่ครั้งเดียวจบ) เขียนทับ `delete-vehicle-dialog.tsx`/`delete-maintenance-log-dialog.tsx`/`delete-document-dialog.tsx` ทั้ง 3 ไฟล์ เลิกใช้ `AlertDialog` ทั้งหมด แล้ว**ลบ** `src/components/ui/alert-dialog.tsx` ทิ้ง (ไม่มีใครเรียกแล้ว) — ตัวลบรถ/ลบบันทึก**ดึงข้อมูลจริงตอนเปิด dialog** (`GET /api/vehicles/[id]`) แทนที่จะพึ่งข้อมูลที่หน้าเรียกมีอยู่แล้วหรือไม่ ทำให้ `vehicle-card.tsx` (ที่ไม่เคยมี logs/documents เลย) ก็โชว์ตัวเลขจริงได้โดยไม่ต้องแก้ prop ที่หน้าเรียกเลย และคำนวณ "ผลต่อธง" ของการลบบันทึกจริง (เทียบกับบันทึกก่อนหน้าประเภทเดียวกัน — โชว์เฉพาะมือถือตามสเปก)
11. หน้า `/documents` รวมทุกคัน — ทำไปแล้วในข้อ 8
12. **หน้าที่ยังไม่ได้ออกแบบ** (login, ฟอร์มรถ, ฟอร์มเอกสาร, ประวัติเต็ม, ธีมมืด) — ตรวจแล้วส่วนใหญ่ไม่ต้องทำอะไร: login/signup หน้าตาดีอยู่แล้วทั้งสอง breakpoint (auth page แบบการ์ดจัดกลางเหมาะสมอยู่แล้ว ไม่บังคับต้อง 2 คอลัมน์), ประวัติเต็ม/โปรไฟล์ ทำไปแล้วในข้อก่อนๆ, ธีมมืด/Fuel Log อยู่นอกสโคป MVP — เหลือแค่ **ฟอร์มเพิ่ม/แก้ไขรถ, เอกสารรถ, ใบขับขี่** (5 หน้า) ที่เป็นฟอร์มคอลัมน์เดียวจัดกลางแคบๆ บนจอกว้าง ให้ผู้ใช้เลือกระหว่าง (ก) ขยายกว้างขึ้น+เพิ่ม `PageHeader` เฉยๆ กับ (ข) ทำ 2 คอลัมน์แบบ step 7 (ฟอร์ม+live preview) — **เลือก (ก)** เพราะฟอร์มพวกนี้ไม่มีค่าคำนวณสดที่มีความหมายพอจะคุ้ม 2 คอลัมน์ (ต่างจากฟอร์มซ่อมบำรุง) จึงแค่ห่อ `lg:hidden` + เพิ่ม block เดสก์ท็อปกว้างขึ้น (`max-w-2xl`) reuse ฟอร์ม component เดิมตัวเดียวกันเป๊ะ ไม่มีการสร้างฟอร์มซ้ำ
13. **แยกงานในอนาคต** — ผูกค่าเตือนล่วงหน้าจาก `notification_settings` เข้ากับ `flag-status.ts` จริง แล้วเปิดใช้การ์ดแจ้งเตือนใน 3e (ตอนนี้เป็น UI เปล่า) — รอ Step 8 เดิม (Email Notification System) ทำก่อน

**บั๊กที่เจอเพิ่มระหว่าง Turn 3/4 และแก้แล้ว**:
- **DataCell ไม่มี `overflow-hidden`** (3b) — คอลัมน์กว้างคงที่ข้อความชนกัน ("ครั้งล่าสุด" ทับ "ครบกำหนด") แก้โดยใส่ `overflow-hidden` ไว้ใน `DataCell` primitive เองเป็นค่า default
- **แดชบอร์ดสลับ breakpoint ผิดที่ `md:` แทน `lg:`** (ดูข้อ 6) — บั๊กที่หลงเหลือจากตอนสร้างแดชบอร์ดเดสก์ท็อปครั้งแรกก่อนที่ Turn 3 จะนิยาม breakpoint ทางการไว้ที่ 1024px
- **ลิสต์เอกสารมือถือโชว์ "อีก -10 วัน"** แทน "เลยกำหนดแล้ว" สำหรับฉบับที่เลยกำหนดแล้ว (`/documents` 4a) — ลืมแยกเงื่อนไข red/yellow เหมือนที่ทำถูกในเวอร์ชันเดสก์ท็อปเดียวกัน แก้โดยเช็ค `status === "red"` ก่อนแสดงข้อความคงที่แทนเลขวันติดลบ

**ทดสอบทุก step เหมือนเดิม** (QA user ชั่วคราวผ่าน Supabase Admin API + Playwright ชั่วคราว, ลบทิ้งหลังใช้ทุกครั้ง) เพิ่มเติมคือทดสอบทั้ง 1440px และ 390px ทุก step เพื่อยืนยันว่าของเดิมไม่รีเกรส ไม่ใช่แค่ของใหม่ทำงาน

### หน้า login/signup — แอนิเมชันโคมไฟดึงเชือก (2026-09-19)

ตามคำขอผู้ใช้ (นอกแผน 13 ข้อ, เป็นดีไซน์พิเศษเฉพาะหน้า auth): `src/app/(auth)/layout.tsx` เปลี่ยนจาก card เรียบๆ เป็น `LampAuthShell` (`src/components/auth/lamp-auth-shell.tsx`) — ผู้ใช้ต้อง**ลากเชือกโคมไฟ (SVG) ลงเกิน 30px** ถึงจะ toggle เปิด/ปิดไฟ ซึ่งเผยฟอร์ม login/signup จริงพร้อมกัน (fade+slide เข้า) ใช้ `gsap`+`Draggable` ควบคุมการลาก — **ฟอร์มข้างในไม่ได้แก้เลย** (`LoginForm`/`SignupForm` ยังเป็น Supabase Auth + RHF + Zod เดิมทั้งหมด เปลี่ยนแค่เปลือกนอก) สเปกอ้างอิงจากผู้ใช้เป็นธีมมืด+gold gradient แต่**ปรับสีทั้งหมดให้เป็น warm cream tokens ของแอป** (`--rd-cta` แทน gold, `--rd-base`/`--rd-surface-card` แทนพื้นมืด) ตามที่ผู้ใช้ขอให้เข้าธีมเดียวกับทั้งแอป ไม่มีเสียงคลิก (ไม่มีไฟล์เสียงในโปรเจกต์ ตัดออกจากสเปกอ้างอิง)

- **บั๊กที่เจอระหว่างทำ**: `npm install gsap` ไป prune `playwright` ทิ้งโดยไม่ตั้งใจ เพราะ **playwright ไม่เคยอยู่ใน `package.json` เลย** (ติดตั้งแบบ ad hoc ไว้ก่อนหน้านี้สำหรับสคริปต์ QA ชั่วคราวเท่านั้น นับเป็น extraneous package ที่ npm ตัดทิ้งอัตโนมัติทุกครั้งที่ `npm install` อะไรก็ตาม) — แก้ด้วย `npm install playwright --no-save` คืนกลับมาโดยไม่แตะ `package.json`/`package-lock.json` ส่วนที่ track จริง — **บทเรียน**: ถ้าจะติดตั้ง devtool ที่ไม่อยากให้อยู่ใน manifest ถาวร ต้องรู้ว่ามันจะหายไปทุกครั้งที่ติดตั้ง dependency ใหม่ตัวอื่น เช็ค `node_modules/playwright` ให้แน่ใจก่อนรันสคริปต์ QA ทุกครั้งหลัง `npm install`

### รอบตรวจโค้ดก่อน push (2026-09-19) — บั๊กที่เจอและแก้แล้ว

ตรวจ diff ทั้งหมดด้วย review หลายมุมมอง แล้วแก้ตามลำดับ (ทดสอบผ่านเบราว์เซอร์จริงทุกข้อ):
- **เลขไมล์ว่าง → 0**: `Number("")` = `0` ผ่าน validation ทำให้ล้างช่องแล้วบันทึกเลขไมล์เป็น 0 เงียบๆ — เช็ค `mileageInput.trim() === ""` ก่อน (`vehicles/[id]/page.tsx`)
- **breakpoint ของ shell**: เนื้อหาทุกหน้าสลับ mobile/desktop ที่ `lg:` (1024px) แต่ shell เคยสลับที่ `md:` (768px) ทำให้ช่วง 768–1023px ได้ sidebar เต็มทับเนื้อหาแบบมือถือ — แก้แล้วโดยทำ **layout แท็บเล็ตตาม README**: ที่ 768–1023px sidebar พักเป็นแถบไอคอน 64px (`isTablet` จาก `matchMedia` ใน `app-shell.tsx`) + เนื้อหายังเป็นบล็อกมือถือคอลัมน์เดียว — ปุ่มขยาย/ยุบยังใช้ได้: ขยายแล้ว sidebar เต็ม 256px **ลอยทับเนื้อหา** (fixed + backdrop, ไม่ดันเนื้อหา) และปิดเองเมื่อกด backdrop/เปลี่ยนหน้า/ออกจากช่วงแท็บเล็ต (state `tabletOpen` ไม่จำค่าลง localStorage), bottom nav ซ่อนตั้งแต่ `md:` (ปุ่มออกจากระบบใน `profile/page.tsx` ก็ `md:hidden` เพราะ sidebar มีให้แล้ว), ต่ำกว่า 768px = bottom nav, ตั้งแต่ 1024px = sidebar เต็ม; padding นอกสุดของทุกหน้าเป็น `lg:p-8`
- **`PUT/DELETE /api/vehicles/[id]/maintenance-logs/[logId]`** กรอง `.eq("vehicle_id", vehicleId)` ด้วย (เดิมกรองแค่ `logId` ทำให้ยิงข้ามคันแล้ว sync เลขไมล์ผิดคัน; ตอนนี้ log ที่ไม่ใช่ของคันนั้นได้ 404). route `documents/[docId]` มีรูปแบบเดียวกันแต่ไม่มี mileage sync จึงยังไม่แก้
- dashboard ตอน error/loading/ยังไม่มีรถ ย้ายเป็นธีม warm cream; `ProfileForm` ใส่ double-submit guard; dialog ลบแสดง ฿ ผ่าน `bahtValue()` (แยก `font-sans`); ยอดเอกสารรายปีใช้ `issue_date || created_at`; หน้ารายการรถเดสก์ท็อปแสดง error แทน spinner ค้าง (`detailsError` แยกจากมือถือ)
- หน้าแก้ไขบันทึกซ่อมบำรุงมี layout เดสก์ท็อปแล้ว (แบบเดียวกับฟอร์มอื่นใน Step 12)
- **refactor**: `getMostUrgentItem` เป็น wrapper ของ `getTopUrgentItems(..., 1)[0]`; สีกราฟรวมที่ `src/lib/chart-colors.ts`; `formatDueLabel()` ตัวเดียวในหน้า `/documents` (และ `daysUntil` นับจากเที่ยงคืนท้องถิ่นเหมือน `getDateFlagStatus`); AppShell ยิง `/api/documents` ครั้งเดียวแล้วส่ง `hasDocumentAlert` ให้ sidebar+bottom nav; dialog ลบรถ/ลบบันทึกรับ prop `detail` จากหน้าแม่เพื่อไม่ต้อง fetch ซ้ำ (`vehicle-card.tsx` ไม่มีข้อมูลจึงยัง fetch ตอนเปิดเหมือนเดิม)
- หมายเหตุการทดสอบ: ใน `next dev` effect ทำงานสองรอบ (StrictMode) จึงเห็น request ซ้ำ — นับ request ต้องดูบน `next build && next start`

### งานหลังรอบตรวจโค้ด (2026-09-19) — ปุ่มลบ, ยืนยันออกจากระบบ, รายการเก่าเป็น "ประวัติ"

- **ยืนยันก่อนออกจากระบบ**: `src/components/layout/sign-out-dialog.tsx` (เป็นเจ้าของ logic sign out เอง; sidebar และหน้าโปรไฟล์มือถือใช้ตัวนี้ ไม่เรียก `signOut` ตรงๆ อีก)
- **ปุ่มลบบนเดสก์ท็อป**: ลบรถ (header หน้ารายละเอียดรถ + มุมการ์ดในหน้ารายการรถ), ลบเอกสาร/ลบบันทึกซ่อมบำรุง (ถังขยะท้ายแถวตาราง + ปุ่มใน header หน้าแก้ไข), ปุ่ม "+ เพิ่มเอกสาร" ใน header หน้ารายละเอียดรถ — ปุ่มท้ายแถววางเป็น sibling ของ `<Link>` แบบ `absolute` (ห้ามซ้อนปุ่มใน `<a>` ไม่งั้นกดแล้วพาไปหน้าแก้ไขด้วย); `ConfirmDeleteDialog` รับ `triggerClassName` ที่ **แทนที่** ค่า default (เพราะ `cn` ที่ใช้เป็นแค่ตัวต่อ class ไม่ dedupe Tailwind); `DeleteVehicleDialog` ยิง event `vehicles-changed` ให้ badge จำนวนรถใน sidebar รีเฟรช
- **กติกา "รายการเก่า = ประวัติ"** (`src/lib/current-items.ts`): เมื่อบันทึกซ้ำประเภทเดิม จะนับเตือนเฉพาะรายการล่าสุดต่อ (รถ + ประเภท) — เอกสารเลือกจาก `expiry_date` มากสุด (ต่ออายุ = วันหมดอายุใหม่กว่า) เสมอกันดู `created_at`; บันทึกซ่อมเลือกจาก `service_date` มากสุด. รายการเก่ายังอยู่ในประวัติแต่ไม่ขึ้นธง/ไม่นับใน dashboard, การ์ดงานด่วน, สถานะรวมรถ, จุดเตือนเมนู "เอกสาร". ใช้ `getCurrentLogIds`/`getCurrentDocumentIds`/`currentLogs`/`currentDocuments`; ฟังก์ชันใน `dashboard-data.ts` กรองภายในเอง. UI ของรายการเก่า: จุด/ไอคอนเทา (`StatusDot status="history"`), ป้าย `HistoryTag` "ประวัติ", วันที่สีเทา (ตารางซ่อมบำรุงเดสก์ท็อปไม่ใส่ป้ายเพราะบีบชื่อ ใช้จุดเทา + ข้อความ "ประวัติ" แทน); `MaintenanceLogItem`/`DocumentItem` รับ prop `superseded`. เอกสารเรียงตามที่บันทึกล่าสุดขึ้นบน (หน้า `/documents` และหน้ารถ)
- **หน้าแก้ไขบันทึกซ่อมบำรุง** มี layout เดสก์ท็อปแล้ว; ปุ่มลบมือถืออยู่ในการ์ดรายการเหมือนเดิม
- ทดสอบด้วย Playwright + บัญชี QA ชั่วคราว 1440/390px ผ่านหมด (13/13) commit `cf59037` push แล้ว
- **ปุ่มแก้ไข/ลบ/ดูไฟล์ในแถว**: ตารางเดสก์ท็อป (ซ่อมบำรุง/เอกสารในหน้ารถ, หน้า `/documents`) และการ์ดเอกสารมือถือใน `/documents` ไม่ใช่ลิงก์ทั้งแถวอีกแล้ว — กดได้เฉพาะปุ่มท้ายแถว: คลิปหนีบ (`Paperclip`, เปิด `file_url`/`receipt_image_url` แท็บใหม่ เฉพาะที่แนบไฟล์), ดินสอ (ไปหน้าแก้ไข), ถังขยะ (dialog ลบในหน้า). คอลัมน์ท้ายแถวเป็น `DataCell width={104}` เว้นที่ให้ปุ่ม absolute; ลดความกว้างคอลัมน์ตารางซ่อมบำรุงเพื่อไม่ให้ชื่อรายการถูกบีบ
- **จุดเตือนเมนู "เอกสาร"** โหลดใหม่ทุกครั้งที่ `pathname` เปลี่ยน และเมื่อได้ event `documents-changed` (`DOCUMENTS_CHANGED_EVENT` export จาก `delete-document-dialog.tsx`, ยิงหลังลบเอกสารในหน้า)
- **`PUT/DELETE /api/vehicles/[id]/documents/[docId]`** กรอง `vehicle_id` แล้ว (ยิงผิดคัน = 404) เหมือน route บันทึกซ่อมบำรุง
- **ไอคอนการ์ดเอกสารสถานะเหลือง/แดง** ใช้สีทึบ (`bg-flag-due-soon text-ink` / `bg-flag-overdue text-surface`) เพราะพื้นการ์ดเป็นสี soft อยู่แล้ว (soft บน soft ทำให้ไอคอนกลืน)
- **layout หน้ารายละเอียดรถเดสก์ท็อป**: 2 คอลัมน์ `2fr/1fr` เฉพาะจอ ≥1440px (`min-[1440px]:`), ต่ำกว่านั้นเรียงคอลัมน์เดียว (การ์ดด้านขวาไปอยู่ใต้ตาราง) — เดิม 1.5fr/1fr ทำให้ชื่อรายการในตารางถูกบีบจนหายและ stats ใน hero ล้นที่ ~1100px (แก้ข้อสังเกตนี้แล้ว)
- **ข้อสังเกตที่ยังไม่แก้ (เดิม)**: แท็บเล็ตไม่มี bottom sheet "เพิ่มบันทึก" (bottom nav ซ่อน)
- **บทเรียนการทดสอบ**: `taskkill /IM node.exe` ฆ่า dev server ด้วย — ปิดเฉพาะ PID ของพอร์ต 3000; ถ้าสคริปต์ QA ค้างแล้วถูกฆ่า `finally` ไม่ทำงาน ต้องลบ user `@qa-test.dev` เองผ่าน Admin API

### วิธีทดสอบตลอดการรีดีไซน์

ทุก step ใช้บัญชี QA ชั่วคราวสร้างผ่าน Supabase Admin API (`email_confirm:true`) + สคริปต์ Playwright ชั่วคราว ยืนยันด้วย screenshot จริง + เช็ค `console --errors` ทุกครั้ง (ไม่ใช่แค่ตรวจโค้ด/build ผ่าน) แล้วลบข้อมูลทดสอบ/สคริปต์ทิ้งหลังใช้เสมอตามธรรมเนียมโปรเจกต์ — double-submit guard ที่แก้ไว้ตั้งแต่ Step 9 เดิม ถูกทดสอบซ้ำทุกฟอร์มที่เขียนใหม่ (ยังทำงานถูกต้อง ไม่มีการรีเกรส)

**ยังไม่ได้ commit/push งานรีดีไซน์นี้ (มือถือ + เดสก์ท็อป Turn 3/4) ขึ้น GitHub** — เหมือนกับ REST API refactor ก่อนหน้า รอผู้ใช้ทดสอบเองยืนยันก่อน

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
