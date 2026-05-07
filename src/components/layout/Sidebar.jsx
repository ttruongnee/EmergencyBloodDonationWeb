import { Layout, Menu } from 'antd'
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    WarningOutlined,
    BellOutlined,
    MedicineBoxOutlined,
    HeartFilled,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const menuItems = [
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
    },
    {
        key: '/users',
        icon: <UserOutlined />,
        label: 'Người dùng',
    },
    {
        key: '/posts',
        icon: <FileTextOutlined />,
        label: 'Bài đăng',
    },
    {
        key: '/reports',
        icon: <WarningOutlined />,
        label: 'Báo cáo vi phạm',
    },
    {
        key: '/notifications',
        icon: <BellOutlined />,
        label: 'Thông báo',
    },
    {
        key: '/hospitals',
        icon: <MedicineBoxOutlined />,
        label: 'Bệnh viện',
    },
]

export default function Sidebar({ collapsed }) {
    const navigate = useNavigate()
    const location = useLocation()

    // Lấy key active từ path hiện tại
    const selectedKey = '/' + location.pathname.split('/')[1]

    return (
        <Sider
            collapsed={collapsed}
            width={240}
            collapsedWidth={80}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#1a1a2e',
                zIndex: 100,
            }}
        >
            {/* Logo */}
            <div style={styles.logoBox} onClick={() => navigate('/dashboard')}>
                <div style={styles.logoIcon}>
                    <HeartFilled style={{ fontSize: collapsed ? 20 : 22, color: '#fff' }} />
                </div>
                {!collapsed && (
                    <div style={styles.logoText}>
                        <div style={styles.logoTitle}>BloodAdmin</div>
                        <div style={styles.logoSub}>Quản trị hệ thống</div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Menu */}
            <Menu
                mode="inline"
                theme="dark"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 0',
                }}
            />
        </Sider>
    )
}

const styles = {
    logoBox: {
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    logoIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #e53935, #b71c1c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(229,57,53,0.4)',
    },
    logoText: {
        overflow: 'hidden',
    },
    logoTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 15,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
    },
    logoSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        whiteSpace: 'nowrap',
    },
    divider: {
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        margin: '0 16px 8px',
    },
}