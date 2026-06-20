export interface AdminUser {
  id: number;
  phone: string;
  name?: string;
  pinfl?: string;
  passportSeries?: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface UserHistoryDto {
  id: number;
  phoneNumber: string;
  fullName?: string;
  balance?: number;
  status: string;
  role?: string;
  isVerified?: boolean;
  createdAt: string;
}

export interface PolicyHistoryDto {
  id: number;
  contractId?: string;
  gosNumber: string;
  ownerName?: string;
  clientPhone?: string;
  status: string;
  amountUzs: number;
  policySery?: string;
  policyNumber?: string;
  policyFileUrl?: string;
  periodId?: number;
  limited?: boolean;
  sellerAdminName?: string;
  startDate?: string;
  createdAt: string;
}

export interface CalculationHistoryDto {
  id: number;
  gosNumber: string;
  periodId?: number;
  limited?: boolean;
  amountUzs: number;
  sqbResult?: string;
  createdAt: string;
}

export interface VehicleHistoryDto {
  gosNumber: string;
  techSery?: string;
  techNumber?: string;
  markaName?: string;
  modelName?: string;
  vehicleColor?: string;
  issueYear?: string;
  ownerName?: string;
  ownerPinfl?: string;
  fizYur?: string;
  checkCount?: number;
  lastCheckedAt: string;
}

export interface AdminHistoryDto {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface CashbackConfigDto {
  id: number;
  adminId?: number;
  adminName?: string;
  insuranceType: string;
  ratePercent: number;
  active: boolean;
  note?: string;
  createdAt: string;
}

export interface WalletDto {
  adminId: number;
  adminName: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface WalletTransactionDto {
  id: number;
  type: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  createdAt: string;
}

export interface SalesStatsDto {
  adminId?: number;
  adminName?: string;
  totalSales: number;
  totalAmountUzs: number;
  totalCashback: number;
  pendingCashback?: number;
  from?: string;
  to?: string;
}

export interface AdminSalesStatsDto {
  adminStats: SalesStatsDto[];
  totalSales: number;
  totalAmountUzs: number;
  totalCashback: number;
  pendingCashback: number;
}

export interface SaleDto {
  id: number;
  adminId: number;
  adminName?: string;
  contractId: string;
  gosNumber: string;
  clientPhone?: string;
  amountUzs: number;
  cashbackRate?: number;
  cashbackAmount?: number;
  cashbackPaid: boolean;
  createdAt: string;
}

export interface RegistrationStatusDto {
  id: number;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

export type Permission =
  | 'ADMIN_VIEW' | 'ADMIN_CREATE' | 'ADMIN_EDIT' | 'ADMIN_DELETE'
  | 'HISTORY_USERS_VIEW' | 'HISTORY_POLICIES_VIEW' | 'HISTORY_CALCS_VIEW'
  | 'HISTORY_VEHICLES_VIEW' | 'HISTORY_ADMINS_VIEW'
  | 'CASHBACK_VIEW' | 'CASHBACK_MANAGE'
  | 'WALLET_VIEW' | 'WALLET_MANAGE'
  | 'SALES_VIEW' | 'SALES_ALL_VIEW'
  | 'OSAGO_SELL'
  | 'DASHBOARD_VIEW';
