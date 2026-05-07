// ─── API ───────────────────────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Admin Panel'

// ─── Account ───────────────────────────────────────────────────────────────
export const ACCOUNT_STATUS = {
    ACTIVE: 'active',
    BANNED: 'banned',
}

export const ACCOUNT_ROLE = {
    ADMIN: 'admin',
    USER: 'user',
}

// ─── Post ──────────────────────────────────────────────────────────────────
export const POST_STATUS = {
    FINDING: 'finding',
    ENOUGH: 'enough',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    HIDDEN: 'hidden',
}

// ─── Report ────────────────────────────────────────────────────────────────
export const REPORT_STATUS = {
    PENDING: 'pending',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
}

// ─── Donation ──────────────────────────────────────────────────────────────
export const DONATION_STATUS = {
    PENDING: 'pending',
    DONOR_CONFIRMED: 'donor_confirmed',
    DONATED: 'donated',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
}

// ─── Notification destination ──────────────────────────────────────────────
export const BROADCAST_DESTINATION = {
    ALL: 'all',
    BLOOD_TYPE: 'blood_type',
    AREA: 'area',
    USER: 'user',
}

// ─── Lookups ───────────────────────────────────────────────────────────────
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const POST_STATUS_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Đang tìm', value: POST_STATUS.FINDING },
    { label: 'Đủ người', value: POST_STATUS.ENOUGH },
    { label: 'Hoàn thành', value: POST_STATUS.COMPLETED },
    { label: 'Đã huỷ', value: POST_STATUS.CANCELLED },
    { label: 'Đã ẩn', value: POST_STATUS.HIDDEN },
]

export const REPORT_STATUS_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xử lý', value: REPORT_STATUS.PENDING },
    { label: 'Đã xử lý', value: REPORT_STATUS.RESOLVED },
    { label: 'Bác bỏ', value: REPORT_STATUS.REJECTED },
]

export const PAGE_SIZE_DEFAULT = 10