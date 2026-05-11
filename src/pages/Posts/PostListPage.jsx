import { useState, useEffect } from 'react'
import {
    Table, Card, Input, Select, Button,
    Avatar, Tag, App, Popconfirm, Tooltip,
    Image, Space, Alert,
} from 'antd'
import {
    SearchOutlined, EyeOutlined, DeleteOutlined,
    EyeInvisibleOutlined, FileTextOutlined,
    ExclamationCircleOutlined, UserOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import postApi from '../../api/postApi'
import PageHeader from '../../components/common/PageHeader'
import StatusTag from '../../components/common/StatusTag'
import { formatDateTime } from '../../utils/helpers'
import { PAGE_SIZE_DEFAULT, BLOOD_TYPES } from '../../constants'

const BLOOD_COLORS = {
    'A+': '#e53935', 'A-': '#ef5350',
    'B+': '#1e88e5', 'B-': '#42a5f5',
    'AB+': '#8e24aa', 'AB-': '#ab47bc',
    'O+': '#43a047', 'O-': '#66bb6a',
}

const STATUS_CHIPS = [
    { label: 'Tất cả', value: '', color: '#8e24aa', emoji: '📋' },
    { label: 'Đang tìm', value: 'finding', color: '#1e88e5', emoji: '🔍' },
    { label: 'Đủ người', value: 'enough', color: '#faad14', emoji: '👥' },
    { label: 'Hoàn thành', value: 'completed', color: '#52c41a', emoji: '✅' },
    { label: 'Đã huỷ', value: 'cancelled', color: '#8c8c8c', emoji: '❌' },
    { label: 'Đã ẩn', value: 'hidden', color: '#e53935', emoji: '🚫' },
]

export default function PostListPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()

    const [filters, setFilters] = useState({
        status: '',
        bloodType: '',
        search: '',
        page: 1,
        pageSize: PAGE_SIZE_DEFAULT,
    });
    const [searchInput, setSearchInput] = useState('');
    const [selectedIds, setSelectedIds] = useState([])

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: res, isLoading } = useQuery({
        queryKey: ['posts-admin', filters],
        queryFn: () =>
            postApi.getAllForAdmin({
                status: filters.status || undefined,
                bloodType: filters.bloodType || undefined,
                search: filters.search || undefined,
                page: filters.page,
                pageSize: filters.pageSize,
            }),
    });

    const posts = res?.data?.items ?? []
    const total = res?.data?.totalCount ?? 0

    // ── Single actions ─────────────────────────────────────────────────────────
    const { mutate: hidePost, isPending: hiding } = useMutation({
        mutationFn: (id) => postApi.hide(id),
        onSuccess: () => {
            message.success('Đã ẩn bài đăng')
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const { mutate: unhidePost, isPending: unhiding } = useMutation({
        mutationFn: (id) => postApi.unhide(id),
        onSuccess: () => {
            message.success('Đã hiện lại bài đăng')
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Thao tác thất bại'),
    })

    const { mutate: deletePost, isPending: deleting } = useMutation({
        mutationFn: (id) => postApi.delete(id),
        onSuccess: () => {
            message.success('Đã xoá bài đăng')
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Xoá thất bại'),
    })

    // ── [UPDATED] Bulk actions — dùng API thay vì loop ─────────────────────────
    const { mutate: hideManyPosts, isPending: hidingMany } = useMutation({
        mutationFn: (ids) => postApi.hideMany(ids),
        onSuccess: (res) => {
            const count = res?.data?.succeeded ?? selectedIds.length
            message.success(`Đã ẩn ${count} bài đăng`)
            setSelectedIds([])
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Ẩn thất bại'),
    })

    const { mutate: unhideManyPosts, isPending: unhidingMany } = useMutation({
        mutationFn: (ids) => postApi.unhideMany(ids),
        onSuccess: (res) => {
            const count = res?.data?.succeeded ?? selectedIds.length
            message.success(`Đã hiện lại ${count} bài đăng`)
            setSelectedIds([])
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Hiện thất bại'),
    })

    const { mutate: deleteManyPosts, isPending: deletingMany } = useMutation({
        mutationFn: (ids) => postApi.deleteMany(ids),
        onSuccess: (res, variables) => {
            const succeeded = res?.data?.succeeded ?? 0;
            const selectedCount = variables.length;
            const skipped = selectedCount - succeeded;

            if (succeeded === 0 && selectedCount > 0) {
                modal.warning({
                    title: 'Không thể xoá',
                    content: 'Tất cả bài đăng đã chọn đều đã có người hiến máu, không thể xoá.',
                });
            } else if (skipped > 0) {
                modal.success({
                    title: 'Đã xoá một phần',
                    content: `Đã xoá ${succeeded} bài đăng. ${skipped} bài không thể xoá vì đã có người hiến máu.`,
                });
            } else {
                message.success(`Đã xoá ${succeeded} bài đăng`);
            }
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] });
        },
        onError: (err) => message.error(err?.message || 'Xoá thất bại'),
    });

    // ── [NEW] Hide all / Unhide all theo filter ────────────────────────────────
    const { mutate: hideAllPosts, isPending: hidingAll } = useMutation({
        mutationFn: (params) => postApi.hideAll(params),
        onSuccess: (res) => {
            const count = res?.data?.succeeded ?? 0
            message.success(`Đã ẩn ${count} bài đăng`)
            setSelectedIds([])
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Ẩn thất bại'),
    })

    const { mutate: unhideAllPosts, isPending: unhidingAll } = useMutation({
        mutationFn: (params) => postApi.unhideAll(params),
        onSuccess: (res) => {
            const count = res?.data?.succeeded ?? 0
            message.success(`Đã hiện lại ${count} bài đăng`)
            setSelectedIds([])
            queryClient.invalidateQueries({ queryKey: ['posts-admin'] })
        },
        onError: (err) => message.error(err?.message || 'Hiện thất bại'),
    })

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleHide = (record) => {
        modal.confirm({
            title: 'Ẩn bài đăng?',
            content: `Bài đăng của "${record.postedByName}" sẽ bị ẩn khỏi danh sách công khai.`,
            okText: 'Ẩn bài', okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => hidePost(record.id),
        })
    }

    const handleDeleteMany = () => {
        modal.confirm({
            title: `Xoá ${selectedIds.length} bài đăng?`,
            icon: <ExclamationCircleOutlined style={{ color: '#e53935' }} />,
            content: 'Hành động này không thể hoàn tác.',
            okText: `Xoá ${selectedIds.length} bài`, okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => deleteManyPosts(selectedIds),
        })
    }

    // [FIXED] Lookup từ `posts` thay vì `filtered` để tránh mất data khi search
    const handleHideMany = () => {
        const visibleIds = selectedIds.filter((id) => {
            const post = posts.find((p) => p.id === id)
            return post?.status !== 'hidden'
        })

        if (visibleIds.length === 0) {
            message.warning('Tất cả bài đăng đã chọn đều đang bị ẩn rồi')
            return
        }

        modal.confirm({
            title: `Ẩn ${visibleIds.length} bài đăng?`,
            icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
            content: visibleIds.length < selectedIds.length
                ? `${selectedIds.length - visibleIds.length} bài đã ẩn sẽ được bỏ qua.`
                : 'Các bài đăng sẽ bị ẩn khỏi danh sách công khai.',
            okText: `Ẩn ${visibleIds.length} bài`, okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => hideManyPosts(visibleIds),
        })
    }

    // [FIXED] Lookup từ `posts` thay vì `filtered`
    const handleUnhideMany = () => {
        const hiddenIds = selectedIds.filter((id) => {
            const post = posts.find((p) => p.id === id)
            return post?.status === 'hidden'
        })

        if (hiddenIds.length === 0) {
            message.warning('Không có bài nào đang bị ẩn trong danh sách đã chọn')
            return
        }

        modal.confirm({
            title: `Hiện lại ${hiddenIds.length} bài đăng?`,
            content: hiddenIds.length < selectedIds.length
                ? `${selectedIds.length - hiddenIds.length} bài không bị ẩn sẽ được bỏ qua.`
                : 'Các bài đăng sẽ được khôi phục về trạng thái trước khi ẩn.',
            okText: `Hiện ${hiddenIds.length} bài`,
            cancelText: 'Huỷ',
            onOk: () => unhideManyPosts(hiddenIds),
        })
    }

    // [NEW] Ẩn tất cả theo filter hiện tại
    const handleHideAll = () => {
        const statusLabel = STATUS_CHIPS.find((c) => c.value === filters.status)?.label
        modal.confirm({
            title: `Ẩn tất cả ${total} bài đăng${filters.status ? ` (${statusLabel})` : ''}?`,
            icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
            content: (
                <div>
                    <p style={{ marginBottom: 6 }}>
                        Các bài đăng chưa ẩn sẽ bị ẩn khỏi danh sách công khai.
                    </p>
                    {filters.status === '' && (
                        <p style={{ color: '#d46b08', fontWeight: 600, marginBottom: 6 }}>
                            Các bài đã ẩn sẽ được bỏ qua.
                        </p>
                    )}
                    <p style={{ color: '#d46b08', fontWeight: 600, margin: 0 }}>
                        ⚠️ Áp dụng cho toàn bộ dữ liệu, không chỉ trang hiện tại!
                    </p>
                </div>
            ),
            okText: `Ẩn tất cả ${total} bài`,
            okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => hideAllPosts({
                bloodType: filters.bloodType || undefined,
                status: filters.status || undefined,
            }),
        })
    }

    // [NEW] Hiện tất cả bài đang ẩn theo filter
    const handleUnhideAll = () => {
        modal.confirm({
            title: `Hiện lại tất cả ${total} bài đăng?`,
            icon: <ExclamationCircleOutlined style={{ color: '#52c41a' }} />,
            content: (
                <div>
                    <p style={{ marginBottom: 6 }}>
                        Các bài đang ẩn sẽ được khôi phục về trạng thái trước khi ẩn.
                    </p>
                    {filters.status === '' && (
                        <p style={{ color: '#d46b08', fontWeight: 600, marginBottom: 6 }}>
                            Các bài không bị ẩn sẽ được bỏ qua.
                        </p>
                    )}
                    <p style={{ color: '#d46b08', fontWeight: 600, margin: 0 }}>
                        ⚠️ Áp dụng cho toàn bộ dữ liệu, không chỉ trang hiện tại!
                    </p>
                </div>
            ),
            okText: `Hiện lại tất cả ${total} bài`,
            cancelText: 'Huỷ',
            onOk: () => unhideAllPosts({
                bloodType: filters.bloodType || undefined,
            }),
        })
    }

    const rowSelection = {
        selectedRowKeys: selectedIds,
        onChange: (keys) => setSelectedIds(keys),
        preserveSelectedRowKeys: false,
    }

    const columns = [
        {
            title: 'Bài đăng',
            key: 'post',
            width: 300,
            render: (_, r) => (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {r.images?.[0] ? (
                        <Image
                            src={r.images[0]}
                            width={44} height={44}
                            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                            preview={false}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII="
                        />
                    ) : (
                        <div style={{
                            width: 44, height: 44, borderRadius: 8, background: '#f5f5f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <FileTextOutlined style={{ color: '#bbb', fontSize: 18 }} />
                        </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>
                            {'Bệnh nhân ' + r.patientName}
                        </div>
                        <div style={{
                            fontSize: 12, color: '#8c8c8c', marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200,
                        }}>
                            {r.hospitalName}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Người đăng',
            key: 'poster',
            width: 190,
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar
                        src={r.postedByAvatar || undefined}
                        icon={<UserOutlined />}
                        size={28}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            flexShrink: 0,
                            fontSize: 12,
                        }}
                    />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                            {r.postedByName}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>@{r.postedByUsername}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Nhóm máu',
            align: 'center',
            dataIndex: 'bloodType',
            width: 100,
            render: (v) => (
                <Tag color={BLOOD_COLORS[v] ?? 'default'} style={{ fontWeight: 700, fontSize: 13 }}>
                    {v}
                </Tag>
            ),
        },
        {
            title: 'Máu (ml)',
            key: 'blood',
            width: 120,
            align: 'center',
            render: (_, r) => (
                <div style={{ fontSize: 13 }}>
                    <span style={{ color: '#e53935', fontWeight: 600 }}>{r.registeredBloodVolume}</span>
                    <span style={{ color: '#bbb' }}> / {r.requiredBloodVolume}</span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            align: 'center',
            dataIndex: 'status',
            width: 120,
            render: (v) => <StatusTag type="post" status={v} />,
        },
        {
            title: 'Ngày đăng',
            align: 'center',
            dataIndex: 'createdAt',
            width: 140,
            render: (v) => (
                <span style={{ fontSize: 12, color: '#595959' }}>{formatDateTime(v)}</span>
            ),
        },
        {
            title: 'Thao tác',
            align: 'center',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, r) => (
                <Space size={2}>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" size="small" icon={<EyeOutlined />}
                            style={{ color: '#1e88e5' }}
                            onClick={() => navigate(`/posts/${r.id}`)}
                        />
                    </Tooltip>
                    {r.status !== 'hidden' ? (
                        <Tooltip title="Ẩn bài">
                            <Button type="text" size="small"
                                icon={<EyeInvisibleOutlined style={{ color: '#faad14' }} />}
                                onClick={() => handleHide(r)} loading={hiding}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip title="Hiện lại bài">
                            <Button type="text" size="small"
                                icon={<EyeOutlined style={{ color: '#52c41a' }} />}
                                onClick={() => unhidePost(r.id)} loading={unhiding}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Xoá vĩnh viễn">
                        <Popconfirm
                            title="Xoá bài đăng?"
                            description="Hành động này không thể hoàn tác."
                            okText="Xoá" okButtonProps={{ danger: true }}
                            cancelText="Huỷ"
                            onConfirm={() => deletePost(r.id)}
                        >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} loading={deleting} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <PageHeader
                title="Quản lý bài đăng"
                subtitle="Theo dõi và kiểm duyệt các bài đăng tìm người hiến máu"
            />

            {/* Status chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {STATUS_CHIPS.map((chip) => {
                    const active = filters.status === chip.value
                    return (
                        <button
                            key={chip.value}
                            onClick={() => {
                                setSelectedIds([])
                                setFilters((f) => ({ ...f, status: chip.value, page: 1 }))
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                border: active ? `2px solid ${chip.color}` : '2px solid transparent',
                                background: active ? `${chip.color}12` : '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                transition: 'all 0.15s',
                                outline: 'none',
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
                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Input
                        placeholder="Tìm theo tên bệnh nhân, người đăng, bệnh viện, số điện thoại"
                        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        allowClear
                        style={{ flex: '1 1 200px' }}
                    />
                    <Select
                        value={filters.bloodType}
                        onChange={(v) => {
                            setSelectedIds([])
                            setFilters((f) => ({ ...f, bloodType: v, page: 1 }))
                        }}
                        style={{ width: 180 }}
                        placeholder="Nhóm máu"
                        options={[
                            { label: 'Tất cả nhóm máu', value: '' },
                            ...BLOOD_TYPES.map((b) => ({
                                label: (
                                    <span>
                                        <Tag color={BLOOD_COLORS[b]} style={{ marginRight: 4, fontWeight: 700 }}>{b}</Tag>
                                    </span>
                                ),
                                value: b,
                            })),
                        ]}
                    />
                </div>

                {/* ── Thanh action khi có row được chọn ── */}
                {selectedIds.length > 0 && (
                    <Alert
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        type="warning"
                        showIcon={false}
                        message={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#d46b08' }}>
                                    Đã chọn <strong>{selectedIds.length}</strong> bài đăng
                                </span>
                                <Button
                                    size="small"
                                    icon={<EyeInvisibleOutlined />}
                                    loading={hidingMany}
                                    onClick={handleHideMany}
                                    style={{ borderColor: '#faad14', color: '#faad14' }}
                                >
                                    Ẩn {selectedIds.length} bài
                                </Button>
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    loading={unhidingMany}
                                    onClick={handleUnhideMany}
                                    style={{ borderColor: '#52c41a', color: '#52c41a' }}
                                >
                                    Hiện lại {selectedIds.length} bài
                                </Button>
                                <Button
                                    danger size="small"
                                    icon={<DeleteOutlined />}
                                    loading={deletingMany}
                                    onClick={handleDeleteMany}
                                >
                                    Xoá {selectedIds.length} bài
                                </Button>
                                <Button size="small" onClick={() => setSelectedIds([])}>
                                    Bỏ chọn
                                </Button>
                            </div>
                        }
                    />
                )}

                {/* ── [NEW] Nút ẩn / hiện tất cả theo filter ── */}
                {total > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        {/* Ẩn tất cả: tất cả tab TRỪ tab "Đã ẩn" */}
                        {filters.status !== 'hidden' && (
                            <Button
                                size="small"
                                icon={<EyeInvisibleOutlined />}
                                loading={hidingAll}
                                onClick={handleHideAll}
                                style={{ borderColor: '#faad14', color: '#faad14' }}
                            >
                                Ẩn tất cả {total} bài
                                {filters.status
                                    ? ` (${STATUS_CHIPS.find((c) => c.value === filters.status)?.label})`
                                    : ''}
                            </Button>
                        )}
                        {/* Hiện tất cả: tab "Tất cả" VÀ tab "Đã ẩn" */}
                        {(filters.status === '' || filters.status === 'hidden') && (
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                loading={unhidingAll}
                                onClick={handleUnhideAll}
                                style={{ borderColor: '#52c41a', color: '#52c41a' }}
                            >
                                Hiện lại tất cả {total} bài
                                {filters.status === 'hidden' ? ' (đã ẩn)' : ''}
                            </Button>
                        )}
                    </div>
                )}

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={posts}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    rowClassName={(r) => r.status === 'hidden' ? 'row-hidden' : ''}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (t) => `Tổng ${t} bài đăng`,
                        onChange: (page, pageSize) => {
                            setSelectedIds([]) // clear selection khi đổi trang
                            setFilters((f) => ({ ...f, page, pageSize }))
                        },
                    }}
                    scroll={{ x: 900 }}
                />
            </Card>

            <style>{`
                .row-hidden td { opacity: 0.45; background: #fafafa; }
                .row-hidden:hover td { opacity: 0.75; }
            `}</style>
        </div>
    )
}