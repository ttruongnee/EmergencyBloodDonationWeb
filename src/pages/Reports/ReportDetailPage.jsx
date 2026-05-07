import {
    Card, Row, Col, Button, Tag, Space,
    Spin, App, Avatar, Descriptions, Image,
    Divider, Alert,
} from 'antd'
import {
    ArrowLeftOutlined, CheckCircleOutlined,
    CloseCircleOutlined, UserOutlined,
    WarningOutlined, FileTextOutlined,
    SafetyOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import reportApi from '../../api/reportApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDateTime } from '../../utils/helpers'

const cardStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

const REASON_COLOR = {
    'Thông tin sai sự thật': 'red',
    'Lừa đảo': 'volcano',
    'Nội dung không phù hợp': 'orange',
    'Spam': 'gold',
    'Khác': 'default',
}

export default function ReportDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()

    const { data: res, isLoading } = useQuery({
        queryKey: ['report', id],
        queryFn: () => reportApi.getById(id),
    })

    const report = res?.data ?? null

    const { mutate: resolve, isPending: resolving } = useMutation({
        mutationFn: () => reportApi.resolve(id),
        onSuccess: () => {
            message.success('Đã xử lý — bài đăng bị ẩn')
            queryClient.invalidateQueries({ queryKey: ['report', id] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const { mutate: reject, isPending: rejecting } = useMutation({
        mutationFn: () => reportApi.reject(id),
        onSuccess: () => {
            message.success('Đã bác bỏ báo cáo')
            queryClient.invalidateQueries({ queryKey: ['report', id] })
            queryClient.invalidateQueries({ queryKey: ['reports'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const handleResolve = () => {
        modal.confirm({
            title: 'Xử lý báo cáo?',
            content: (
                <div>
                    <p>Bài đăng liên quan sẽ bị <strong>ẩn khỏi hệ thống</strong>.</p>
                    <p style={{ color: '#8c8c8c', fontSize: 13, marginTop: 6 }}>
                        Lý do: <em>{report?.reason}</em>
                    </p>
                </div>
            ),
            okText: 'Xác nhận xử lý',
            okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => resolve(),
        })
    }

    const handleReject = () => {
        modal.confirm({
            title: 'Bác bỏ báo cáo?',
            content: 'Báo cáo sẽ bị đánh dấu không hợp lệ. Bài đăng không bị ảnh hưởng.',
            okText: 'Bác bỏ',
            cancelText: 'Huỷ',
            onOk: () => reject(),
        })
    }

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: 120 }}>
            <Spin size="large" />
        </div>
    )

    if (!report) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Không tìm thấy báo cáo</div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reports')}>
                Quay lại
            </Button>
        </div>
    )

    const isPending = report.status === 'pending'
    const isResolved = report.status === 'resolved'
    const isRejected = report.status === 'rejected'

    return (
        <div>
            <PageHeader
                title="Chi tiết báo cáo"
                extra={[
                    <Button
                        key="back"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/reports')}
                    >
                        Quay lại
                    </Button>,

                    isPending && (
                        <Button
                            key="resolve"
                            icon={<CheckCircleOutlined />}
                            onClick={handleResolve}
                            loading={resolving}
                            style={{ borderColor: '#52c41a', color: '#52c41a' }}
                        >
                            Xử lý — ẩn bài đăng
                        </Button>
                    ),

                    isPending && (
                        <Button
                            key="reject"
                            icon={<CloseCircleOutlined />}
                            onClick={handleReject}
                            loading={rejecting}
                            danger
                        >
                            Bác bỏ báo cáo
                        </Button>
                    ),
                ].filter(Boolean)}
            />

            {/* ── Alert trạng thái ── */}
            {isResolved && (
                <Alert
                    message="Báo cáo đã được xử lý — bài đăng liên quan đã bị ẩn"
                    type="success" showIcon
                    style={{ marginBottom: 16, borderRadius: 10 }}
                />
            )}
            {isRejected && (
                <Alert
                    message="Báo cáo đã bị bác bỏ — bài đăng không bị ảnh hưởng"
                    type="warning" showIcon
                    style={{ marginBottom: 16, borderRadius: 10 }}
                />
            )}

            <Row gutter={[16, 16]}>

                {/* ── Cột trái ── */}
                <Col xs={24} lg={8}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        {/* Card trạng thái + actions */}
                        <Card style={cardStyle}>
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: isPending ? '#fffbe6' : isResolved ? '#f6ffed' : '#f5f5f5',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px', fontSize: 30,
                                }}>
                                    {isPending ? '⏳' : isResolved ? '✅' : '❌'}
                                </div>

                                <StatusTag type="report" status={report.status} />

                                <div style={{ marginTop: 10, fontSize: 12, color: '#8c8c8c' }}>
                                    Ngày báo cáo: {formatDateTime(report.createdAt)}
                                </div>
                                {report.updatedAt && (
                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                        Cập nhật: {formatDateTime(report.updatedAt)}
                                    </div>
                                )}
                            </div>

                            {isPending && (
                                <>
                                    <Divider />
                                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                        <Button
                                            block
                                            icon={<CheckCircleOutlined />}
                                            onClick={handleResolve}
                                            loading={resolving}
                                            style={{ borderColor: '#52c41a', color: '#52c41a', height: 40 }}
                                        >
                                            Xử lý — ẩn bài đăng
                                        </Button>
                                        <Button
                                            block danger
                                            icon={<CloseCircleOutlined />}
                                            onClick={handleReject}
                                            loading={rejecting}
                                            style={{ height: 40 }}
                                        >
                                            Bác bỏ báo cáo
                                        </Button>
                                    </Space>
                                </>
                            )}
                        </Card>

                        {/* ── Người báo cáo — click → trang user detail ── */}
                        <Card
                            title={
                                <Space>
                                    <UserOutlined />
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>Người báo cáo</span>
                                </Space>
                            }
                            style={cardStyle}
                            styles={{ body: { padding: 16 } }}
                        >
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    // Chỉ cho cursor pointer nếu có accountId để navigate
                                    cursor: report.reporterAccountId ? 'pointer' : 'default',
                                    padding: 8, borderRadius: 8,
                                    transition: 'background 0.15s',
                                }}
                                onClick={() => {
                                    if (report.reporterAccountId) {
                                        navigate(`/users/${report.reporterAccountId}`)
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    if (report.reporterAccountId)
                                        e.currentTarget.style.background = '#f5f5f5'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                }}
                            >
                                <Avatar
                                    src={report.reporterAvatar}
                                    size={44}
                                    style={{ background: '#8e24aa', flexShrink: 0 }}
                                >
                                    {report.reporterName?.[0]}
                                </Avatar>
                                <div>
                                    <div style={{
                                        fontWeight: 600, fontSize: 14,
                                        // Màu xanh link nếu có thể click
                                        color: report.reporterAccountId ? '#1e88e5' : '#1a1a2e',
                                    }}>
                                        {report.reporterName}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                        @{report.reporterUsername}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* ── Người xử lý báo cáo ── */}
                        {(isResolved || isRejected) && (
                            <Card
                                title={
                                    <Space>
                                        <SafetyOutlined style={{ color: '#52c41a' }} />
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>Người xử lý</span>
                                    </Space>
                                }
                                style={cardStyle}
                                styles={{ body: { padding: 16 } }}
                            >
                                {report.handlerName ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar
                                            src={report.handlerAvatar}
                                            size={44}
                                            style={{
                                                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {report.handlerName?.[0]}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                {report.handlerName}
                                            </div>
                                            {report.handlerUsername && (
                                                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                                                    @{report.handlerUsername}
                                                </div>
                                            )}
                                            {report.updatedAt && (
                                                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                                                    Xử lý lúc {formatDateTime(report.updatedAt)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ color: '#bbb', fontSize: 13 }}>
                                        Không có thông tin
                                    </span>
                                )}
                            </Card>
                        )}


                    </Space>
                </Col>

                {/* ── Cột phải: bài đăng bị báo cáo ── */}
                <Col xs={24} lg={16}>
                    {/* ── Lý do báo cáo ── */}
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        <Card
                            title={
                                <Space>
                                    <WarningOutlined style={{ color: '#faad14' }} />
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>Lý do báo cáo</span>
                                </Space>
                            }
                            style={cardStyle}
                            styles={{ body: { padding: 16 } }}
                        >
                            <Tag
                                color={REASON_COLOR[report.reason] ?? 'orange'}
                                style={{ fontSize: 13, padding: '4px 12px', whiteSpace: 'normal' }}
                            >
                                {report.reason}
                            </Tag>

                            {report.content && (
                                <div style={{
                                    marginTop: 12, padding: '10px 12px',
                                    background: '#fafafa', borderRadius: 8,
                                    fontSize: 13, lineHeight: 1.7,
                                    color: '#595959', whiteSpace: 'pre-wrap',
                                }}>
                                    {report.content}
                                </div>
                            )}
                        </Card>
                        <Card
                            title={
                                <Space>
                                    <FileTextOutlined style={{ color: '#1e88e5' }} />
                                    <span style={{ fontWeight: 700 }}>Bài đăng bị báo cáo</span>
                                </Space>
                            }
                            style={cardStyle}
                            extra={
                                report.postId && (
                                    <Button
                                        type="link" size="small"
                                        onClick={() => navigate(`/posts/${report.postId}`)}
                                    >
                                        Xem bài đăng
                                    </Button>
                                )
                            }
                        >

                            {report.postPatientName ? (
                                <>
                                    <Descriptions
                                        column={1}
                                        size="middle"
                                        labelStyle={{ color: '#8c8c8c', fontWeight: 500 }}
                                    >
                                        <Descriptions.Item label="Bệnh nhân">
                                            <strong>{report.postPatientName}</strong>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Trạng thái">
                                            <StatusTag type="post" status={report.postStatus} />
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Bệnh viện">
                                            {report.postHospitalName ?? '—'}
                                        </Descriptions.Item>

                                        {/* Người đăng bài — click → user detail */}
                                        <Descriptions.Item label="Người đăng">
                                            <div
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center',
                                                    gap: 8, cursor: report.postAuthorAccountId ? 'pointer' : 'default',
                                                }}
                                                onClick={() => {
                                                    if (report.postAuthorAccountId)
                                                        navigate(`/users/${report.postAuthorAccountId}`)
                                                }}
                                            >
                                                <Avatar
                                                    src={report.postAuthorAvatar}
                                                    size={24}
                                                    style={{ background: '#e53935' }}
                                                >
                                                    {report.postAuthorName?.[0]}
                                                </Avatar>
                                                <span style={{
                                                    fontWeight: 500,
                                                    color: report.postAuthorAccountId ? '#1e88e5' : '#1a1a2e',
                                                }}>
                                                    {report.postAuthorName}
                                                </span>
                                            </div>
                                        </Descriptions.Item>

                                        <Descriptions.Item label="Ngày đăng">
                                            {formatDateTime(report.postCreatedAt)}
                                        </Descriptions.Item>
                                    </Descriptions>

                                    {/* Nội dung bài đăng */}
                                    {report.postContent && (
                                        <>
                                            <Divider style={{ margin: '12px 0' }} />
                                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                                                Nội dung bài đăng:
                                            </div>
                                            <div style={{
                                                padding: '10px 14px',
                                                background: '#fafafa', borderRadius: 8,
                                                fontSize: 13, lineHeight: 1.7,
                                                color: '#595959', whiteSpace: 'pre-wrap',
                                                maxHeight: 200, overflowY: 'auto',
                                            }}>
                                                {report.postContent}
                                            </div>
                                        </>
                                    )}

                                    {/* Ảnh bài đăng */}
                                    {report.postImages?.length > 0 && (
                                        <>
                                            <Divider style={{ margin: '12px 0' }} />
                                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                                                Hình ảnh bài đăng:
                                            </div>
                                            <Image.PreviewGroup>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {report.postImages.map((img, i) => (
                                                        <Image
                                                            key={i} src={img}
                                                            width={72} height={72}
                                                            style={{ borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </div>
                                            </Image.PreviewGroup>
                                        </>
                                    )}
                                </>
                            ) : (
                                // BE chỉ trả về postId, chưa join thông tin post
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <FileTextOutlined style={{ fontSize: 40, color: '#ddd', marginBottom: 12 }} />
                                    <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                                        ID bài đăng:
                                    </div>
                                    <code style={{
                                        background: '#f5f5f5', padding: '4px 10px',
                                        borderRadius: 6, fontSize: 12, color: '#595959',
                                    }}>
                                        {report.postId}
                                    </code>
                                    <div style={{ marginTop: 16 }}>
                                        <Button
                                            type="primary" ghost
                                            icon={<FileTextOutlined />}
                                            onClick={() => navigate(`/posts/${report.postId}`)}
                                        >
                                            Xem chi tiết bài đăng
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Space>

                </Col>
            </Row>
        </div>
    )
}