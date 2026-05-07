import { Layout, Button, Avatar, Dropdown, Typography, Space, App, Spin } from 'antd'
import {
    MenuFoldOutlined, MenuUnfoldOutlined,
    UserOutlined, LogoutOutlined,
    LockOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'   // thêm
import authApi from '../../api/authApi'
import accountApi from '../../api/accountApi'       // thêm
import useAuthStore from '../../store/authStore'

const { Text } = Typography

function decodeJwt(token) {                          // copy từ ProfilePage
    try { return JSON.parse(atob(token.split('.')[1])) }
    catch { return null }
}

export default function Header({ collapsed, onToggle }) {
    const navigate = useNavigate()
    const logout = useAuthStore((s) => s.logout)
    const accessToken = useAuthStore((s) => s.accessToken)
    const { modal, message } = App.useApp()

    const accountId = decodeJwt(accessToken)?.accountId ?? null

    // Dùng chung cache với ProfilePage — không fetch lại nếu đã có
    const { data: res } = useQuery({
        queryKey: ['my-account', accountId],
        queryFn: () => accountApi.getById(accountId),
        enabled: !!accountId,
        staleTime: 5 * 60 * 1000, // cache 5 phút
    })
    const account = res?.data ?? null

    const handleLogout = () => {
        modal.confirm({
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc muốn đăng xuất không?',
            okText: 'Đăng xuất',
            cancelText: 'Huỷ',
            okButtonProps: { danger: true },
            onOk: async () => {
                try { await authApi.logout() } catch { }
                logout()
                message.success('Đã đăng xuất')
                navigate('/login', { replace: true })
            },
        })
    }

    const dropdownItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'change-password',
            icon: <LockOutlined />,
            label: 'Đổi mật khẩu',
            onClick: () => navigate('/profile?tab=password'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ]

    return (
        <Layout.Header
            style={{
                position: 'fixed',
                top: 0, right: 0,
                left: collapsed ? 80 : 240,
                zIndex: 99,
                height: 64,
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'left 0.2s',
            }}
        >
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={onToggle}
                style={{ fontSize: 18, width: 40, height: 40 }}
            />

            <Space size={8}>
                <Dropdown
                    menu={{ items: dropdownItems }}
                    placement="bottomRight"
                    arrow
                    trigger={['click']}
                >
                    <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                        <Avatar
                            src={account?.avatar || undefined}
                            icon={!account?.avatar && <UserOutlined />}
                            style={{
                                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                                fontWeight: 700,
                            }}
                        />
                        <Text strong style={{ fontSize: 13 }}>
                            {account?.name ?? 'Admin'}
                        </Text>
                    </Space>
                </Dropdown>
            </Space>
        </Layout.Header>
    )
}