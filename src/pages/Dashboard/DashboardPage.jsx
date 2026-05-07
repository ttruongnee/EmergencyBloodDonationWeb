import { Row, Col, Card, Spin, Empty, Table, Tag, Statistic } from 'antd'
import {
    UserOutlined, FileTextOutlined,
    HeartOutlined, FireOutlined,
} from '@ant-design/icons'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dashboardApi from '../../api/dashboardApi'
import PageHeader from '../../components/common/PageHeader'

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

export default function DashboardPage() {
    const { data: statsRes, isLoading: l1 } = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats })
    const { data: bloodRes, isLoading: l2 } = useQuery({ queryKey: ['dashboard-blood'], queryFn: dashboardApi.getBloodTypeStats })
    const { data: provinceRes, isLoading: l3 } = useQuery({ queryKey: ['dashboard-province'], queryFn: dashboardApi.getProvinceStats })

    const stats = statsRes?.data ?? {}
    const blood = bloodRes?.data ?? []
    const province = provinceRes?.data ?? []

    const STAT_CARDS = [
        {
            title: 'Tổng người dùng',
            value: stats.totalUsers,
            icon: <UserOutlined />,
            color: '#1e88e5',
            bg: '#e3f2fd',
            suffix: 'tài khoản',
        },
        {
            title: 'Tổng bài đăng',
            value: stats.totalPosts,
            icon: <FileTextOutlined />,
            color: '#8e24aa',
            bg: '#f3e5f5',
            suffix: 'bài',
        },
        {
            title: 'Lượt hiến thành công',
            value: stats.totalDonations,
            icon: <HeartOutlined />,
            color: '#e53935',
            bg: '#ffebee',
            suffix: 'lượt',
        },
        {
            title: 'Bài đang hoạt động',
            value: stats.activePosts,
            icon: <FireOutlined />,
            color: '#f57c00',
            bg: '#fff3e0',
            suffix: 'bài',
        },
    ]

    return (
        <div>
            <PageHeader
                title="Tổng quan hệ thống"
                subtitle="Thống kê hoạt động của nền tảng hiến máu khẩn cấp"
            />

            {/* ── 4 stat cards ── */}
            <Spin spinning={l1}>
                <Row gutter={[16, 16]}>
                    {STAT_CARDS.map((s) => (
                        <Col xs={24} sm={12} xl={6} key={s.title}>
                            <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: s.bg,
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 22, color: s.color, flexShrink: 0,
                                    }}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>
                                            {s.title}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                            <span style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                                                {s.value ?? '—'}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#bbb' }}>{s.suffix}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Spin>

            {/* ── Charts row ── */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>

                {/* Pie chart nhóm máu */}
                <Col xs={24} lg={9}>
                    <Card
                        title={<span style={{ fontWeight: 700 }}>🩸 Bài đăng theo nhóm máu</span>}
                        style={cardStyle}
                    >
                        <Spin spinning={l2}>
                            {blood.length === 0 ? (
                                <Empty description="Chưa có dữ liệu" style={{ padding: 48 }} />
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={blood}
                                            dataKey="Total"
                                            nameKey="BloodType"
                                            cx="50%" cy="50%"
                                            outerRadius={95}
                                            innerRadius={50}
                                            paddingAngle={3}
                                            label={({ BloodType, percent }) =>
                                                `${BloodType} ${(percent * 100).toFixed(0)}%`
                                            }
                                            labelLine={false}
                                        >
                                            {blood.map((entry) => (
                                                <Cell key={entry.BloodType} fill={BLOOD_COLORS[entry.BloodType] ?? '#ccc'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [`${v} bài`, n]} />
                                        <Legend
                                            formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Spin>
                    </Card>
                </Col>

                {/* Bar chart tỉnh thành */}
                <Col xs={24} lg={15}>
                    <Card
                        title={<span style={{ fontWeight: 700 }}>📍 Top 10 tỉnh có bài đăng nhiều nhất</span>}
                        style={cardStyle}
                    >
                        <Spin spinning={l3}>
                            {province.length === 0 ? (
                                <Empty description="Chưa có dữ liệu" style={{ padding: 48 }} />
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={[...province].filter((p) => p.Province).sort((a, b) => b.Total - a.Total).slice(0, 10)}
                                        margin={{ top: 8, right: 8, left: -10, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="Province"
                                            tick={{ fontSize: 11 }}
                                            angle={-35}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip
                                            formatter={(v) => [`${v} bài`, 'Số bài đăng']}
                                            cursor={{ fill: '#f5f5f5' }}
                                        />
                                        <Bar dataKey="Total" name="Bài đăng" radius={[6, 6, 0, 0]} fill="#e53935" maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* ── Tables row ── */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>

                {/* Bảng nhóm máu */}
                <Col xs={24} lg={10}>
                    <Card
                        title={<span style={{ fontWeight: 700 }}>🩸 Chi tiết theo nhóm máu</span>}
                        style={cardStyle}
                    >
                        <Spin spinning={l2}>
                            <Table
                                dataSource={[...blood].sort((a, b) => b.Total - a.Total)}
                                rowKey="BloodType"
                                pagination={false}
                                size="small"
                                columns={[
                                    {
                                        title: '#', width: 40,
                                        render: (_, __, i) => (
                                            <span style={{ fontWeight: 700, color: i < 3 ? '#e53935' : '#bbb' }}>
                                                {i + 1}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: 'Nhóm máu',
                                        dataIndex: 'BloodType',
                                        render: (v) => (
                                            <Tag
                                                color={BLOOD_COLORS[v] ?? 'default'}
                                                style={{ fontWeight: 700, fontSize: 13, padding: '2px 10px' }}
                                            >
                                                {v}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: 'Số bài đăng',
                                        dataIndex: 'Total',
                                        align: 'right',
                                        render: (v, _, i) => (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                <div style={{
                                                    height: 6, borderRadius: 3,
                                                    background: '#f0f0f0',
                                                    width: 60, overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 3,
                                                        background: '#e53935',
                                                        width: `${blood[0]?.Total > 0 ? (v / blood[0].Total) * 100 : 0}%`,
                                                    }} />
                                                </div>
                                                <strong style={{ minWidth: 24, textAlign: 'right' }}>{v}</strong>
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        </Spin>
                    </Card>
                </Col>

                {/* Bảng tỉnh thành */}
                <Col xs={24} lg={14}>
                    <Card
                        title={<span style={{ fontWeight: 700 }}>📋 Bảng xếp hạng tỉnh / thành phố</span>}
                        style={cardStyle}
                    >
                        <Spin spinning={l3}>
                            <Table
                                dataSource={[...province].filter((p) => p.Province).sort((a, b) => b.Total - a.Total)}
                                rowKey={(r) => r.Province ?? Math.random()}
                                pagination={{ pageSize: 8, size: 'small' }}
                                size="small"
                                columns={[
                                    {
                                        title: '#', width: 40,
                                        render: (_, __, i) => (
                                            <span style={{ fontWeight: 700, color: i < 3 ? '#e53935' : '#bbb' }}>
                                                {i + 1}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: 'Tỉnh / Thành phố',
                                        dataIndex: 'Province',
                                        render: (v) => v || <span style={{ color: '#bbb' }}>Không xác định</span>,
                                    },
                                    {
                                        title: 'Số bài đăng',
                                        dataIndex: 'Total',
                                        align: 'right',
                                        render: (v) => (
                                            <Tag color="volcano" style={{ fontWeight: 600 }}>{v}</Tag>
                                        ),
                                    },
                                ]}
                            />
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}