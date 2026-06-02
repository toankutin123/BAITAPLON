export const ROLES = {
  ADMIN: 1,
  SELLER: 2,
  BUYER: 3,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.SELLER]: "Người bán bất động sản",
  [ROLES.BUYER]: "Người mua bất động sản",
};

export const ROLE_DESCRIPTIONS: Record<number, string> = {
  [ROLES.ADMIN]: "Quản lý toàn bộ hệ thống",
  [ROLES.SELLER]: "Đăng bán, quản lý bất động sản",
  [ROLES.BUYER]: "Tìm kiếm, phân tích bất động sản",
};

export const getRoleName = (role: number): string => {
  return ROLE_NAMES[role] || "Không xác định";
};

export const getRoleDescription = (role: number): string => {
  return ROLE_DESCRIPTIONS[role] || "";
};
