import { z } from "zod";

const documentBaseFields = {
  issue_date: z.string().optional().or(z.literal("")),
  expiry_date: z.string().min(1, "กรุณาเลือกวันหมดอายุ"),
  policy_number: z.string().max(100).optional().or(z.literal("")),
  cost: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .optional()
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: "ค่าใช้จ่ายต้องเป็นตัวเลขไม่ติดลบ",
    }),
};

export const vehicleDocumentSchema = z.object({
  document_type: z.enum(["compulsory_insurance", "voluntary_insurance", "tax"]),
  ...documentBaseFields,
});

export type VehicleDocumentFormValues = z.input<typeof vehicleDocumentSchema>;
export type VehicleDocumentInput = z.output<typeof vehicleDocumentSchema>;

export const drivingLicenseSchema = z.object(documentBaseFields);

export type DrivingLicenseFormValues = z.input<typeof drivingLicenseSchema>;
export type DrivingLicenseInput = z.output<typeof drivingLicenseSchema>;

export const ACCEPTED_DOCUMENT_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — scanned PDFs run larger than photos
