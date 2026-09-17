"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Paperclip } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    control,
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
          // Give the Select a defined value from the first render — Base UI
          // warns if it flips from uncontrolled (undefined) to controlled.
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
    <form onSubmit={guardedSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="document_type">ประเภทเอกสาร</Label>
        <Controller
          name="document_type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="document_type" className="w-full">
                <SelectValue placeholder="เลือกประเภทเอกสาร">
                  {(value: string | null) =>
                    value
                      ? DOCUMENT_TYPE_LABEL[value as keyof typeof DOCUMENT_TYPE_LABEL]
                      : "เลือกประเภทเอกสาร"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENT_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.document_type && (
          <p className="text-sm text-flag-red">{errors.document_type.message}</p>
        )}
      </div>

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
          <Label htmlFor="policy_number">เลขกรมธรรม์/เลขอ้างอิง</Label>
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
