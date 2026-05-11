import { useState } from 'react'
import {
    Card, Form, Input, Select, Button,
    Space, Alert, Divider, Tag, Avatar, App,
    Row, Col,
} from 'antd'
import {
    ArrowLeftOutlined, SendOutlined,
    GlobalOutlined, BellOutlined, UserOutlined
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import notificationApi from '../../api/notificationApi'
import accountApi from '../../api/accountApi'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/common/PageHeader'
import { BLOOD_TYPES } from '../../constants'
import { useAreaPicker } from '../../hooks/useAreaPicker'

const { TextArea } = Input

const DESTINATION_OPTIONS = [
    {
        value: 'all',
        label: '🌐 Tất cả người dùng',
        desc: 'Gửi đến toàn bộ người dùng trong hệ thống',
        color: '#8e24aa',
    },
    {
        value: 'blood_type',
        label: '🩸 Theo nhóm máu',
        desc: 'Gửi đến người dùng có nhóm máu cụ thể',
        color: '#e53935',
    },
    {
        value: 'area',
        label: '📍 Theo khu vực',
        desc: 'Gửi đến người dùng thuộc tỉnh/phường/xã',
        color: '#1e88e5',
    },
    {
        value: 'user',
        label: '👤 Cá nhân',
        desc: 'Gửi đến một người dùng cụ thể',
        color: '#43a047',
    },
]

const BLOOD_COLORS = {
    'A+': '#e53935', 'A-': '#ef5350',
    'B+': '#1e88e5', 'B-': '#42a5f5',
    'AB+': '#8e24aa', 'AB-': '#ab47bc',
    'O+': '#43a047', 'O-': '#66bb6a',
}

const cardStyle = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

export default function SendNotificationPage() {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const { message } = App.useApp()

    const [destination, setDestination] = useState('all')
    const [preview, setPreview] = useState(null)

    // Hook cascade tỉnh → phường/xã (hệ 2 cấp sau sáp nhập)
    const area = useAreaPicker()

    // Danh sách user khi destination = 'user'
    const { data: usersRes } = useQuery({
        queryKey: ['accounts-for-select'],
        queryFn: () => accountApi.getAll({ role: 'user', pageSize: 999 }),
        enabled: destination === 'user',
    })
    const userOptions = (usersRes?.data?.items ?? []).map((u) => ({
        value: u.id,
        label: `${u.name} (@${u.username})`,
        avatar: u.avatar,
        name: u.name,
        username: u.username,
    }))

    const { mutate: sendBroadcast, isPending } = useMutation({
        mutationFn: (data) => notificationApi.broadcast(data),
        onSuccess: () => {
            message.success('Gửi thông báo thành công!')
            form.resetFields()
            setDestination('all')
            setPreview(null)
            area.reset()
            navigate('/notifications')
        },
        onError: (err) => message.error(err?.message || 'Gửi thất bại'),
    })

    const onFinish = (values) => {
        const payload = {
            title: values.title,
            content: values.content,
            destination: values.destination,
        }

        if (values.destination === 'blood_type') {
            payload.bloodType = values.bloodType
        }

        if (values.destination === 'area') {
            // Hệ 2 cấp: Tỉnh → Phường/Xã 
            payload.province = area.normalizedProvince || undefined
            payload.ward = area.normalizedWard || undefined
        }

        if (values.destination === 'user') {
            payload.userId = values.userId
        }

        sendBroadcast(payload)
    }

    const handleValuesChange = (_, all) => {
        setDestination(all.destination ?? 'all')
        if (all.title) {
            setPreview({ title: all.title, content: all.content })
        } else {
            setPreview(null)
        }
    }

    const handleDestinationChange = (value) => {
        form.setFieldValue('destination', value)
        setDestination(value)
        if (value !== 'area') area.reset()
    }

    return (
        <div>
            <PageHeader
                title="Gửi thông báo"
                subtitle="Gửi thông báo đến người dùng theo nhiều hình thức"
                extra={[
                    <Button
                        key="back"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/notifications')}
                    >
                        Quay lại
                    </Button>,
                ]}
            />

            <Row gutter={[16, 16]}>

                {/* ── Cột trái: Form ── */}
                <Col xs={24} lg={15}>
                    <Card style={cardStyle}>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{ destination: 'all' }}
                            onFinish={onFinish}
                            onValuesChange={handleValuesChange}
                        >
                            {/* Tiêu đề */}
                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Tiêu đề thông báo</span>}
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                            >
                                <Input
                                    placeholder="VD: Khẩn cấp cần máu nhóm A+..."
                                    size="large"
                                    maxLength={200}
                                    showCount
                                />
                            </Form.Item>

                            {/* Nội dung */}
                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Nội dung</span>}
                                name="content"
                            >
                                <TextArea
                                    placeholder="Nội dung chi tiết của thông báo..."
                                    autoSize={{ minRows: 4, maxRows: 10 }}
                                    maxLength={1000}
                                    showCount
                                />
                            </Form.Item>

                            <Divider />

                            {/* Đối tượng nhận */}
                            <Form.Item
                                label={<span style={{ fontWeight: 600 }}>Đối tượng nhận</span>}
                                name="destination"
                                rules={[{ required: true }]}
                            >
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {DESTINATION_OPTIONS.map((opt) => {
                                        const active = destination === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleDestinationChange(opt.value)}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: 10,
                                                    cursor: 'pointer',
                                                    border: active
                                                        ? `2px solid ${opt.color}`
                                                        : '2px solid #f0f0f0',
                                                    background: active ? `${opt.color}10` : '#fff',
                                                    transition: 'all 0.15s',
                                                    outline: 'none',
                                                    textAlign: 'left',
                                                    minWidth: 170,
                                                    flex: '1 1 150px',
                                                }}
                                            >
                                                <div style={{ fontWeight: active ? 700 : 500, color: active ? opt.color : '#595959' }}>
                                                    {opt.label}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                                                    {opt.desc}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </Form.Item>

                            {/* Blood type */}
                            {destination === 'blood_type' && (
                                <Form.Item
                                    label={<span style={{ fontWeight: 600 }}>Nhóm máu</span>}
                                    name="bloodType"
                                    rules={[{ required: true, message: 'Chọn nhóm máu' }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Chọn nhóm máu cần gửi"
                                        options={BLOOD_TYPES.map((b) => ({
                                            value: b,
                                            label: (
                                                <Space>
                                                    <Tag
                                                        color={BLOOD_COLORS[b] ?? 'red'}
                                                        style={{ fontWeight: 700, margin: 0 }}
                                                    >
                                                        {b}
                                                    </Tag>
                                                    Nhóm {b}
                                                </Space>
                                            ),
                                        }))}
                                    />
                                </Form.Item>
                            )}

                            {/* Area — hệ 2 cấp: Tỉnh → Phường/Xã */}
                            {destination === 'area' && (
                                <>
                                    <Alert
                                        message="Chọn ít nhất Tỉnh/Thành phố. Càng cụ thể thì càng ít người nhận."
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16, borderRadius: 8 }}
                                    />
                                    <Row gutter={12}>
                                        {/* Tỉnh/Thành phố */}
                                        <Col span={12}>
                                            <Form.Item
                                                label="Tỉnh / Thành phố"
                                                name="province"
                                                rules={[{ required: true, message: 'Chọn tỉnh/thành' }]}
                                            >
                                                <Select
                                                    size="large"
                                                    placeholder="Chọn tỉnh/thành..."
                                                    loading={area.loadingP}
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={area.provinceOptions}
                                                    onChange={(val, opt) => {
                                                        area.onProvinceChange(val, opt)
                                                        form.setFieldsValue({ ward: undefined })
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>

                                        {/* Phường/Xã — dùng wardOptions vì hệ 2 cấp */}
                                        <Col span={12}>
                                            <Form.Item label="Phường / Xã" name="ward">
                                                <Select
                                                    size="large"
                                                    placeholder="Chọn phường/xã..."
                                                    loading={area.loadingW}
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={area.wardOptions}
                                                    disabled={!area.selectedProvince || area.loadingW}
                                                    allowClear
                                                    onChange={(val, opt) => {
                                                        area.onWardChange(val, opt)
                                                    }}
                                                    onClear={() => {
                                                        area.onWardChange(null, { label: '' })
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Hiển thị khu vực đã chọn */}
                                    {area.selectedProvince && (
                                        <div style={{
                                            marginBottom: 16, padding: '8px 12px',
                                            background: '#e3f2fd', borderRadius: 8,
                                            fontSize: 13, color: '#1e88e5',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            📍 Gửi đến:{' '}
                                            <strong>
                                                {[
                                                    area.normalizedWard,
                                                    area.normalizedProvince,
                                                ].filter(Boolean).join(', ')}
                                            </strong>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* User cụ thể */}
                            {destination === 'user' && (
                                <Form.Item
                                    label={<span style={{ fontWeight: 600 }}>Chọn người dùng</span>}
                                    name="userId"
                                    rules={[{ required: true, message: 'Chọn người dùng' }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="Tìm theo tên hoặc username..."
                                        showSearch
                                        filterOption={(input, option) =>
                                            option?.label?.toLowerCase().includes(input.toLowerCase())
                                        }
                                        options={userOptions.map((u) => ({
                                            value: u.value,
                                            label: `${u.name} (@${u.username})`,
                                            render: u,
                                        }))}
                                        optionRender={(opt) => (
                                            <Space>
                                                <Avatar
                                                    src={opt.data.render?.avatar || undefined}
                                                    icon={<UserOutlined />}
                                                    size={28}
                                                    style={{
                                                        background: opt.data.render?.avatar ? 'transparent' : '#e53935',
                                                        fontSize: 16,
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                        {opt.data.render?.name}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                                                        @{opt.data.render?.username}
                                                    </div>
                                                </div>
                                            </Space>
                                        )}
                                    />
                                </Form.Item>
                            )}

                            <Divider />

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<SendOutlined />}
                                    loading={isPending}
                                    style={{
                                        background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                        border: 'none',
                                        fontWeight: 600,
                                        height: 48,
                                        paddingInline: 32,
                                    }}
                                >
                                    {isPending ? 'Đang gửi...' : 'Gửi thông báo'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* ── Cột phải: Preview + Hướng dẫn ── */}
                <Col xs={24} lg={9}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>

                        {/* Preview */}
                        {preview?.title && (
                            <Card
                                title={
                                    <Space>
                                        <BellOutlined style={{ color: '#e53935' }} />
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>Preview thông báo</span>
                                    </Space>
                                }
                                style={cardStyle}
                            >
                                <div style={{
                                    background: '#F0F0F5',
                                    borderRadius: 12,
                                    padding: 16,
                                    border: '1px solid #E0E0E0',
                                }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <img
                                            src="/icon.png"
                                            alt="Logo"
                                            style={{
                                                width: 70,
                                                height: 70,
                                                borderRadius: 20,
                                                objectFit: 'cover',
                                                flexShrink: 0,
                                                background: '#FFFFFF',
                                                border: '1px solid #E0E0E0',
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
                                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 5, color: '#1A1A2E' }}>
                                                {preview.title}
                                            </div>
                                            {preview.content && (
                                                <div style={{
                                                    fontSize: 13,
                                                    color: '#595959',
                                                    lineHeight: 1.5,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    marginTop: 4,
                                                }}>
                                                    {preview.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 12, color: '#8c8c8c', textAlign: 'center' }}>
                                    Giao diện minh hoạ trên thiết bị di động
                                </div>
                            </Card>
                        )}

                        {/* Hướng dẫn */}
                        <Card
                            title={
                                <Space>
                                    <GlobalOutlined />
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>Hướng dẫn gửi thông báo</span>
                                </Space>
                            }
                            style={cardStyle}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {DESTINATION_OPTIONS.map((opt) => (
                                    <div
                                        key={opt.value}
                                        style={{
                                            padding: '10px 12px', borderRadius: 8,
                                            background: `${opt.color}08`,
                                            border: `1px solid ${opt.color}20`,
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: opt.color, fontSize: 13 }}>
                                            {opt.label}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#595959', marginTop: 3 }}>
                                            {opt.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    )
}
