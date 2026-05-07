import { useState, useEffect } from 'react'
import {
    Table, Card, Input, Button, Space,
    Modal, Form, App, Tooltip, Popconfirm,
    Tag, Select, Row, Col, Descriptions, Drawer, Dropdown, Alert,
} from 'antd'
import {
    SearchOutlined, PlusOutlined, EditOutlined,
    DeleteOutlined, EnvironmentOutlined, BankOutlined,
    EyeOutlined, ClearOutlined, UploadOutlined, DownloadOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { normalizeArea } from '../../utils/normalizeArea'
import hospitalApi from '../../api/hospitalApi'
import mapApi from '../../api/mapApi'
import PageHeader from '../../components/common/PageHeader'
import { useAreaPicker } from '../../hooks/useAreaPicker'
import * as XLSX from 'xlsx'

const cardStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

function openMap(lat, lng) {
    window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        '_blank'
    )
}

const matchOption = (options = [], name = '') => {
    if (!name) return null
    return options.find(o => o.label === name) ?? null
}

export default function HospitalListPage() {
    const queryClient = useQueryClient()
    const { message, modal } = App.useApp()

    // ── Filter state ───────────────────────────────────────────────────────────
    const [nameSearch, setNameSearch] = useState('')
    const [filters, setFilters] = useState({ page: 1, pageSize: 10 })
    const filterArea = useAreaPicker()

    // ── Selection state ────────────────────────────────────────────────────────
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    // ── Drawer chi tiết ────────────────────────────────────────────────────────
    const [detailRecord, setDetailRecord] = useState(null)

    // ── Modal tạo / sửa ────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false)
    const [editRecord, setEditRecord] = useState(null)
    const [form] = Form.useForm()
    const formArea = useAreaPicker()

    // ── Map link state ─────────────────────────────────────────────────────────
    const [mapLink, setMapLink] = useState('')
    const [resolving, setResolving] = useState(false)

    // ── Import/Export state ────────────────────────────────────────────────────
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)

    const [pendingWard, setPendingWard] = useState(null)
    useEffect(() => {
        if (!pendingWard || formArea.districtOptions.length === 0) return
        const wOpt = formArea.districtOptions.find(o =>
            normalizeArea(o.label) === pendingWard
        )
        if (wOpt) {
            formArea.onDistrictChange(wOpt.value, wOpt)
            setPendingWard(null)
        }
    }, [formArea.districtOptions, pendingWard])

    const autoSelectArea = async (provinceName, wardName) => {
        if (!provinceName) return
        const pOpt = formArea.provinceOptions.find(o =>
            normalizeArea(o.label) === provinceName
        )
        if (!pOpt) return
        await formArea.onProvinceChange(pOpt.value, pOpt)
        if (wardName) setPendingWard(wardName)
    }

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const { data: res, isLoading } = useQuery({
        queryKey: ['hospitals', filters],
        queryFn: () => hospitalApi.search(filters),
    })

    const hospitals = res?.data?.items ?? []
    const total = res?.data?.totalCount ?? 0

    // ── Mutations ──────────────────────────────────────────────────────────────
    const { mutate: createH, isPending: creating } = useMutation({
        mutationFn: (data) => hospitalApi.create(data),
        onSuccess: () => {
            message.success('Đã thêm bệnh viện')
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
            closeModal()
        },
        onError: (err) => message.error(err?.message || 'Thêm thất bại'),
    })

    const { mutate: updateH, isPending: updating } = useMutation({
        mutationFn: ({ id, data }) => hospitalApi.update(id, data),
        onSuccess: () => {
            message.success('Đã cập nhật bệnh viện')
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
            closeModal()
        },
        onError: (err) => message.error(err?.message || 'Cập nhật thất bại'),
    })

    const { mutate: deleteH, isPending: deleting } = useMutation({
        mutationFn: (id) => hospitalApi.delete(id),
        onSuccess: () => {
            message.success('Đã xoá bệnh viện')
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
            setDetailRecord(null)
        },
        onError: (err) => {
            const raw = err?.message || ''
            if (raw.includes('FK_Post_Hospital') || raw.includes('REFERENCE constraint')) {
                message.error('Bệnh viện đang có bài viết liên kết, không thể xoá')
            } else {
                message.error(raw || 'Xoá thất bại')
            }
        },
    })

    // ── [NEW] Bulk delete (xoá các bệnh viện đã chọn) ─────────────────────────
    const { mutate: bulkDeleteH, isPending: bulkDeleting } = useMutation({
        mutationFn: (ids) => hospitalApi.bulkDelete(ids),
        onSuccess: (res) => {
            const deleted = res?.data?.deleted ?? selectedRowKeys.length
            message.success(`Đã xoá ${deleted} bệnh viện`)
            setSelectedRowKeys([])
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        },
        onError: (err) => {
            const raw = err?.message || ''
            if (raw.includes('FK_Post_Hospital') || raw.includes('REFERENCE constraint')) {
                message.error('Một số bệnh viện đang có bài viết liên kết, không thể xoá')
            } else {
                message.error(raw || 'Xoá thất bại')
            }
        },
    })

    // ── [NEW] Delete all (xoá tất cả theo filter hiện tại) ────────────────────
    const { mutate: deleteAllH, isPending: deletingAll } = useMutation({
        mutationFn: (params) => hospitalApi.deleteAll(params),
        onSuccess: (res) => {
            const deleted = res?.data?.deleted ?? 0
            message.success(`Đã xoá ${deleted} bệnh viện`)
            setSelectedRowKeys([])
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        },
        onError: (err) => {
            const raw = err?.message || ''
            if (raw.includes('FK_Post_Hospital') || raw.includes('REFERENCE constraint')) {
                message.error('Một số bệnh viện đang có bài viết liên kết, không thể xoá')
            } else {
                message.error(raw || 'Xoá thất bại')
            }
        },
    })

    // ── [NEW] Confirm xoá đã chọn ──────────────────────────────────────────────
    const handleBulkDelete = () => {
        modal.confirm({
            title: `Xoá ${selectedRowKeys.length} bệnh viện đã chọn?`,
            icon: <ExclamationCircleOutlined style={{ color: '#e53935' }} />,
            content: 'Các bài đăng liên kết với bệnh viện này có thể bị ảnh hưởng. Không thể hoàn tác.',
            okText: `Xoá ${selectedRowKeys.length} bệnh viện`,
            okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => bulkDeleteH(selectedRowKeys),
        })
    }

    // ── [NEW] Confirm xoá tất cả theo filter ──────────────────────────────────
    const handleDeleteAll = () => {
        const hasFilter = filters.name || filters.province || filters.ward
        const filterDesc = hasFilter
            ? [filters.name && `tên "${filters.name}"`, filters.province, filters.ward]
                .filter(Boolean).join(', ')
            : null

        modal.confirm({
            title: `Xoá tất cả ${total} bệnh viện${filterDesc ? ` (${filterDesc})` : ''}?`,
            icon: <ExclamationCircleOutlined style={{ color: '#e53935' }} />,
            content: (
                <div>
                    <p style={{ marginBottom: 8 }}>
                        {hasFilter
                            ? `Sẽ xoá toàn bộ ${total} bệnh viện khớp với bộ lọc hiện tại.`
                            : `Sẽ xoá toàn bộ ${total} bệnh viện trong hệ thống.`
                        }
                    </p>
                    <p style={{ color: '#e53935', fontWeight: 600, margin: 0 }}>
                        ⚠️ Hành động này không thể hoàn tác!
                    </p>
                </div>
            ),
            okText: `Xác nhận xoá ${total} bệnh viện`,
            okButtonProps: { danger: true },
            cancelText: 'Huỷ',
            onOk: () => deleteAllH({
                name: filters.name,
                province: filters.province,
                ward: filters.ward,
            }),
        })
    }

    // ── Filter helpers ─────────────────────────────────────────────────────────
    const applyFilter = () => {
        setSelectedRowKeys([]) // clear selection khi đổi filter
        setFilters({
            page: 1,
            pageSize: filters.pageSize,
            name: nameSearch || undefined,
            province: filterArea.normalizedProvince || undefined,
            ward: filterArea.normalizedDistrict || undefined,
        })
    }

    const clearFilter = () => {
        setNameSearch('')
        filterArea.reset()
        setSelectedRowKeys([])
        setFilters({ page: 1, pageSize: 10 })
    }

    // ── Modal helpers ──────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditRecord(null)
        form.resetFields()
        formArea.reset()
        setMapLink('')
        setModalOpen(true)
    }

    const openEdit = (record) => {
        setEditRecord(record)
        form.setFieldsValue({
            name: record.name,
            address: record.address,
            website: record.website,
            latitude: record.latitude,
            longitude: record.longitude,
        })
        formArea.reset()
        setMapLink('')
        if (record.province) {
            autoSelectArea(record.province, record.ward)
        }
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditRecord(null)
        form.resetFields()
        formArea.reset()
        setMapLink('')
        setPendingWard(null)
    }

    const handleResolveMap = async () => {
        if (!mapLink.trim()) return
        setResolving(true)
        try {
            const result = await mapApi.resolveCoords(mapLink.trim())
            const { latitude, longitude } = result.data
            form.setFieldsValue({
                latitude: String(latitude),
                longitude: String(longitude),
            })
            message.success(`✅ Toạ độ: ${latitude}, ${longitude}`)
            setMapLink('')
        } catch {
            message.error('Không lấy được toạ độ, kiểm tra lại link')
        } finally {
            setResolving(false)
        }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = (values) => {
        const payload = {
            name: values.name,
            address: values.address || null,
            website: values.website || null,
            latitude: values.latitude || null,
            longitude: values.longitude || null,
            province: formArea.normalizedProvince || null,
            district: null,
            ward: formArea.normalizedDistrict || null,
        }
        editRecord
            ? updateH({ id: editRecord.id, data: payload })
            : createH(payload)
    }

    // ── Export ─────────────────────────────────────────────────────────────────
    const handleExport = async (type) => {
        setExporting(true)
        try {
            const res = await hospitalApi.getAll()
            const data = res?.data ?? []

            const rows = data.map((h) => ({
                name: h.name ?? '',
                province: h.province ?? '',
                ward: h.ward ?? '',
                address: h.address ?? '',
                latitude: h.latitude ?? '',
                longitude: h.longitude ?? '',
                website: h.website ?? '',
            }))

            const ws = XLSX.utils.json_to_sheet(rows)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Bệnh viện')

            if (type === 'xlsx') {
                XLSX.writeFile(wb, 'danh_sach_benh_vien.xlsx')
            } else {
                XLSX.writeFile(wb, 'danh_sach_benh_vien.csv', { bookType: 'csv' })
            }
            message.success(`Xuất file ${type.toUpperCase()} thành công`)
        } catch {
            message.error('Xuất file thất bại')
        } finally {
            setExporting(false)
        }
    }

    // ── Download template ──────────────────────────────────────────────────────
    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([{
            name: 'Bệnh viện Bạch Mai',
            province: 'Hà Nội',
            ward: 'Kim Liên',
            address: 'Số 78 đường Giải Phóng, phường Kim Liên, thành phố Hà Nội',
            latitude: '21.0023228',
            longitude: '105.8410627',
            website: 'https://bachmai.gov.vn',
        }])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_benh_vien.csv', { bookType: 'csv' })
    }

    // ── Import ─────────────────────────────────────────────────────────────────
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ''

        setImporting(true)
        try {
            const buffer = await file.arrayBuffer()
            const wb = XLSX.read(buffer, { type: 'array' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

            const items = rows.map((row) => ({
                name: String(row.name ?? '').trim(),
                province: String(row.province ?? '').trim() || null,
                ward: String(row.ward ?? '').trim() || null,
                address: String(row.address ?? '').trim() || null,
                latitude: String(row.latitude ?? '').trim() || null,
                longitude: String(row.longitude ?? '').trim() || null,
                website: String(row.website ?? '').trim() || null,
            }))

            const res = await hospitalApi.import(items)
            const { added, updated, skipped } = res?.data ?? {}

            modal.success({
                title: 'Nhập file thành công',
                content: (
                    <div style={{ marginTop: 8, lineHeight: 2 }}>
                        <div>✅ Thêm mới: <strong>{added}</strong> bệnh viện</div>
                        <div>🔄 Cập nhật: <strong>{updated}</strong> bệnh viện</div>
                        <div>⏭️ Bỏ qua: <strong>{skipped}</strong> dòng</div>
                    </div>
                ),
            })
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        } catch (err) {
            message.error(err?.message || 'Nhập file thất bại')
        } finally {
            setImporting(false)
        }
    }

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Bệnh viện',
            key: 'hospital',
            render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: '#fff2f0', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BankOutlined style={{ color: '#e53935', fontSize: 20 }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
                            {r.name}
                        </div>
                        {r.address && (
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                {r.address}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Tỉnh / Thành',
            dataIndex: 'province',
            width: 150,
            render: (v) => v
                ? <Tag color="blue">{v}</Tag>
                : <span style={{ color: '#bbb' }}>—</span>,
        },
        {
            title: 'Phường / Xã',
            key: 'ward',
            width: 160,
            render: (_, r) => r.ward || r.district
                ? <span>{r.ward || r.district}</span>
                : <span style={{ color: '#bbb' }}>—</span>,
        },
        {
            title: 'Bản đồ',
            key: 'map',
            width: 130,
            render: (_, r) => r.latitude && r.longitude
                ? (
                    <Button
                        type="link" size="small"
                        icon={<EnvironmentOutlined />}
                        style={{ padding: 0, fontSize: 12 }}
                        onClick={() => openMap(r.latitude, r.longitude)}
                    >
                        Xem bản đồ ↗
                    </Button>
                )
                : <span style={{ color: '#bbb', fontSize: 12 }}>Chưa có toạ độ</span>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 110,
            fixed: 'right',
            render: (_, r) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text" size="small"
                            icon={<EyeOutlined />}
                            style={{ color: '#1e88e5' }}
                            onClick={() => setDetailRecord(r)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text" size="small"
                            icon={<EditOutlined />}
                            style={{ color: '#faad14' }}
                            onClick={() => openEdit(r)}
                        />
                    </Tooltip>
                    <Tooltip title="Xoá">
                        <Popconfirm
                            title="Xoá bệnh viện?"
                            description="Các bài đăng liên quan có thể bị ảnh hưởng."
                            okText="Xoá" okButtonProps={{ danger: true }}
                            cancelText="Huỷ"
                            onConfirm={() => deleteH(r.id)}
                        >
                            <Button
                                type="text" size="small" danger
                                icon={<DeleteOutlined />}
                                loading={deleting}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    // ── [NEW] Row selection config ─────────────────────────────────────────────
    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        preserveSelectedRowKeys: false, // clear khi đổi trang
    }

    return (
        <div>
            <PageHeader
                title="Quản lý bệnh viện"
                subtitle={`Tổng cộng ${total} bệnh viện trong hệ thống`}
                extra={[
                    <Button
                        key="template"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadTemplate}
                    >
                        Tải file mẫu
                    </Button>,
                    <Button
                        key="import"
                        icon={<UploadOutlined />}
                        loading={importing}
                        onClick={() => document.getElementById('import-hospital-file').click()}
                    >
                        Nhập file
                    </Button>,
                    <Dropdown
                        key="export"
                        menu={{
                            items: [
                                { key: 'csv', label: 'Xuất CSV', icon: <DownloadOutlined /> },
                                { key: 'xlsx', label: 'Xuất Excel (.xlsx)', icon: <DownloadOutlined /> },
                            ],
                            onClick: ({ key }) => handleExport(key),
                        }}
                    >
                        <Button icon={<DownloadOutlined />} loading={exporting}>
                            Xuất file ▾
                        </Button>
                    </Dropdown>,
                    <Button
                        key="add" type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreate}
                        style={{
                            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                            border: 'none', fontWeight: 600,
                        }}
                    >
                        Thêm bệnh viện
                    </Button>,
                ]}
            />

            {/* Input file ẩn cho import */}
            <input
                id="import-hospital-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            <Card style={cardStyle}>
                {/* ── Bộ lọc ── */}
                <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Input
                            placeholder="Tìm theo tên bệnh viện..."
                            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            onPressEnter={applyFilter}
                            allowClear
                            onClear={() => setNameSearch('')}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Select
                            placeholder="Tỉnh / Thành phố"
                            style={{ width: '100%' }}
                            loading={filterArea.loadingP}
                            showSearch
                            optionFilterProp="label"
                            options={filterArea.provinceOptions}
                            value={filterArea.selectedProvince?.id ?? undefined}
                            allowClear
                            onChange={filterArea.onProvinceChange}
                            onClear={() => filterArea.onProvinceChange(null, { label: '' })}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Select
                            placeholder="Phường / Xã"
                            style={{ width: '100%' }}
                            loading={filterArea.loadingD}
                            showSearch
                            optionFilterProp="label"
                            options={filterArea.districtOptions}
                            value={filterArea.selectedDistrict?.id ?? undefined}
                            disabled={!filterArea.selectedProvince}
                            allowClear
                            onChange={filterArea.onDistrictChange}
                            onClear={() => filterArea.onDistrictChange(null, { label: '' })}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={applyFilter}
                            >
                                Tìm kiếm
                            </Button>
                            <Button icon={<ClearOutlined />} onClick={clearFilter}>
                                Xoá bộ lọc
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* Active filter tags */}
                {(filters.name || filters.province) && (
                    <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {filters.name && (
                            <Tag closable color="blue"
                                onClose={() => {
                                    setNameSearch('')
                                    setFilters((f) => ({ ...f, name: undefined, page: 1 }))
                                }}
                            >
                                Tên: {filters.name}
                            </Tag>
                        )}
                        {filters.province && (
                            <Tag closable color="green"
                                onClose={() => {
                                    filterArea.reset()
                                    setFilters((f) => ({ ...f, province: undefined, ward: undefined, page: 1 }))
                                }}
                            >
                                {filters.ward
                                    ? `${filters.ward}, ${filters.province}`
                                    : filters.province
                                }
                            </Tag>
                        )}
                    </div>
                )}

                {/* ── [NEW] Selection action bar ─────────────────────────────────────────── */}
                {selectedRowKeys.length > 0 && (
                    <Alert
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        type="warning"
                        message={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                <span style={{ fontWeight: 500 }}>
                                    Đã chọn <strong>{selectedRowKeys.length}</strong> bệnh viện
                                </span>
                                <Space>
                                    <Button
                                        size="small"
                                        onClick={() => setSelectedRowKeys([])}
                                    >
                                        Bỏ chọn
                                    </Button>
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={bulkDeleting}
                                        onClick={handleBulkDelete}
                                    >
                                        Xoá {selectedRowKeys.length} đã chọn
                                    </Button>
                                </Space>
                            </div>
                        }
                        showIcon={false}
                    />
                )}

                {/* ── [NEW] Nút xoá tất cả theo filter ─────────────────────────────────── */}
                {total > 0 && (
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={deletingAll}
                            onClick={handleDeleteAll}
                        >
                            Xoá tất cả {total} bệnh viện
                            {(filters.name || filters.province) ? ' (theo bộ lọc)' : ''}
                        </Button>
                    </div>
                )}

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={hospitals}
                    rowKey="id"
                    loading={isLoading}
                    size="middle"
                    pagination={{
                        current: filters.page,
                        pageSize: filters.pageSize,
                        total,
                        showSizeChanger: true,
                        showTotal: (t) => `Tổng ${t} bệnh viện`,
                        onChange: (page, pageSize) => {
                            setSelectedRowKeys([]) // clear selection khi đổi trang
                            setFilters((f) => ({ ...f, page, pageSize }))
                        },
                    }}
                    scroll={{ x: 900 }}
                    locale={{ emptyText: 'Không tìm thấy bệnh viện nào' }}
                />
            </Card>

            {/* ══ Drawer chi tiết ══ */}
            <Drawer
                title={
                    <Space>
                        <BankOutlined style={{ color: '#e53935' }} />
                        <span style={{ fontWeight: 700 }}>Chi tiết bệnh viện</span>
                    </Space>
                }
                open={!!detailRecord}
                onClose={() => setDetailRecord(null)}
                width={480}
                extra={
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => { openEdit(detailRecord); setDetailRecord(null) }}
                        >
                            Sửa
                        </Button>
                        <Popconfirm
                            title="Xoá bệnh viện?"
                            description="Các bài đăng liên quan có thể bị ảnh hưởng."
                            okText="Xoá" okButtonProps={{ danger: true }}
                            cancelText="Huỷ"
                            onConfirm={() => deleteH(detailRecord?.id)}
                        >
                            <Button danger icon={<DeleteOutlined />}>Xoá</Button>
                        </Popconfirm>
                    </Space>
                }
            >
                {detailRecord && (
                    <>
                        <div style={{
                            textAlign: 'center',
                            padding: '16px 0 24px',
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: 20,
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 16,
                                background: '#fff2f0',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 12px',
                            }}>
                                <BankOutlined style={{ color: '#e53935', fontSize: 28 }} />
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>
                                {detailRecord.name}
                            </div>
                            {detailRecord.province && (
                                <Tag color="blue" style={{ marginTop: 8 }}>
                                    <EnvironmentOutlined /> {detailRecord.province}
                                </Tag>
                            )}
                        </div>

                        <Descriptions
                            column={1} size="middle"
                            labelStyle={{ color: '#8c8c8c', fontWeight: 500, width: 140 }}
                        >
                            <Descriptions.Item label="Địa chỉ">
                                {detailRecord.address
                                    || <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Website">
                                {detailRecord.website
                                    ? <a href={detailRecord.website} target="_blank" rel="noreferrer">{detailRecord.website}</a>
                                    : <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tỉnh / Thành">
                                {detailRecord.province || <span style={{ color: '#bbb' }}>—</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phường / Xã">
                                {detailRecord.ward || detailRecord.district
                                    || <span style={{ color: '#bbb' }}>—</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Vĩ độ (Lat)">
                                {detailRecord.latitude || <span style={{ color: '#bbb' }}>—</span>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Kinh độ (Lng)">
                                {detailRecord.longitude || <span style={{ color: '#bbb' }}>—</span>}
                            </Descriptions.Item>
                        </Descriptions>

                        {detailRecord.latitude && detailRecord.longitude && (
                            <div style={{ marginTop: 20 }}>
                                <div style={{
                                    fontWeight: 600, fontSize: 13, color: '#1a1a2e',
                                    marginBottom: 10,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <EnvironmentOutlined style={{ color: '#e53935' }} />
                                    Vị trí trên bản đồ
                                </div>
                                <div style={{
                                    borderRadius: 10, overflow: 'hidden',
                                    border: '1px solid #f0f0f0',
                                }}>
                                    <iframe
                                        title="map"
                                        width="100%"
                                        height="220"
                                        frameBorder="0"
                                        style={{ display: 'block', border: 0 }}
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps?q=${detailRecord.latitude},${detailRecord.longitude}&z=16&output=embed`}
                                    />
                                </div>
                                <Button
                                    type="link" size="small"
                                    icon={<EnvironmentOutlined />}
                                    style={{ padding: '6px 0', fontSize: 12 }}
                                    onClick={() => openMap(detailRecord.latitude, detailRecord.longitude)}
                                >
                                    Mở rộng trên Google Maps ↗
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Drawer>

            {/* ══ Modal tạo / sửa ══ */}
            <Modal
                title={
                    <Space>
                        <BankOutlined style={{ color: '#e53935' }} />
                        <span style={{ fontWeight: 700 }}>
                            {editRecord ? 'Chỉnh sửa bệnh viện' : 'Thêm bệnh viện mới'}
                        </span>
                    </Space>
                }
                open={modalOpen}
                onCancel={closeModal}
                footer={null}
                width={660}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Tên bệnh viện</span>}
                        name="name"
                        rules={[{ required: true, message: 'Nhập tên bệnh viện' }]}
                    >
                        <Input placeholder="VD: Bệnh viện Đa khoa Phố Nối" size="large" />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Địa chỉ cụ thể</span>}
                        name="address"
                    >
                        <Input placeholder="VD: Số 1, Đường Phố Nối..." size="large" />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 600 }}>Website</span>}
                        name="website"
                    >
                        <Input placeholder="VD: https://benhvien.vn" size="large" />
                    </Form.Item>

                    {/* Toạ độ GPS */}
                    <div style={{
                        background: '#f8f9fa', borderRadius: 10,
                        padding: '14px 16px', marginBottom: 16,
                    }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#1a1a2e' }}>
                            <EnvironmentOutlined style={{ color: '#1e88e5', marginRight: 6 }} />
                            Toạ độ GPS
                        </div>
                        <div style={{
                            background: '#e8f4fd', borderRadius: 8,
                            padding: '10px 12px', marginBottom: 12,
                            border: '1px dashed #90caf9',
                        }}>
                            <div style={{ fontSize: 12, color: '#1e88e5', fontWeight: 500, marginBottom: 6 }}>
                                🔗 Dán link Google Maps hoặc toạ độ → tự động điền
                            </div>
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    placeholder="https://maps.app.goo.gl/... hoặc https://www.google.com/maps/..."
                                    value={mapLink}
                                    onChange={(e) => setMapLink(e.target.value)}
                                    onPressEnter={handleResolveMap}
                                    allowClear
                                />
                                <Button
                                    type="primary"
                                    loading={resolving}
                                    icon={<EnvironmentOutlined />}
                                    onClick={handleResolveMap}
                                    style={{ background: '#1e88e5', border: 'none' }}
                                >
                                    Lấy toạ độ
                                </Button>
                            </Space.Compact>
                        </div>
                        <Row gutter={10}>
                            <Col span={12}>
                                <Form.Item
                                    label="Vĩ độ (Latitude)" name="latitude"
                                    style={{ marginBottom: 0 }}
                                    rules={[{ pattern: /^-?\d+(\.\d+)?$/, message: 'Nhập số hợp lệ' }]}
                                >
                                    <Input placeholder="VD: 20.9801" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Kinh độ (Longitude)" name="longitude"
                                    style={{ marginBottom: 0 }}
                                    rules={[{ pattern: /^-?\d+(\.\d+)?$/, message: 'Nhập số hợp lệ' }]}
                                >
                                    <Input placeholder="VD: 106.0755" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Khu vực hành chính */}
                    <div style={{
                        background: '#f8f9fa', borderRadius: 10,
                        padding: '14px 16px', marginBottom: 20,
                    }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#1a1a2e' }}>
                            <EnvironmentOutlined style={{ color: '#e53935', marginRight: 6 }} />
                            Khu vực hành chính
                        </div>
                        <Row gutter={10}>
                            <Col span={12}>
                                <Form.Item label="Tỉnh / Thành phố" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn tỉnh..."
                                        loading={formArea.loadingP}
                                        showSearch
                                        optionFilterProp="label"
                                        options={formArea.provinceOptions}
                                        value={formArea.selectedProvince?.id ?? undefined}
                                        allowClear
                                        onChange={(val, opt) => formArea.onProvinceChange(val, opt)}
                                        onClear={() => formArea.onProvinceChange(null, { label: '' })}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Phường / Xã" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn phường/xã..."
                                        loading={formArea.loadingD}
                                        showSearch
                                        optionFilterProp="label"
                                        options={formArea.districtOptions}
                                        value={formArea.selectedDistrict?.id ?? undefined}
                                        disabled={!formArea.selectedProvince}
                                        allowClear
                                        onChange={(val, opt) => formArea.onDistrictChange(val, opt)}
                                        onClear={() => formArea.onDistrictChange(null, { label: '' })}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        {formArea.normalizedProvince && (
                            <div style={{
                                marginTop: 10, padding: '6px 10px',
                                background: '#e3f2fd', borderRadius: 6,
                                fontSize: 12, color: '#1e88e5',
                            }}>
                                📍 {[formArea.normalizedDistrict, formArea.normalizedProvince].filter(Boolean).join(', ')}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button onClick={closeModal}>Huỷ</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={creating || updating}
                            style={{
                                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                border: 'none', fontWeight: 600,
                            }}
                        >
                            {editRecord ? 'Lưu thay đổi' : 'Thêm bệnh viện'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    )
}