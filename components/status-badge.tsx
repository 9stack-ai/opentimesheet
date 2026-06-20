import { Badge } from "@/components/ui/badge";
import { ENTRY_STATUS_LABEL, PROJECT_STATUS_LABEL, USER_STATUS_LABEL } from "@/lib/labels";

const STYLE = {
  green: "border-green-200 bg-green-100 text-green-800",
  amber: "border-amber-200 bg-amber-100 text-amber-800",
  red: "border-red-200 bg-red-100 text-red-800",
  gray: "border-gray-200 bg-gray-100 text-gray-700",
} as const;

const ENTRY_TONE: Record<string, keyof typeof STYLE> = {
  DRAFT: "gray",
  SUBMITTED: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export function EntryStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STYLE[ENTRY_TONE[status] ?? "gray"]}>
      {ENTRY_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STYLE[status === "ACTIVE" ? "green" : "gray"]}>
      {PROJECT_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const USER_TONE: Record<string, keyof typeof STYLE> = {
  ACTIVE: "green",
  INVITED: "amber",
  DISABLED: "gray",
};

export function UserStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STYLE[USER_TONE[status] ?? "gray"]}>
      {USER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
