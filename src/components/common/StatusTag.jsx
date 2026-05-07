import { Tag } from 'antd'
import {
    getPostStatusMeta,
    getReportStatusMeta,
    getDonationStatusMeta,
    getAccountStatusMeta,
} from '../../utils/helpers'

const typeMap = {
    post: getPostStatusMeta,
    report: getReportStatusMeta,
    donation: getDonationStatusMeta,
    account: getAccountStatusMeta,
}

/**
 * @param {'post'|'report'|'donation'|'account'} type
 * @param {string} status
 */
export default function StatusTag({ type, status }) {
    const getFn = typeMap[type] ?? ((s) => ({ label: s, color: 'default' }))
    const { label, color } = getFn(status)
    return <Tag color={color}>{label}</Tag>
}