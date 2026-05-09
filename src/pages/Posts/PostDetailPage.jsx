import {
    Card, Row, Col, Button, Tag, Space,
    Spin, App, Popconfirm, Image, Descriptions,
    Progress, Table, Avatar, Typography, Divider,
} from 'antd'
import {
    ArrowLeftOutlined, EyeInvisibleOutlined,
    DeleteOutlined, UserOutlined,
    EnvironmentOutlined, PhoneOutlined,
    HeartOutlined, CalendarOutlined,
    DropboxOutlined, EyeOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import postApi from '../../api/postApi'
import donationApi from '../../api/donationApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDateTime, getDonationStatusMeta } from '../../utils/helpers'

const { Text } = Typography

const BLOOD_COLORS = {
    'A+': '#e53935', 'A-': '#ef5350',
    'B+': '#1e88e5', 'B-': '#42a5f5',
    'AB+': '#8e24aa', 'AB-': '#ab47bc',
    'O+': '#43a047', 'O-': '#66bb6a',
}

const cardStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

// Mở Google Maps theo toạ độ
function openMap(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank')
}

export default function PostDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()

    const { data: postRes, isLoading } = useQuery({
        queryKey: ['post', id],
        queryFn: () => postApi.getById(id),
    })

    const { data: donationRes, isLoading: loadingDonations } = useQuery({
        queryKey: ['donations-post', id],
        queryFn: () => donationApi.getByPostId(id),
        enabled: !!id,
    })

    const post = postRes?.data ?? null
    const donations = donationRes?.data ?? []

    const { mutate: hidePost, isPending: hiding } = useMutation({
        mutationFn: () => postApi.hide(id),
        onSuccess: () => {
            message.success('Đã ẩn bài đăng')
            queryClient.invalidateQueries({ queryKey: ['post', id] })
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const { mutate: unhidePost, isPending: unhiding } = useMutation({
        mutationFn: () => postApi.unhide(id),
        onSuccess: () => {
            message.success('Đã hiện lại bài đăng')
            queryClient.invalidateQueries({ queryKey: ['post', id] })
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })


    const { mutate: deletePost, isPending: deleting } = useMutation({
        mutationFn: () => postApi.delete(id),
        onSuccess: () => {
            message.success('Đã xoá bài đăng')
            navigate('/posts')
        },
        onError: (err) => message.error(err?.message || 'Xoá thất bại'),
    })

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: 120 }}><Spin size="large" /></div>
    )

    if (!post) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Không tìm thấy bài đăng</div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>Quay lại</Button>
        </div>
    )

    const bloodPct = post.requiredBloodVolume > 0
        ? Math.min(100, Math.round((post.registeredBloodVolume / post.requiredBloodVolume) * 100))
        : 0

    const hasCoords = post.hospitalLatitude && post.hospitalLongitude

    const donationColumns = [
        {
            title: 'Người hiến',
            align: 'center',
            key: 'donor',
            width: 220,
            render: (_, r) => (
                <Space
                    style={{ cursor: r.donorAccountId ? 'pointer' : 'default' }}
                    onClick={() => r.donorAccountId && navigate(`/users/${r.donorAccountId}`)}
                >
                    <Avatar
                        src={r.donorAvatar || undefined}
                        icon={<UserOutlined />}
                        size={32}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            flexShrink: 0,
                            fontSize: 13,
                        }}
                    />
                    <span style={{ fontWeight: 500, fontSize: 13, color: '#1e88e5' }}>
                        {r.donorName}
                    </span>
                </Space>
            ),
        },
        {
            title: 'Lượng máu',
            align: 'center',
            dataIndex: 'bloodAmount',
            width: 100,
            render: (v) => v ? <span style={{ fontWeight: 600, color: '#e53935' }}>{v} ml</span> : '—',
        },
        {
            title: 'Giờ hẹn',
            align: 'center',
            dataIndex: 'appointmentTime',
            width: 150,
            render: (v) => <span style={{ fontSize: 12 }}>{formatDateTime(v)}</span>,
        },
        {
            title: 'Xác nhận lúc',
            align: 'center',
            dataIndex: 'donorConfirmedAt',
            width: 150,
            render: (v) => v
                ? <span style={{ fontSize: 12, color: '#52c41a' }}>{formatDateTime(v)}</span>
                : <span style={{ color: '#bbb', fontSize: 12 }}>Chưa xác nhận</span>,
        },
        {
            title: 'Trạng thái',
            align: 'center',
            dataIndex: 'status',
            width: 130,
            render: (v) => {
                const { label, color } = getDonationStatusMeta(v)
                return <Tag color={color}>{label}</Tag>
            },
        },
        {
            title: 'Minh chứng',
            align: 'center',
            dataIndex: 'imageUrl',
            width: 100,
            render: (v) => v
                ? (
                    <Image
                        src={v} width={48} height={48}
                        style={{ borderRadius: 6, objectFit: 'cover', cursor: 'pointer' }}
                    />
                )
                : <span style={{ color: '#bbb', fontSize: 12 }}>Không có</span>,
        },
    ]

    return (
        <div>
            <PageHeader
                title="Chi tiết bài đăng"
                extra={[
                    <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>
                        Quay lại
                    </Button>,
                    post.status !== 'hidden' ? (
                        <Button key="hide"
                            icon={<EyeInvisibleOutlined />}
                            onClick={() => modal.confirm({
                                title: 'Ẩn bài đăng?',
                                content: 'Bài đăng sẽ bị ẩn khỏi danh sách công khai.',
                                okText: 'Ẩn bài', okButtonProps: { danger: true }, cancelText: 'Huỷ',
                                onOk: () => hidePost(),
                            })}
                            loading={hiding}
                            style={{ borderColor: '#faad14', color: '#faad14' }}
                        >
                            Ẩn bài
                        </Button>
                    ) : (
                        <Button key="unhide"
                            icon={<EyeOutlined />}
                            onClick={() => modal.confirm({
                                title: 'Hiện lại bài đăng?',
                                content: 'Bài đăng sẽ được khôi phục về trạng thái trước khi ẩn.',
                                okText: 'Hiện lại', cancelText: 'Huỷ',
                                onOk: () => unhidePost(),
                            })}
                            loading={unhiding}
                            style={{ borderColor: '#52c41a', color: '#52c41a' }}
                        >
                            Hiện lại
                        </Button>
                    ),
                    <Popconfirm key="delete"
                        title="Xoá bài đăng?"
                        description="Hành động này không thể hoàn tác."
                        okText="Xoá" okButtonProps={{ danger: true }} cancelText="Huỷ"
                        onConfirm={() => deletePost()}
                    >
                        <Button danger icon={<DeleteOutlined />} loading={deleting}>Xoá bài</Button>
                    </Popconfirm>,
                ].filter(Boolean)}
            />

            <Row gutter={[16, 16]}>

                {/* ── Cột trái: tóm tắt ── */}
                <Col xs={24} lg={7}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        {/* Blood + progress */}
                        <Card style={cardStyle}>
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: `${BLOOD_COLORS[post.bloodType] ?? '#e53935'}18`,
                                    marginBottom: 12,
                                }}>
                                    <span style={{
                                        fontSize: 28, fontWeight: 900,
                                        color: BLOOD_COLORS[post.bloodType] ?? '#e53935',
                                    }}>
                                        {post.bloodType}
                                    </span>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <StatusTag type="post" status={post.status} />
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div style={{ textAlign: 'left', padding: '0 4px' }}>
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                                        Tiến độ thu thập
                                    </div>
                                    <Progress
                                        percent={bloodPct}
                                        strokeColor={bloodPct >= 100 ? '#52c41a' : BLOOD_COLORS[post.bloodType] ?? '#e53935'}
                                        format={() => (
                                            <span style={{ fontSize: 11, fontWeight: 600 }}>
                                                {post.registeredBloodVolume}/{post.requiredBloodVolume} ml
                                            </span>
                                        )}
                                    />
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                {/* Quick info */}
                                <div style={{ textAlign: 'left' }}>
                                    <QuickInfo icon={<UserOutlined />} label="Bệnh nhân" value={post.patientName} />
                                    <QuickInfo icon={<PhoneOutlined />} label="SĐT liên hệ" value={post.phone} link={`tel:${post.phone}`} />
                                    <QuickInfo icon={<CalendarOutlined />} label="Ngày đăng" value={formatDateTime(post.createdAt)} />
                                    <QuickInfo icon={<DropboxOutlined />} label="Cần thu thập" value={`${post.requiredBloodVolume} ml`} />
                                </div>
                            </div>
                        </Card>

                        {/* Người đăng */}
                        <Card
                            title={<span style={{ fontWeight: 700, fontSize: 13 }}>Người đăng bài</span>}
                            style={cardStyle}
                            styles={{ body: { padding: 16 } }}
                        >
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                                onClick={() => post.postedByAccountId && navigate(`/users/${post.postedByAccountId}`)}
                            >
                                <Avatar
                                    src={post.postedByAvatar || undefined}
                                    icon={<UserOutlined />}
                                    size={44}
                                    style={{
                                        background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                        fontSize: 18,
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1e88e5' }}>{post.postedByName}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>@{post.postedByUsername}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Bệnh viện */}
                        <Card
                            title={<span style={{ fontWeight: 700, fontSize: 13 }}>Bệnh viện</span>}
                            style={cardStyle}
                            styles={{ body: { padding: 16 } }}
                        >
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <EnvironmentOutlined style={{ color: '#e53935', marginTop: 3, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{post.hospitalName}</div>
                                    {post.hospitalAddress && (
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                            {post.hospitalAddress}
                                        </div>
                                    )}
                                    {post.hospitalProvince && (
                                        <Tag style={{ marginTop: 6 }}>{post.hospitalProvince}</Tag>
                                    )}
                                    {hasCoords && (
                                        <Button
                                            size="small"
                                            type="link"
                                            style={{ padding: 0, marginTop: 8, fontSize: 12 }}
                                            icon={<EnvironmentOutlined />}
                                            onClick={() => openMap(
                                                post.hospitalLatitude,
                                                post.hospitalLongitude,
                                            )}
                                        >
                                            Xem vị trí trên bản đồ ↗
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Bản đồ nhúng inline */}
                            {hasCoords && (
                                <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                    <iframe
                                        title="map"
                                        width="100%"
                                        height="200"
                                        frameBorder="0"
                                        style={{ display: 'block', border: 0 }}
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps?q=${post.hospitalLatitude},${post.hospitalLongitude}&z=16&output=embed`}
                                    />
                                </div>
                            )}
                        </Card>
                    </Space>
                </Col>

                {/* ── Cột phải: nội dung + donations ── */}
                <Col xs={24} lg={17}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {/* Ảnh đính kèm — chuyển lên đây */}
                        {post.images?.length > 0 && (
                            <Card
                                title={<span style={{ fontWeight: 700, fontSize: 13 }}>Hình ảnh ({post.images.length})</span>}
                                style={cardStyle}
                                styles={{ body: { padding: 12 } }}
                            >
                                <Image.PreviewGroup>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${post.images.length}, 1fr)`,
                                        gap: 8,
                                    }}>
                                        {post.images.map((img, i) => (
                                            <Image
                                                key={i}
                                                src={img}
                                                width="100%"
                                                height={180}
                                                style={{ borderRadius: 8, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                                            />
                                        ))}
                                    </div>
                                </Image.PreviewGroup>
                            </Card>
                        )}
                        {/* Nội dung */}
                        {post.content && (
                            <Card
                                title={<span style={{ fontWeight: 700 }}>📝 Nội dung bài đăng</span>}
                                style={cardStyle}
                            >
                                <div style={{
                                    fontSize: 14, lineHeight: 1.8,
                                    color: '#1a1a2e', whiteSpace: 'pre-wrap',
                                    background: '#fafafa', borderRadius: 8,
                                    padding: '12px 16px',
                                }}>
                                    {post.content}
                                </div>
                            </Card>
                        )}

                        {/* Danh sách hiến máu */}
                        <Card
                            title={
                                <Space>
                                    <HeartOutlined style={{ color: '#e53935' }} />
                                    <span style={{ fontWeight: 700 }}>
                                        Danh sách đăng ký hiến ({donations.length})
                                    </span>
                                </Space>
                            }
                            style={cardStyle}
                        >
                            <Image.PreviewGroup>
                                <Table
                                    dataSource={donations}
                                    columns={donationColumns}
                                    rowKey="id"
                                    loading={loadingDonations}
                                    size="small"
                                    pagination={{ pageSize: 10, size: 'small' }}
                                    locale={{ emptyText: 'Chưa có ai đăng ký hiến máu' }}
                                    scroll={{ x: 700 }}
                                />
                            </Image.PreviewGroup>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    )
}

function QuickInfo({ icon, label, value, link }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0', borderBottom: '1px solid #f5f5f5',
        }}>
            <span style={{ color: '#bbb', fontSize: 13, flexShrink: 0, width: 16 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#bbb', marginBottom: 1 }}>{label}</div>
                {link ? (
                    <a href={link} style={{ fontSize: 13, fontWeight: 500 }}>{value}</a>
                ) : (
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{value}</div>
                )}
            </div>
        </div>
    )
}