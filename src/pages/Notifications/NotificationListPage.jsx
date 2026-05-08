import { useState } from 'react'
import { Table, Card, Button, Tag, Space, Avatar, Tooltip, Typography } from 'antd'
import { PlusOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import notificationApi from '../../api/notificationApi'
import PageHeader from '../../components/common/PageHeader'
import { formatDateTime } from '../../utils/helpers'

const { Text } = Typography

const DESTINATION_CHIPS = [
    { label: 'Tất cả', value: '', color: '#8e24aa', emoji: '📋' },
    { label: 'Tất cả người dùng', value: 'all', color: '#8e24aa', emoji: '🌐' },
    { label: 'Nhóm máu', value: 'blood_type', color: '#e53935', emoji: '🩸' },
    { label: 'Khu vực', value: 'area', color: '#1e88e5', emoji: '📍' },
    { label: 'Cá nhân', value: 'user', color: '#43a047', emoji: '👤' },
]

const DESTINATION_META = {
    all: { label: 'Tất cả người dùng', color: '#8e24aa', emoji: '🌐' },
    blood_type: { label: 'Nhóm máu', color: '#e53935', emoji: '🩸' },
    area: { label: 'Khu vực', color: '#1e88e5', emoji: '📍' },
    user: { label: 'Cá nhân', color: '#43a047', emoji: '👤' },
}

const BLOOD_COLORS = {
    'A+': '#e53935', 'A-': '#ef5350',
    'B+': '#1e88e5', 'B-': '#42a5f5',
    'AB+': '#8e24aa', 'AB-': '#ab47bc',
    'O+': '#43a047', 'O-': '#66bb6a',
}

export default function NotificationListPage() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState({ destination: '', page: 1, pageSize: 10 })

    const { data: res, isLoading } = useQuery({
        queryKey: ['broadcast-history', filters],
        queryFn: () =>
            notificationApi.getBroadcastHistory({
                destination: filters.destination || undefined,
                page: filters.page,
                pageSize: filters.pageSize,
            }),
    })

    const items = res?.data?.items ?? []
    const total = res?.data?.totalCount ?? 0

    const columns = [
        {
            title: 'Thông báo',
            key: 'noti',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 2 }}>
                        {r.title}
                    </div>
                    {r.content && (
                        <div style={{
                            fontSize: 12, color: '#8c8c8c',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: 320,
                        }}>
                            {r.content}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Đối tượng',
            key: 'destination',
            width: 220,
            render: (_, r) => {
                const meta = DESTINATION_META[r.destination] ?? { label: r.destination, color: '#8c8c8c', emoji: '📢' }
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.destination !== 'user' && (
                            <Tag style={{
                                color: meta.color, borderColor: `${meta.color}40`,
                                background: `${meta.color}10`, fontWeight: 600,
                                width: 'fit-content', marginBottom: 5,
                            }}>
                                {meta.emoji} {meta.label}
                            </Tag>
                        )}
                        {r.destination === 'blood_type' && r.bloodType && (
                            <Tag color={BLOOD_COLORS[r.bloodType] ?? 'red'}
                                style={{ fontWeight: 700, width: 'fit-content' }}>
                                {r.bloodType}
                            </Tag>
                        )}
                        {r.destination === 'area' && (
                            <Text style={{ fontSize: 12, color: '#595959' }}>
                                <EnvironmentOutlined style={{ marginRight: 4 }} />
                                {[r.ward, r.district, r.province].filter(Boolean).join(', ') || '—'}
                            </Text>
                        )}
                        {r.destination === 'user' && r.targetUserName && (
                            <Space
                                style={{ cursor: r.targetUserAccountId ? 'pointer' : 'default' }}
                                onClick={() => r.targetUserAccountId && navigate(`/users/${r.targetUserAccountId}`)}
                            >
                                <Avatar src={r.targetUserAvatar} size={35}
                                    style={{ background: '#43a047', flexShrink: 0 }}>
                                    {r.targetUserName?.[0]}
                                </Avatar>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: r.targetUserAccountId ? '#1e88e5' : '#595959' }}>
                                        {r.targetUserName}
                                    </div>
                                    {r.targetUserUsername && (
                                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>@{r.targetUserUsername}</div>
                                    )}
                                </div>
                            </Space>
                        )}
                    </div>
                )
            },
        },
        {
            title: 'Người gửi',
            key: 'sender',
            width: 220,
            render: (_, r) => (
                <Space>
                    <Avatar src={r.senderAvatar} size={32} style={{ background: '#1a1a2e', flexShrink: 0 }}>
                        {r.senderName?.[0]}
                    </Avatar>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{r.senderName}</div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                            {r.senderUsername ? `@${r.senderUsername}` : 'Admin'}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Thời gian gửi',
            dataIndex: 'createdAt',
            width: 150,
            render: (v) => <span style={{ fontSize: 12, color: '#595959' }}>{formatDateTime(v)}</span>,
        },
    ]

    return (
        <div>
            <PageHeader
                title="Quản lý thông báo"
                subtitle="Lịch sử thông báo đã gửi đến người dùng"
                extra={[
                    <Button
                        key="send"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/notifications/send')}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            border: 'none', fontWeight: 600,
                        }}
                    >
                        Gửi thông báo mới
                    </Button>,
                ]}
            />

            {/* Filter chips — giống UserList / ReportList / PostList */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {DESTINATION_CHIPS.map((chip) => {
                    const active = filters.destination === chip.value
                    return (
                        <button
                            key={chip.value}
                            onClick={() => setFilters((f) => ({ ...f, destination: chip.value, page: 1 }))}
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
                            <span style={{ fontWeight: active ? 700 : 500, color: active ? chip.color : '#595959', fontSize: 13 }}>
                                {chip.label}
                            </span>
                            {active && total > 0 && (
                                <span style={{
                                    background: chip.color, color: '#fff',
                                    borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                                }}>
                                    {total}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Table
                    columns={columns}
                    dataSource={items}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    pagination={{
                        current: filters.page,
                        pageSize: filters.pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} thông báo đã gửi`,
                        onChange: (page, pageSize) => setFilters((f) => ({ ...f, page, pageSize })),
                    }}
                    scroll={{ x: 800 }}
                    locale={{ emptyText: 'Chưa có thông báo nào được gửi' }}
                />
            </Card>
        </div>
    )
}