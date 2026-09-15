"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Paperclip } from "lucide-react";

import {
  drivingLicenseSchema,
  type DrivingLicenseFormValues,
  type DrivingLicenseInput,
  ACCEPTED_DOCUMENT_FILE_TYPES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "@/lib/validations/document";
import { createDrivingLicense, updateDrivingLicense } from "@/app/(app)/documents/actions";
import { createClient } from "@/lib/supabase/client";
import { uploadDocumentFile, deleteDocumentFileByUrl } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Document } from "@/types/database.types";

export function DrivingLicenseForm({ document }: { document?: Document }) {
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
  } = useForm<DrivingLicenseFormValues, unknown, DrivingLicenseInput>({
    resolver: zodResolver(drivingLicenseSchema),
    defaultValues: document
      ? {
          issue_date: document.issue_date ?? "",
          expiry_date: document.expiry_date,
          policy_number: document.policy_number ?? "",
          cost: document.cost ?? undefined,
        }
      : undefined,
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

  async function onSubmit(values: DrivingLicenseInput) {
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

    const formData = new FormData();
    formData.set("id", docId);
    formData.set("issue_date", values.issue_date ?? "");
    formData.set("expiry_date", values.expiry_date);
    formData.set("policy_number", values.policy_number ?? "");
    formData.set("cost", values.cost !== undefined ? String(values.cost) : "");
    formData.set("file_url", fileUrl ?? "");

    const result = isEdit
      ? await updateDrivingLicense(document!.id, formData)
      : await createDrivingLicense(formData);

    if (result?.error) setFormError(result.error);
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
    <form onSubmit={guardedSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="issue_date">วันที่ออก</Label>
          <Input id="issue_date" type="date" {...register("issue_date")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiry_date">วันหมดอายุ</Label>
          <Input id="expiry_date" type="date" {...register("expiry_date")} />
          {errors.expiry_date && (
            <p className="text-sm text-flag-red">{errors.expiry_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="policy_number">เลขใบขับขี่</Label>
          <Input id="policy_number" {...register("policy_number")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
          <Input
            id="cost"
            type="number"
            inputMode="numeric"
            className="font-mono"
            placeholder="0"
            {...register("cost")}
          />
          {errors.cost && <p className="text-sm text-flag-red">{errors.cost.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>ไฟล์เอกสาร</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_DOCUMENT_FILE_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip />
          {fileName ?? "แนบไฟล์ (JPG, PNG หรือ PDF)"}
        </Button>
        {fileError && <p className="text-sm text-flag-red">{fileError}</p>}
      </div>

      {formError && <p className="text-sm text-flag-red">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
      </Button>
    </form>
  );
}
