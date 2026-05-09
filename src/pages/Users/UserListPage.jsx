import { useState } from 'react'
import {
    Table, Card, Input, Space, Button, Avatar, App, Tooltip, Modal, Form
} from 'antd'
import {
    SearchOutlined, UserOutlined,
    StopOutlined, CheckCircleOutlined,
    EyeOutlined, PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import accountApi from '../../api/accountApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDateTime } from '../../utils/helpers'
import { PAGE_SIZE_DEFAULT } from '../../constants'

export default function UserListPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()
    const [adminForm] = Form.useForm()

    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        pageSize: PAGE_SIZE_DEFAULT,
    })
    const [search, setSearch] = useState('')
    const [adminModalOpen, setAdminModalOpen] = useState(false)

    const { data: res, isLoading } = useQuery({
        queryKey: ['accounts', filters],
        queryFn: () =>
            accountApi.getAll({
                role: 'user',
                status: filters.status || undefined,
                page: filters.page,
                pageSize: filters.pageSize,
            }),
    })

    const accounts = res?.data?.items ?? []
    const total = res?.data?.totalCount ?? 0

    // Mutation cập nhật trạng thái (khoá/mở khoá)
    const { mutate: updateStatus, isPending: updating } = useMutation({
        mutationFn: ({ id, status }) => accountApi.updateStatus(id, status),
        onSuccess: (_, { status }) => {
            message.success(status === 'banned' ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    // Mutation tạo admin mới
    const { mutate: createAdminMutate, isPending: creatingAdmin } = useMutation({
        mutationFn: (data) => accountApi.createAdmin(data),
        onSuccess: () => {
            message.success('Tạo tài khoản admin thành công, mật khẩu đã gửi qua email')
            setAdminModalOpen(false)
            adminForm.resetFields()
            // Không cần invalidate vì không ảnh hưởng danh sách user
        },
        onError: (err) => message.error(err?.message || 'Tạo thất bại'),
    })

    const handleToggleStatus = (record) => {
        const isBanned = record.status === 'banned'
        modal.confirm({
            title: isBanned ? 'Mở khoá tài khoản?' : 'Khoá tài khoản?',
            content: isBanned
                ? `Tài khoản "${record.name}" sẽ được mở khoá.`
                : `Tài khoản "${record.name}" sẽ bị khoá, không thể đăng nhập.`,
            okText: isBanned ? 'Mở khoá' : 'Khoá',
            okButtonProps: { danger: !isBanned },
            cancelText: 'Huỷ',
            onOk: () => updateStatus({ id: record.id, status: isBanned ? 'active' : 'banned' }),
        })
    }

    const filtered = accounts.filter((a) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
            a.name?.toLowerCase().includes(q) ||
            a.username?.toLowerCase().includes(q) ||
            a.email?.toLowerCase().includes(q) ||
            a.phone?.includes(q)
        )
    })

    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            minWidth: 220,
            render: (_, r) => (
                <Space>
                    <Avatar
                        src={r.avatar}
                        icon={<UserOutlined />}
                        size={40}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            flexShrink: 0,
                        }}
                    />
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
                            {r.name}
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                            @{r.username}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            render: (v) => (
                <span style={{ color: v ? '#1a1a2e' : '#bbb' }}>{v || '—'}</span>
            ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            render: (v) => (
                <span style={{ color: v ? '#1a1a2e' : '#bbb' }}>{v || '—'}</span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 130,
            render: (v) => <StatusTag type="account" status={v} />,
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'createdAt',
            width: 160,
            render: (v) => (
                <span style={{ color: '#595959', fontSize: 13 }}>
                    {formatDateTime(v)}
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/users/${r.id}`)}
                            style={{ color: '#1e88e5' }}
                        />
                    </Tooltip>

                    <Tooltip title={r.status === 'banned' ? 'Mở khoá' : 'Khoá tài khoản'}>
                        <Button
                            type="text"
                            size="small"
                            icon={
                                r.status === 'banned'
                                    ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    : <StopOutlined style={{ color: '#faad14' }} />
                            }
                            onClick={() => handleToggleStatus(r)}
                            loading={updating}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <PageHeader
                title="Quản lý người dùng"
                subtitle="Xem, khoá và quản lý tài khoản người dùng trong hệ thống"
                extra={[
                    <Button
                        key="create-admin"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAdminModalOpen(true)}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            border: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Thêm Admin
                    </Button>
                ]}
            />

            {/* Chip filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { label: 'Tất cả', value: '', emoji: '👥' },
                    { label: 'Hoạt động', value: 'active', emoji: '✅' },
                    { label: 'Đã khoá', value: 'banned', emoji: '🔒' },
                ].map((chip) => {
                    const active = filters.status === chip.value
                    const color = chip.value === 'banned' ? '#e53935' : chip.value === 'active' ? '#52c41a' : '#1e88e5'
                    return (
                        <button
                            key={chip.value}
                            onClick={() => setFilters((f) => ({ ...f, status: chip.value, page: 1 }))}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                border: active ? `2px solid ${color}` : '2px solid transparent',
                                background: active ? `${color}12` : '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                transition: 'all 0.15s', outline: 'none',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{chip.emoji}</span>
                            <span style={{ fontWeight: active ? 700 : 500, color: active ? color : '#595959', fontSize: 13 }}>
                                {chip.label}
                            </span>
                            {active && total > 0 && (
                                <span style={{
                                    background: color, color: '#fff',
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
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Input
                        placeholder="Tìm theo tên, username, email, SĐT..."
                        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                        style={{ width: 320, flex: '1 1 240px' }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    rowClassName={(r) => r.status === 'banned' ? 'row-banned' : ''}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (t) => `Tổng ${t} tài khoản`,
                        onChange: (page, pageSize) => setFilters((f) => ({ ...f, page, pageSize })),
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>

            {/* Modal tạo admin */}
            <Modal
                title="Tạo tài khoản Admin"
                open={adminModalOpen}
                onCancel={() => {
                    setAdminModalOpen(false)
                    adminForm.resetFields()
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={adminForm}
                    layout="vertical"
                    onFinish={(values) => createAdminMutate(values)}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        normalize={(value) => value?.trim()}
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                            { min: 4, message: 'Tối thiểu 4 ký tự' },
                        ]}
                    >
                        <Input placeholder="Nhập tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        normalize={(value) => value?.trim()}
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input placeholder="Nhập địa chỉ email" />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button onClick={() => {
                            setAdminModalOpen(false)
                            adminForm.resetFields()
                        }}>
                            Huỷ
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={creatingAdmin}
                            style={{
                                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                border: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Tạo Admin
                        </Button>
                    </div>
                </Form>
            </Modal>

            <style>{`
    .row-banned td { background: #fff5f5 !important; color: #999 !important; }
    .row-banned:hover td { background: #ffe8e8 !important; }
            `}</style>
        </div>
    )
}