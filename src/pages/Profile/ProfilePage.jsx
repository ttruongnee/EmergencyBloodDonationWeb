import { useState } from 'react'
import {
    Card, Row, Col, Avatar, Button, Form,
    Input, Tag, Descriptions, Divider, App,
    Spin, Space, Modal, Image
} from 'antd'
import {
    UserOutlined, LockOutlined,
    EditOutlined, SaveOutlined,
    CloseOutlined, KeyOutlined,
    CameraOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import accountApi from '../../api/accountApi'
import authApi from '../../api/authApi'
import uploadApi from '../../api/uploadApi'
import useAuthStore from '../../store/authStore'
import PageHeader from '../../components/common/PageHeader'
import { formatDateTime } from '../../utils/helpers'

const cardStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

function decodeJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch {
        return null
    }
}

export default function ProfilePage() {
    const { message } = App.useApp()
    const queryClient = useQueryClient()
    const accessToken = useAuthStore((s) => s.accessToken)
    const accountId = decodeJwt(accessToken)?.accountId ?? null

    const [pwForm] = Form.useForm()
    const [editForm] = Form.useForm()
    const [editOpen, setEditOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [previewAvatar, setPreviewAvatar] = useState(null)

    // ── Fetch account ──────────────────────────────────────────────────────────
    const { data: res, isLoading } = useQuery({
        queryKey: ['my-account', accountId],
        queryFn: () => accountApi.getById(accountId),
        enabled: !!accountId,
    })
    const account = res?.data ?? null

    // ── Mutation: đổi mật khẩu ────────────────────────────────────────────────
    const { mutate: changePassword, isPending: changingPw } = useMutation({
        mutationFn: (data) => authApi.changePassword(data),
        onSuccess: () => {
            message.success('Đổi mật khẩu thành công!')
            pwForm.resetFields()
        },
        onError: (err) => message.error(err?.message || 'Đổi mật khẩu thất bại'),
    })

    // ── Mutation: cập nhật profile ────────────────────────────────────────────
    const { mutate: updateProfile, isPending: savingProfile } = useMutation({
        mutationFn: (data) => accountApi.updateProfile(accountId, data),
        onSuccess: () => {
            message.success('Cập nhật thông tin thành công!')
            queryClient.invalidateQueries({ queryKey: ['my-account', accountId] })
            setEditOpen(false)
        },
        onError: (err) => message.error(err?.message || 'Cập nhật thất bại'),
    })

    // ── Upload avatar ──────────────────────────────────────────────────────────
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            message.error('Ảnh không được vượt quá 5MB')
            return
        }
        setUploading(true)
        try {
            const uploadRes = await uploadApi.uploadImage(file)
            const avatarUrl = uploadRes.data
            await accountApi.updateProfile(accountId, { avatar: avatarUrl })
            message.success('Cập nhật ảnh đại diện thành công!')
            queryClient.invalidateQueries({ queryKey: ['my-account', accountId] })
        } catch (err) {
            message.error(err?.message || 'Upload thất bại')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleOpenEdit = () => {
        editForm.setFieldsValue({
            name: account?.name,
            email: account?.email,
            phone: account?.phone,
        })
        setEditOpen(true)
    }

    const handleChangePw = (values) => {
        changePassword({
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
        })
    }

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: 120 }}>
            <Spin size="large" />
        </div>
    )

    return (
        <div>
            <PageHeader
                title="Hồ sơ cá nhân"
                subtitle="Quản lý thông tin và bảo mật tài khoản"
            />

            <Row gutter={[16, 16]}>

                {/* ── Cột trái: Avatar + info nhanh ── */}
                <Col xs={24} lg={7}>
                    <Card style={cardStyle}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
                                <div
                                    onClick={() => {
                                        if (account?.avatar) setPreviewAvatar(account.avatar)
                                    }}
                                    style={{ cursor: account?.avatar ? 'pointer' : 'default' }}
                                >
                                    <Avatar
                                        src={account?.avatar}
                                        icon={<UserOutlined />}
                                        size={116}
                                        style={{
                                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                            fontSize: 36,
                                            border: '4px solid #fff',
                                            boxShadow: '0 4px 16px rgba(229,57,53,0.25)',
                                        }}
                                    />
                                </div>
                                <label
                                    htmlFor="avatar-upload"
                                    style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: uploading ? '#ccc' : '#e53935',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #fff',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {uploading
                                        ? <Spin size="small" style={{ transform: 'scale(0.7)' }} />
                                        : <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
                                    }
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
                                {account?.name ?? '—'}
                            </div>
                            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                                @{account?.username ?? '—'}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                <Tag color="red" style={{ fontWeight: 600 }}> Quản trị viên</Tag>
                                <Tag color="success">Hoạt động</Tag>
                            </div>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        <div style={{ padding: '0 4px' }}>
                            <InfoRow label="Email" value={account?.email} placeholder="Chưa cập nhật" />
                            <InfoRow label="SĐT" value={account?.phone} placeholder="Chưa cập nhật" />
                            <InfoRow label="Tham gia" value={formatDateTime(account?.createdAt)} />
                        </div>

                        <Button
                            block
                            icon={<EditOutlined />}
                            onClick={handleOpenEdit}
                            style={{ marginTop: 16, borderColor: '#e53935', color: '#e53935' }}
                        >
                            Chỉnh sửa thông tin
                        </Button>
                    </Card>
                </Col>

                {/* ── Cột phải: Thông tin chi tiết + Đổi mật khẩu ── */}
                <Col xs={24} lg={17}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>

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
                                <Descriptions.Item label="Tên đăng nhập">
                                    {account?.username ?? '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Họ tên">
                                    {account?.name ?? '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    {account?.email
                                        ? <a href={`mailto:${account.email}`}>{account.email}</a>
                                        : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                                    }
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">
                                    {account?.phone
                                        || <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Vai trò">
                                    <Tag color="red">Quản trị viên</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color="success">Hoạt động</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">
                                    {formatDateTime(account?.createdAt)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cập nhật lần cuối">
                                    {account?.updatedAt
                                        ? formatDateTime(account.updatedAt)
                                        : <span style={{ color: '#bbb' }}>—</span>
                                    }
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* Đổi mật khẩu */}
                        <Card
                            title={
                                <Space>
                                    <span style={{ fontWeight: 700 }}>Đổi mật khẩu</span>
                                </Space>
                            }
                            style={cardStyle}
                        >


                            <Form
                                form={pwForm}
                                layout="vertical"
                                onFinish={handleChangePw}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            label={<span style={{ fontWeight: 600 }}>Mật khẩu hiện tại</span>}
                                            name="oldPassword"
                                            rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                                                placeholder="Mật khẩu hiện tại"
                                                size="large"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            label={<span style={{ fontWeight: 600 }}>Mật khẩu mới</span>}
                                            name="newPassword"
                                            rules={[
                                                { required: true, message: 'Nhập mật khẩu mới' },
                                                { min: 6, message: 'Tối thiểu 6 ký tự' },
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                                                placeholder="Mật khẩu mới"
                                                size="large"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Form.Item
                                            label={<span style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới</span>}
                                            name="confirmPassword"
                                            dependencies={['newPassword']}
                                            rules={[
                                                { required: true, message: 'Xác nhận mật khẩu mới' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('newPassword') === value) {
                                                            return Promise.resolve()
                                                        }
                                                        return Promise.reject('Mật khẩu xác nhận không khớp')
                                                    },
                                                }),
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined style={{ color: '#bbb' }} />}
                                                placeholder="Nhập lại mật khẩu mới"
                                                size="large"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={changingPw}
                                        size="large"
                                        style={{
                                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                            border: 'none', fontWeight: 600,
                                        }}
                                    >
                                        Lưu mật khẩu
                                    </Button>
                                    <Button
                                        size="large"
                                        icon={<CloseOutlined />}
                                        onClick={() => pwForm.resetFields()}
                                    >
                                        Nhập lại
                                    </Button>
                                </div>
                            </Form>
                        </Card>

                    </Space>
                </Col>
            </Row>

            {/* ── Modal chỉnh sửa thông tin ── */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: '#e53935' }} />
                        <span style={{ fontWeight: 700 }}>Chỉnh sửa thông tin</span>
                    </Space>
                }
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                footer={null}
                width={480}
                destroyOnClose
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={(values) => updateProfile(values)}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Họ tên</span>}
                        name="name"
                        rules={[{ required: true, message: 'Nhập họ tên' }]}
                    >
                        <Input size="large" placeholder="Họ và tên" />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Email</span>}
                        name="email"
                        normalize={(value) => value?.trim()}
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input size="large" placeholder="example@email.com" />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Số điện thoại</span>}
                        name="phone"
                    >
                        <Input size="large" placeholder="0xxxxxxxxx" />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <Button onClick={() => setEditOpen(false)}>Huỷ</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={savingProfile}
                            style={{
                                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                border: 'none', fontWeight: 600,
                            }}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>
            <Modal
                open={!!previewAvatar}
                footer={null}
                onCancel={() => setPreviewAvatar(null)}
                width={600}
                centered
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

function InfoRow({ label, value, placeholder }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            gap: 10, padding: '8px 0',
            borderBottom: '1px solid #f5f5f5',
        }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', width: 70, flexShrink: 0 }}>
                {label}
            </div>
            <div style={{
                fontSize: 13, fontWeight: 500,
                color: value ? '#1a1a2e' : '#bbb',
                flex: 1, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {value || placeholder || '—'}
            </div>
        </div>
    )
}