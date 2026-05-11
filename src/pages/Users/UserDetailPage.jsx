import { useState } from 'react'
import {
    Card, Row, Col, Avatar, Tag, Button,
    Descriptions, Space, Spin, App, Popconfirm,
    Divider, Table, Statistic, Modal, Image,
} from 'antd'
import {
    UserOutlined, ArrowLeftOutlined,
    StopOutlined, CheckCircleOutlined,
    DeleteOutlined, MailOutlined,
    PhoneOutlined, CalendarOutlined,
    HeartOutlined, EnvironmentOutlined,
    ManOutlined, WomanOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import accountApi from '../../api/accountApi'
import userApi from '../../api/userApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDate, formatDateTime, getDonationStatusMeta } from '../../utils/helpers'

const cardStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

const BLOOD_COLORS = {
    'A+': '#e53935', 'A-': '#ef5350',
    'B+': '#1e88e5', 'B-': '#42a5f5',
    'AB+': '#8e24aa', 'AB-': '#ab47bc',
    'O+': '#43a047', 'O-': '#66bb6a',
}

const DONATION_STATUS_META = {
    available: { label: 'Sẵn sàng hiến', color: '#52c41a' },
    unavailable: { label: 'Không sẵn sàng', color: '#8c8c8c' },
}

export default function UserDetailPage() {
    const { id } = useParams()   // Account.id
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()
    const [previewAvatar, setPreviewAvatar] = useState(null)

    // 1. Account info
    const { data: accRes, isLoading: l1 } = useQuery({
        queryKey: ['account', id],
        queryFn: () => accountApi.getById(id),
    })

    // 2. User profile (by accountId)
    const { data: userRes } = useQuery({
        queryKey: ['user-profile', id],
        queryFn: () => userApi.getByAccountId(id),
        enabled: !!id,
        retry: false, // Không retry nếu endpoint chưa có
    })

    // 3. Donations của user này (dùng User.id)
    const userId = userRes?.data?.id
    const { data: donationRes } = useQuery({
        queryKey: ['user-donations', userId],
        queryFn: () => userApi.getDonations(userId),
        enabled: !!userId,
        retry: false,
    })

    const account = accRes?.data ?? null
    const profile = userRes?.data ?? null
    const donations = donationRes?.data ?? []

    const donatedCount = donations.filter(
        (d) => d.status === 'donated'
    ).length

    const { mutate: updateStatus, isPending: updating } = useMutation({
        mutationFn: ({ status }) => accountApi.updateStatus(id, status),
        onSuccess: (_, { status }) => {
            message.success(status === 'banned' ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
            queryClient.invalidateQueries({ queryKey: ['account', id] })
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const handleToggleStatus = () => {
        const isBanned = account?.status === 'banned'
        modal.confirm({
            title: isBanned ? 'Mở khoá tài khoản?' : 'Khoá tài khoản?',
            content: isBanned
                ? 'Tài khoản sẽ được mở khoá và có thể đăng nhập lại.'
                : 'Tài khoản sẽ bị khoá, người dùng không thể đăng nhập.',
            okText: isBanned ? 'Mở khoá' : 'Khoá',
            okButtonProps: { danger: !isBanned },
            cancelText: 'Huỷ',
            onOk: () => updateStatus({ status: isBanned ? 'active' : 'banned' }),
        })
    }

    const donationColumns = [
        {
            title: 'Bài đăng',
            key: 'post',
            width: 100,
            onHeaderCell: () => ({ style: { paddingLeft: 16 } }),
            onCell: () => ({ style: { paddingLeft: 16 } }),
            render: (_, r) => (
                <Button
                    type="link" size="small"
                    style={{ padding: 0, fontWeight: 500 }}
                    onClick={() => navigate(`/posts/${r.postId}`)}
                >
                    Bệnh nhân {r.postPatientName}
                </Button>
            ),
        },
        {
            title: 'Lượng máu',
            dataIndex: 'bloodAmount',
            width: 100,
            align: 'center',
            render: (v) => v
                ? <span style={{ color: '#e53935', fontWeight: 600 }}>{v} ml</span>
                : '—',
        },
        {
            title: 'Giờ hẹn',
            dataIndex: 'appointmentTime',
            width: 150,
            align: 'center',
            render: (v) => <span style={{ fontSize: 12 }}>{formatDateTime(v)}</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 130,
            align: 'center',
            render: (v) => {
                const { label, color } = getDonationStatusMeta(v)
                return <Tag color={color}>{label}</Tag>
            },
        },
        {
            title: 'Đăng ký lúc',
            dataIndex: 'createdAt',
            width: 140,
            align: 'center',
            render: (v) => <span style={{ fontSize: 12 }}>{formatDateTime(v)}</span>,
        },
    ]

    if (l1) return (
        <div style={{ textAlign: 'center', padding: 120 }}><Spin size="large" /></div>
    )

    if (!account) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Không tìm thấy tài khoản</div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>Quay lại</Button>
        </div>
    )

    const isBanned = account.status === 'banned'

    return (
        <div>
            <PageHeader
                title="Chi tiết người dùng"
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
                        Quay lại
                    </Button>,
                    <Button
                        key="status"
                        icon={isBanned ? <CheckCircleOutlined /> : <StopOutlined />}
                        onClick={handleToggleStatus}
                        loading={updating}
                        style={isBanned
                            ? { borderColor: '#52c41a', color: '#52c41a' }
                            : { borderColor: '#faad14', color: '#faad14' }
                        }
                    >
                        {isBanned ? 'Mở khoá' : 'Khoá tài khoản'}
                    </Button>,
                ]}
            />

            <Row gutter={[16, 16]}>

                {/* ── Cột trái: Avatar + quick info ── */}
                <Col xs={24} lg={7}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        {/* Profile card */}
                        <Card style={cardStyle}>
                            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                                <div
                                    onClick={() => {
                                        if (account?.avatar) setPreviewAvatar(account.avatar)
                                    }}
                                    style={{
                                        cursor: account?.avatar ? 'pointer' : 'default',
                                        display: 'inline-block',
                                    }}
                                >
                                    <Avatar
                                        src={account.avatar}
                                        icon={<UserOutlined />}
                                        size={90}
                                        style={{
                                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                            fontSize: 36,
                                            border: '3px solid #fff',
                                            boxShadow: '0 4px 16px rgba(229,57,53,0.25)',
                                        }}
                                    />
                                </div>

                                <div style={{ marginTop: 12, fontWeight: 700, fontSize: 17, color: '#1a1a2e' }}>
                                    {account.name}
                                </div>
                                <div style={{ color: '#8c8c8c', fontSize: 13 }}>@{account.username}</div>

                                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    <StatusTag type="account" status={account.status} />
                                    {profile?.bloodType && (
                                        <Tag
                                            color={BLOOD_COLORS[profile.bloodType] ?? 'red'}
                                            style={{ fontWeight: 700 }}
                                        >
                                            {profile.bloodType}
                                        </Tag>
                                    )}
                                </div>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* Stats */}
                            <Row gutter={0}>
                                <Col span={12} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                                    <Statistic
                                        title={<span style={{ fontSize: 11, color: '#8c8c8c' }}>Lần hiến thành công</span>}
                                        value={donatedCount}
                                        valueStyle={{ fontSize: 22, color: '#e53935', fontWeight: 700 }}
                                        prefix={<HeartOutlined />}
                                    />
                                </Col>
                                <Col span={12} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title={<span style={{ fontSize: 11, color: '#8c8c8c' }}>Tổng đăng ký</span>}
                                        value={donations.length}
                                        valueStyle={{ fontSize: 22, color: '#1e88e5', fontWeight: 700 }}
                                    />
                                </Col>
                            </Row>

                            <Divider style={{ margin: '12px 0' }} />

                            {/* Contact */}
                            <div>
                                <InfoRow icon={<MailOutlined />} value={account.email} placeholder="Chưa có email" />
                                <InfoRow icon={<PhoneOutlined />} value={account.phone} placeholder="Chưa có SĐT" link={account.phone ? `tel:${account.phone}` : null} />
                                <InfoRow
                                    icon={<CalendarOutlined />}
                                    value={formatDateTime(account.createdAt)}
                                    label="Tham gia"
                                />
                            </div>
                        </Card>

                        {/* Donation status */}
                        {profile && (
                            <Card style={cardStyle} styles={{ body: { padding: 16 } }}>
                                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, fontWeight: 600 }}>
                                    TRẠNG THÁI SẴN SÀNG HIẾN
                                </div>
                                {profile.donationStatus ? (
                                    <Tag
                                        color={DONATION_STATUS_META[profile.donationStatus]?.color ?? 'default'}
                                        style={{ fontSize: 13, padding: '4px 12px' }}
                                    >
                                        {DONATION_STATUS_META[profile.donationStatus]?.label ?? profile.donationStatus}
                                    </Tag>
                                ) : (
                                    <span style={{ color: '#bbb', fontSize: 13 }}>Chưa cập nhật</span>
                                )}
                            </Card>
                        )}
                    </Space>
                </Col>

                {/* ── Cột phải: thông tin chi tiết ── */}
                <Col xs={24} lg={17}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        {/* Thông tin tài khoản */}
                        <Card
                            title={<span style={{ fontWeight: 700 }}>Thông tin tài khoản</span>}
                            style={cardStyle}
                        >
                            <Descriptions
                                column={{ xs: 1, sm: 2 }}
                                size="middle"
                                labelStyle={{ color: '#8c8c8c', fontWeight: 500 }}
                            >
                                {/* <Descriptions.Item label="ID" span={2}>
                                    <code style={{
                                        background: '#f5f5f5', padding: '2px 8px',
                                        borderRadius: 4, fontSize: 12, color: '#595959',
                                    }}>
                                        {account.id}
                                    </code>
                                </Descriptions.Item> */}
                                <Descriptions.Item label="Tên đăng nhập">{account.username}</Descriptions.Item>
                                <Descriptions.Item label="Họ tên">{account.name}</Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    {account.email
                                        ? <a href={`mailto:${account.email}`}>{account.email}</a>
                                        : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                    }
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">
                                    {account.phone || <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <StatusTag type="account" status={account.status} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                    {formatDateTime(account.createdAt)}
                                </Descriptions.Item>
                            </Descriptions>

                            {isBanned && (
                                <div style={{
                                    marginTop: 16, padding: '10px 14px',
                                    background: '#fff2f0', border: '1px solid #ffccc7',
                                    borderRadius: 8, color: '#cf1322', fontSize: 13,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <StopOutlined />
                                    Tài khoản đang bị khoá — người dùng không thể đăng nhập.
                                </div>
                            )}
                        </Card>

                        {/* Thông tin cá nhân (từ User table) */}
                        {profile && (
                            <Card
                                title={<span style={{ fontWeight: 700 }}>Thông tin cá nhân</span>}
                                style={cardStyle}
                            >
                                <Descriptions
                                    column={{ xs: 1, sm: 2 }}
                                    size="middle"
                                    labelStyle={{ color: '#8c8c8c', fontWeight: 500 }}
                                >
                                    <Descriptions.Item label="Ngày sinh">
                                        {profile.dateOfBirth
                                            ? formatDate(profile.dateOfBirth)
                                            : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giới tính">
                                        {profile.sex === 'male' ? <Space><ManOutlined style={{ color: '#1e88e5' }} />Nam</Space>
                                            : profile.sex === 'female' ? <Space><WomanOutlined style={{ color: '#e91e8c' }} />Nữ</Space>
                                                : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nhóm máu">
                                        {profile.bloodType
                                            ? <Tag color={BLOOD_COLORS[profile.bloodType] ?? 'red'} style={{ fontWeight: 700 }}>{profile.bloodType}</Tag>
                                            : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Cân nặng">
                                        {profile.weight
                                            ? `${profile.weight} kg`
                                            : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Lần hiến cuối">
                                        {profile.lastBloodDonationDate
                                            ? formatDate(profile.lastBloodDonationDate)
                                            : <span style={{ color: '#bbb' }}>Chưa từng hiến</span>
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái hiến">
                                        {profile.donationStatus
                                            ? <Tag color={DONATION_STATUS_META[profile.donationStatus]?.color}>{DONATION_STATUS_META[profile.donationStatus]?.label}</Tag>
                                            : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Địa chỉ" span={2}>
                                        {[profile.ward, profile.province].filter(Boolean).join(', ')
                                            || <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                        }
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        )}

                        {/* Lịch sử hiến máu */}
                        <Card
                            title={
                                <Space>
                                    <HeartOutlined style={{ color: '#e53935' }} />
                                    <span style={{ fontWeight: 700 }}>
                                        Lịch sử đăng ký hiến ({donations.length})
                                        {donatedCount > 0 && (
                                            <Tag color="red" style={{ marginLeft: 8, fontWeight: 600 }}>
                                                {donatedCount} lần thành công
                                            </Tag>
                                        )}
                                    </span>
                                </Space>
                            }
                            style={cardStyle}
                        >
                            <Table
                                dataSource={donations}
                                columns={donationColumns}
                                rowKey="id"
                                size="small"
                                pagination={{ pageSize: 8, size: 'small' }}
                                locale={{ emptyText: 'Chưa có lịch sử đăng ký hiến máu' }}
                                scroll={{ x: 600 }}
                            />
                        </Card>
                    </Space>
                </Col>
            </Row>
            <Modal
                open={!!previewAvatar}
                footer={null}
                onCancel={() => setPreviewAvatar(null)}
                width={600}
                centered
                bodyStyle={{ padding: 0 }}
            >
                {previewAvatar && (
                    <Image
                        src={previewAvatar}
                        style={{ width: '100%', borderRadius: 8 }}
                        preview={false}
                    />
                )}
            </Modal>
        </div>
    )
}

function InfoRow({ icon, value, placeholder, label, link }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0', borderBottom: '1px solid #f5f5f5',
        }}>
            <span style={{ color: '#bbb', fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                {label && <div style={{ fontSize: 10, color: '#bbb', marginBottom: 1 }}>{label}</div>}
                {link
                    ? <a href={link} style={{ fontSize: 13 }}>{value}</a>
                    : <div style={{
                        fontSize: 13, color: value ? '#1a1a2e' : '#bbb',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {value || placeholder}
                    </div>
                }
            </div>
        </div>
    )
}