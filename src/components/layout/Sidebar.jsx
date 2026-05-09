import { Layout, Menu } from 'antd'
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    WarningOutlined,
    BellOutlined,
    MedicineBoxOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/users', icon: <UserOutlined />, label: 'Người dùng' },
    { key: '/posts', icon: <FileTextOutlined />, label: 'Bài đăng' },
    { key: '/reports', icon: <WarningOutlined />, label: 'Báo cáo vi phạm' },
    { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
    { key: '/hospitals', icon: <MedicineBoxOutlined />, label: 'Bệnh viện' },
]

export default function Sidebar({ collapsed }) {
    const navigate = useNavigate()
    const location = useLocation()
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
                left: 0, top: 0, bottom: 0,
                background: '#1a1a2e',
                zIndex: 100,
            }}
        >
            {/* Logo */}
            <div style={styles.logoBox} onClick={() => navigate('/dashboard')}>
                <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'transparent',
                    transition: 'all 0.2s ease',
                }}>
                    <img
                        src="/adaptive-icon.png"
                        alt="Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                        }}
                    />
                </div>
                {!collapsed && (
                    <div style={styles.logoText}>
                        <div style={styles.logoTitle}>BloodAdmin</div>
                        <div style={styles.logoSub}>Quản trị hệ thống</div>
                    </div>
                )}
            </div>

            <div style={styles.divider} />

            <Menu
                mode="inline"
                theme="dark"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{ background: 'transparent', border: 'none', padding: '8px 0' }}
            />
        </Sider>
    )
}

const styles = {
    logoBox: {
        height: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
        cursor: 'pointer',
    },
    logoText: {
        overflow: 'hidden',
    },
    logoTitle: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 18,                  // tăng kích thước tiêu đề
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
    },
    logoSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,                  // tăng nhẹ dòng phụ
        whiteSpace: 'nowrap',
    },
    divider: {
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        margin: '0 16px 8px',
    },
}