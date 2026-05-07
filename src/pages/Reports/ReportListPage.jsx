import { useState } from 'react'
import {
    Table, Card, Input, Button, Space,
    Avatar, Tag, App, Tooltip,
} from 'antd'
import {
    SearchOutlined, EyeOutlined,
    WarningOutlined, CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import reportApi from '../../api/reportApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDateTime } from '../../utils/helpers'

const STATUS_CHIPS = [
    { label: 'Tất cả', value: '', color: '#8e24aa', emoji: '📋' },
    { label: 'Chờ xử lý', value: 'pending', color: '#faad14', emoji: '⏳' },
    { label: 'Đã xử lý', value: 'resolved', color: '#52c41a', emoji: '✅' },
    { label: 'Bác bỏ', value: 'rejected', color: '#8c8c8c', emoji: '❌' },
]

export default function ReportListPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()

    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        pageSize: 10,
    })
    const [search, setSearch] = useState('')

    const { data: res, isLoading } = useQuery({
        queryKey: ['reports', filters],
        queryFn: () =>
            reportApi.getAll({
                status: filters.status || undefined,
                page: filters.page,
                pageSize: filters.pageSize,
            }),
    })

    const reports = res?.data?.items ?? []
    const total = res?.data?.totalCount ?? 0

    const { mutate: resolve, isPending: resolving } = useMutation({
        mutationFn: (id) => reportApi.resolve(id),
        onSuccess: () => {
            message.success('Đã xử lý báo cáo — bài đăng bị ẩn')
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const { mutate: reject, isPending: rejecting } = useMutation({
        mutationFn: (id) => reportApi.reject(id),
        onSuccess: () => {
            message.success('Đã bác bỏ báo cáo')
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const handleResolve = (record) => {
        modal.confirm({
            title: 'Xử lý báo cáo?',
            content: (
                <div>
                    <p>Bài đăng liên quan sẽ bị <strong>ẩn khỏi hệ thống</strong>.</p>
                    <p style={{ color: '#8c8c8c', fontSize: 13, marginTop: 8 }}>
                        Lý do báo cáo: <em>{record.reason}</em>
                    </p>
                </div>
            ),
            okText: 'Xác nhận xử lý',
            okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => resolve(record.id),
        })
    }

    const handleReject = (record) => {
        modal.confirm({
            title: 'Bác bỏ báo cáo?',
            content: 'Báo cáo này sẽ bị đánh dấu là không hợp lệ. Bài đăng sẽ không bị ảnh hưởng.',
            okText: 'Bác bỏ',
            cancelText: 'Huỷ',
            onOk: () => reject(record.id),
        })
    }

    const filtered = reports.filter((r) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            r.reporterName?.toLowerCase().includes(q) ||
            r.postPatientName?.toLowerCase().includes(q) ||
            r.reason?.toLowerCase().includes(q)
        )
    })

    const columns = [
        {
            title: 'Người báo cáo',
            key: 'reporter',
            width: 160,
            render: (_, r) => (
                <Space
                    style={{ cursor: 'pointer' }}
                    onClick={() => r.reporterAccountId && navigate(`/users/${r.reporterAccountId}`)}
                >
                    <Avatar src={r.reporterAvatar} size={32} style={{ background: '#8e24aa', flexShrink: 0 }}>
                        {r.reporterName?.[0]}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e88e5' }}>
                            {r.reporterName}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>@{r.reporterUsername}</div>
                    </div>
                </Space>
            ),
        },

        // Thêm cột người xử lý
        {
            title: 'Người xử lý',
            key: 'handler',
            width: 160,
            render: (_, r) => r.handlerName ? (
                <Space>
                    <Avatar src={r.handlerAvatar} size={28} style={{ background: '#1a1a2e', fontSize: 11 }}>
                        {r.handlerName?.[0]}
                    </Avatar>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{r.handlerName}</span>
                </Space>
            ) : (
                <span style={{ color: '#bbb', fontSize: 12 }}>—</span>
            ),
        },
        {
            title: 'Bài đăng bị báo cáo',
            key: 'post',
            width: 180,
            render: (_, r) => (
                <div
                    style={{ cursor: r.postId ? 'pointer' : 'default' }}
                    onClick={() => r.postId && navigate(`/posts/${r.postId}`)}
                >
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e88e5' }}>
                        Bệnh nhân: {r.postPatientName}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {r.postHospitalName}
                    </div>
                </div>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            width: 120,
            render: (v) => (
                <Tag color="orange" style={{ whiteSpace: 'normal', maxWidth: 160 }}>
                    {v}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            align: 'center',
            dataIndex: 'status',
            width: 80,
            render: (v) => <StatusTag type="report" status={v} />,
        },
        {
            title: 'Ngày báo cáo',
            align: 'center',
            dataIndex: 'createdAt',
            width: 120,
            render: (v) => (
                <span style={{ fontSize: 12, color: '#595959' }}>{formatDateTime(v)}</span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right',
            align: 'center',
            render: (_, r) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text" size="small"
                            icon={<EyeOutlined />}
                            style={{ color: '#1e88e5' }}
                            onClick={() => navigate(`/reports/${r.id}`)}
                        />
                    </Tooltip>

                    {r.status === 'pending' && (
                        <>
                            <Tooltip title="Xử lý — ẩn bài đăng">
                                <Button
                                    type="text" size="small"
                                    icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    onClick={() => handleResolve(r)}
                                    loading={resolving}
                                />
                            </Tooltip>
                            <Tooltip title="Bác bỏ báo cáo">
                                <Button
                                    type="text" size="small"
                                    icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                    onClick={() => handleReject(r)}
                                    loading={rejecting}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <div>
            <PageHeader
                title="Quản lý báo cáo vi phạm"
                subtitle="Xem xét và xử lý các báo cáo từ người dùng"
            />

            {/* Status chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {STATUS_CHIPS.map((chip) => {
                    const active = filters.status === chip.value
                    return (
                        <button
                            key={chip.value}
                            onClick={() => setFilters((f) => ({ ...f, status: chip.value, page: 1 }))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                border: active ? `2px solid ${chip.color}` : '2px solid transparent',
                                background: active ? `${chip.color}12` : '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                transition: 'all 0.15s', outline: 'none',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{chip.emoji}</span>
                            <span style={{
                                fontWeight: active ? 700 : 500,
                                color: active ? chip.color : '#595959',
                                fontSize: 13,
                            }}>
                                {chip.label}
                            </span>
                            {active && total > 0 && (
                                <span style={{
                                    background: chip.color, color: '#fff',
                                    borderRadius: 10, padding: '1px 8px',
                                    fontSize: 11, fontWeight: 700,
                                }}>
                                    {total}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Tìm theo người báo cáo, tên BN, lý do..."
                        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                        style={{ maxWidth: 380 }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    rowClassName={(r) => r.status === 'pending' ? 'row-pending' : ''}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} báo cáo`,
                        onChange: (page, pageSize) =>
                            setFilters((f) => ({ ...f, page, pageSize })),
                    }}
                    scroll={{ x: 900 }}
                />
            </Card>

            <style>{`
        .row-pending td { background: #fffbe6 !important; }
        .row-pending:hover td { background: #fff7cc !important; }
      `}</style>
        </div>
    )
}