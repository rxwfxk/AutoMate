import Link from "next/link";
import { Pencil } from "lucide-react";

import { getDateFlagStatus } from "@/lib/flag-status";
import { DOCUMENT_TYPE_ICON, DOCUMENT_TYPE_LABEL } from "@/lib/document-types";
import { FlagBadge } from "@/components/ui/flag-badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog";
import type { Document } from "@/types/database.types";

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
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{label}</h3>
          <FlagBadge status={status} />
        </div>

        <p className="text-sm text-muted-foreground">
          หมดอายุ{" "}
          {new Date(document.expiry_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {document.policy_number ? ` · เลขที่ ${document.policy_number}` : ""}
        </p>

        {document.cost !== null && (
          <p className="text-sm">
            <span className="font-sans">฿ </span>
            <span className="font-mono">{document.cost.toLocaleString("th-TH")}</span>
          </p>
        )}

        {document.file_url && (
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ดูไฟล์เอกสาร
          </a>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={editHref}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={`แก้ไข ${label}`}
        >
          <Pencil />
        </Link>
        <DeleteDocumentDialog
          docId={document.id}
          label={label}
          deleteUrl={deleteUrl}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}
