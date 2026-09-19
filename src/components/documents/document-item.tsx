import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "cn";

import { getDateFlagStatus, type FlagStatus } from "@/lib/flag-status";
import { DOCUMENT_TYPE_ICON, DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import { Card } from "@/components/redesign/card";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import type { Document } from "@/types/database.types";

const ICON_BG: Record<FlagStatus, string> = {
  red: "bg-flag-overdue-soft text-flag-overdue-soft-foreground",
  yellow: "bg-flag-due-soon-soft text-flag-due-soon-soft-foreground",
  green: "bg-flag-ok-soft text-flag-ok-soft-foreground",
};

const DUE_TEXT_COLOR: Record<FlagStatus, string> = {
  red: "text-flag-overdue",
  yellow: "text-flag-due-soon",
  green: "text-ink-3",
};

export function DocumentItem({
  document,
  editHref,
  deleteUrl,
  onDeleted,
}: {
  document: Document;
  editHref: string;
  deleteUrl: string;
  onDeleted?: (docId: string) => void;
}) {
  const Icon = DOCUMENT_TYPE_ICON[document.document_type];
  const label = DOCUMENT_TYPE_LABEL[document.document_type];
  const status = getDateFlagStatus(document.expiry_date);

  return (
    <Card
      size="list"
      className={cn(
        "flex items-start gap-3.5",
        status === "yellow" && "border-[1.5px] border-flag-due-soon bg-flag-due-soon-soft",
        status === "red" && "border-[1.5px] border-flag-overdue bg-flag-overdue-soft",
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-icon", ICON_BG[status])}>
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-extrabold text-ink">{label}</h3>

        {document.policy_number && (
          <p className="mt-0.5 text-[13px] text-ink-3">เลขที่ {document.policy_number}</p>
        )}

        <p className={cn("mt-0.5 font-mono text-[13px]", DUE_TEXT_COLOR[status])}>
          หมดอายุ{" "}
          {new Date(document.expiry_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>

        {document.cost !== null && (
          <p className="mt-0.5 text-sm text-ink-3">
            <span className="font-sans">฿ </span>
            <span className="font-mono">{document.cost.toLocaleString("th-TH")}</span>
          </p>
        )}

        {document.file_url && (
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm font-bold text-cta underline-offset-4 hover:underline"
          >
            ดูไฟล์เอกสาร
          </a>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={editHref}
          aria-label={`แก้ไข ${label}`}
          className="flex size-8 items-center justify-center rounded-icon text-ink-muted hover:bg-base"
        >
          <Pencil className="size-4" />
        </Link>
        <DeleteDocumentDialog
          docId={document.id}
          label={label}
          deleteUrl={deleteUrl}
          cost={document.cost}
          hasFile={!!document.file_url}
          onDeleted={onDeleted}
        />
      </div>
    </Card>
  );
}
