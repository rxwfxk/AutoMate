# Vehicle Maintenance Log 🏍️

เว็บแอปบันทึกและติดตามการดูแลรักษามอเตอร์ไซค์ — ป้องกันการลืมเปลี่ยนถ่ายน้ำมันเครื่อง
หรือลืมต่ออายุเอกสารสำคัญ เช่น พ.ร.บ., ประกัน, ภาษี

ธีม "Pit Wall" ได้แรงบันดาลใจจากทีมงานพิทของ F1 — ใช้ระบบธงสามสี (เขียว/เหลือง/แดง)
บอกสถานะการดูแลรักษาแต่ละรายการ

> ดูรายละเอียดสถาปัตยกรรม, ธีม, สคีมาฐานข้อมูล และ build plan ทั้งหมดได้ที่ [CLAUDE.md](./CLAUDE.md)

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Supabase (Database, Auth, Storage)
- shadcn/ui + Tailwind CSS v4 + Lucide Icons
- React Hook Form + Zod
- Recharts
- Resend API ผ่าน Supabase Edge Function

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## คำสั่งอื่นๆ

```bash
npm run build   # production build (Turbopack)
npm run start   # รัน production build
npm run lint    # ESLint
```
