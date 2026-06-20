// Vietnamese display labels for enum-like string fields. Single source of truth.

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  FREELANCER: "Cộng tác viên",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

export const ENTRY_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang chạy",
  ARCHIVED: "Lưu trữ",
};

export const USER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INVITED: "Đã mời",
  DISABLED: "Vô hiệu",
};
