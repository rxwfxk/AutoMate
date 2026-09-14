import { IdCard, Receipt, Shield, ShieldCheck, type LucideIcon } from "lucide-react";
import type { DocumentType, VehicleDocumentType } from "@/types/database.types";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  compulsory_insurance: "พ.ร.บ.",
  voluntary_insurance: "ประกันภาคสมัครใจ",
  tax: "ภาษี/ป้ายวงกลม",
  driving_license: "ใบขับขี่",
};

export const DOCUMENT_TYPE_ICON: Record<DocumentType, LucideIcon> = {
  compulsory_insurance: ShieldCheck,
  voluntary_insurance: Shield,
  tax: Receipt,
  driving_license: IdCard,
};

/** Selectable in the vehicle-scoped document form — driving_license is
 * handled separately on /profile since it belongs to the person, not any
 * one vehicle (see migration 0005). */
export const VEHICLE_DOCUMENT_TYPES: VehicleDocumentType[] = [
  "compulsory_insurance",
  "voluntary_insurance",
  "tax",
];
