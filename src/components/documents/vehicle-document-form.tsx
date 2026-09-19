"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2, Paperclip } from "lucide-react";
import { cn } from "cn";

import {
  vehicleDocumentSchema,
  type VehicleDocumentFormValues,
  type VehicleDocumentInput,
  ACCEPTED_DOCUMENT_FILE_TYPES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "@/lib/validations/document";
import { DOCUMENT_TYPE_LABEL, VEHICLE_DOCUMENT_TYPES } from "@/lib/document-types";
import { createClient } from "@/lib/supabase/client";
import { uploadDocumentFile, deleteDocumentFileByUrl } from "@/lib/supabase/storage";
import { apiFetch } from "@/lib/api-client";
import { FormField, fieldInputClassName } from "@/components/redesign/form-field";
import { Button } from "@/components/redesign/button";
import type { Document } from "@/types/database.types";

export function VehicleDocumentForm({
  vehicleId,
  document,
}: {
  vehicleId: string;
  document?: Document;
}) {
  const router = useRouter();
  const isEdit = Boolean(document);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(
    document?.file_url ? "แนบไฟล์เดิมไว้แล้ว" : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  // See vehicle-form.tsx — guards against a double-click slipping past
  // isSubmitting before React has re-rendered the disabled button.
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleDocumentFormValues, unknown, VehicleDocumentInput>({
    resolver: zodResolver(vehicleDocumentSchema),
    defaultValues: document
      ? {
          document_type: document.document_type as VehicleDocumentFormValues["document_type"],
          issue_date: document.issue_date ?? "",
          expiry_date: document.expiry_date,
          policy_number: document.policy_number ?? "",
          cost: document.cost ?? undefined,
        }
      : {
          document_type: "" as VehicleDocumentFormValues["document_type"],
        },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setFileError(null);
    if (!selected) return;

    if (!ACCEPTED_DOCUMENT_FILE_TYPES.includes(selected.type)) {
      setFileError("รองรับเฉพาะไฟล์ JPG, PNG, WebP หรือ PDF");
      return;
    }
    if (selected.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setFileError("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
      return;
    }

    setFile(selected);
    setFileName(selected.name);
  }

  async function onSubmit(values: VehicleDocumentInput) {
    setFormError(null);
    const docId = document?.id ?? crypto.randomUUID();
    let fileUrl = document?.file_url ?? null;

    // Upload straight from the browser to Supabase Storage instead of
    // routing the file through the Server Action below — see vehicle-form.tsx.
    if (file) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormError("กรุณาเข้าสู่ระบบ");
        return;
      }

      try {
        fileUrl = await uploadDocumentFile(supabase, user.id, docId, file);
      } catch {
        setFormError("อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      if (document?.file_url) {
        await deleteDocumentFileByUrl(supabase, document.file_url);
      }
    }

    const payload = {
      id: docId,
      document_type: values.document_type,
      issue_date: values.issue_date,
      expiry_date: values.expiry_date,
      policy_number: values.policy_number,
      cost: values.cost,
      file_url: fileUrl,
    };

    const result = isEdit
      ? await apiFetch(`/api/vehicles/${vehicleId}/documents/${document!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await apiFetch(`/api/vehicles/${vehicleId}/documents`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    router.push(`/vehicles/${vehicleId}`);
    router.refresh();
  }

  // Guard at the raw submit event, not inside onSubmit — see vehicle-form.tsx.
  function guardedSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    void handleSubmit(onSubmit)(e).finally(() => {
      submittingRef.current = false;
    });
  }

  return (
    <form onSubmit={guardedSubmit} className="flex flex-col gap-3.5" noValidate>
      <FormField label="ประเภทเอกสาร" htmlFor="document_type" required error={errors.document_type?.message}>
        <div className="relative">
          <select
            id="document_type"
            className={cn(
              fieldInputClassName({ emphasized: true, invalid: !!errors.document_type }),
              "appearance-none pr-10",
            )}
            {...register("document_type")}
          >
            <option value="" disabled>
              เลือกประเภทเอกสาร
            </option>
            {VEHICLE_DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-muted" />
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="วันที่ออก" htmlFor="issue_date">
          <input
            id="issue_date"
            type="date"
            className={cn(fieldInputClassName(), "font-mono")}
            {...register("issue_date")}
          />
        </FormField>
        <FormField label="วันหมดอายุ" htmlFor="expiry_date" error={errors.expiry_date?.message}>
          <input
            id="expiry_date"
            type="date"
            className={cn(fieldInputClassName({ invalid: !!errors.expiry_date }), "font-mono")}
            {...register("expiry_date")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="เลขกรมธรรม์/เลขอ้างอิง" htmlFor="policy_number">
          <input id="policy_number" className={fieldInputClassName()} {...register("policy_number")} />
        </FormField>
        <FormField
          label={
            <>
              ค่าใช้จ่าย <span className="font-normal text-ink-faint">(ไม่บังคับ)</span>
            </>
          }
          htmlFor="cost"
          error={errors.cost?.message}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.75 -translate-y-1/2 text-sm font-bold text-ink-muted">
              ฿
            </span>
            <input
              id="cost"
              type="number"
              inputMode="numeric"
              placeholder="0"
              className={cn(fieldInputClassName(), "pl-8 font-mono")}
              {...register("cost")}
            />
          </div>
        </FormField>
      </div>

      <FormField label="ไฟล์เอกสาร">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_FILE_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20.5 w-full flex-col items-center justify-center gap-1 rounded-list border-[1.5px] border-dashed border-line-dash bg-surface text-center"
        >
          <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
            <Paperclip className="size-4" />
            {fileName ?? "แตะเพื่อแนบไฟล์เอกสาร"}
          </span>
          <span className="font-mono text-[11px] text-ink-faint">
            รองรับ JPG, PNG หรือ PDF · สูงสุด 10MB
          </span>
        </button>
        {fileError && <p className="mt-1.5 text-xs font-bold text-flag-overdue">{fileError}</p>}
      </FormField>

      {formError && <p className="text-sm font-bold text-flag-overdue">{formError}</p>}

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-15 shrink-0 rounded-button border border-line-strong text-sm font-extrabold text-ink"
        >
          ยกเลิก
        </button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
