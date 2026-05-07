import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ─── Date ──────────────────────────────────────────────────────────────────
export const formatDate = (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—'
export const formatDateTime = (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'
export const fromNow = (d) => d ? dayjs(d).fromNow() : '—'

// ─── Post status ───────────────────────────────────────────────────────────
export const POST_STATUS_META = {
    finding: { label: 'Đang tìm', color: 'processing' },
    enough: { label: 'Đủ người', color: 'warning' },
    completed: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã huỷ', color: 'default' },
    hidden: { label: 'Đã ẩn', color: 'error' },
}

export const getPostStatusMeta = (status) =>
    POST_STATUS_META[status] ?? { label: status, color: 'default' }

// ─── Report status ─────────────────────────────────────────────────────────
export const REPORT_STATUS_META = {
    pending: { label: 'Chờ xử lý', color: 'warning' },
    resolved: { label: 'Đã xử lý', color: 'success' },
    rejected: { label: 'Bác bỏ', color: 'error' },
}

export const getReportStatusMeta = (status) =>
    REPORT_STATUS_META[status] ?? { label: status, color: 'default' }

// ─── Donation status ───────────────────────────────────────────────────────
export const DONATION_STATUS_META = {
    pending: { label: 'Chờ hiến', color: 'processing' },
    donor_confirmed: { label: 'Đã xác nhận', color: 'warning' },
    donated: { label: 'Đã hiến', color: 'success' },
    cancelled: { label: 'Đã huỷ', color: 'default' },
    no_show: { label: 'Không đến', color: 'error' },
}

export const getDonationStatusMeta = (status) =>
    DONATION_STATUS_META[status] ?? { label: status, color: 'default' }

// ─── Account status ────────────────────────────────────────────────────────
export const getAccountStatusMeta = (status) =>
    status === 'active'
        ? { label: 'Hoạt động', color: 'success' }
        : { label: 'Đã khoá', color: 'error' }

// ─── Blood type ────────────────────────────────────────────────────────────
export const getBloodTypeColor = (bt) =>
    ['O-', 'A-', 'B-', 'AB-'].includes(bt) ? 'red' : 'volcano'

// ─── Số → rút gọn K/M ─────────────────────────────────────────────────────
export const formatNumber = (n) => {
    if (!n && n !== 0) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
}