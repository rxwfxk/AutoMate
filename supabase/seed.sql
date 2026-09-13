-- Default maintenance types for motorcycles.
-- Run once after 0001_init_schema.sql. Safe to re-run (on conflict do nothing).
--
-- default_interval_km / default_interval_months: null means "not tracked by
-- that dimension" — e.g. battery is time-based only, brake pads are
-- distance-based only, engine oil is tracked by both (whichever comes first).

insert into public.maintenance_types (name, default_interval_km, default_interval_months, icon)
values
  ('เปลี่ยนน้ำมันเครื่อง', 3000, 3, 'droplet'),
  ('เปลี่ยนไส้กรองอากาศ', 9000, 12, 'wind'),
  ('เปลี่ยนผ้าเบรกหน้า', 10000, null, 'disc'),
  ('เปลี่ยนผ้าเบรกหลัง', 10000, null, 'disc'),
  ('เปลี่ยนน้ำมันเบรก', null, 12, 'droplets'),
  ('เปลี่ยนยางนอก', 15000, null, 'circle-dot'),
  ('หล่อลื่น/ปรับตั้งโซ่', 500, null, 'link'),
  ('เปลี่ยนโซ่และสเตอร์', 20000, null, 'link-2'),
  ('เปลี่ยนหัวเทียน', 8000, 12, 'zap'),
  ('เปลี่ยนแบตเตอรี่', null, 24, 'battery'),
  ('ตรวจเช็คตามระยะทั่วไป', null, 6, 'clipboard-check')
on conflict (name) do nothing;
