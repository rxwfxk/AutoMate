import { z } from "zod";

export const maintenanceLogSchema = z.object({
  maintenance_type_id: z.string().min(1, "กรุณาเลือกประเภทงาน"),
  service_date: z.string().min(1, "กรุณาเลือกวันที่"),
  mileage_at_service: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, {
      message: "เลขไมล์ต้องเป็นตัวเลขไม่ติดลบ",
    }),
  cost: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .optional()
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: "ค่าใช้จ่ายต้องเป็นตัวเลขไม่ติดลบ",
    }),
  shop_name: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type MaintenanceLogFormValues = z.input<typeof maintenanceLogSchema>;
export type MaintenanceLogInput = z.output<typeof maintenanceLogSchema>;
