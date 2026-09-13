import { z } from "zod";

const currentYear = new Date().getFullYear();

export const vehicleSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อเล่นรถ").max(100),
  brand: z.string().min(1, "กรุณากรอกยี่ห้อ").max(100),
  model: z.string().min(1, "กรุณากรอกรุ่น").max(100),
  year: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .optional()
    .refine((v) => v === undefined || (v >= 1970 && v <= currentYear + 1), {
      message: `ปีต้องอยู่ระหว่าง 1970-${currentYear + 1}`,
    }),
  license_plate: z.string().max(50).optional().or(z.literal("")),
  current_mileage: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, {
      message: "เลขไมล์ต้องเป็นตัวเลขไม่ติดลบ",
    }),
});

// `year`/`current_mileage` accept string|number (what <input type="number">
// actually gives React Hook Form) but transform to number. RHF's field
// values must match the pre-transform shape, while the submit handler
// receives the post-transform (parsed) shape — hence input vs output here.
export type VehicleFormValues = z.input<typeof vehicleSchema>;
export type VehicleInput = z.output<typeof vehicleSchema>;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
