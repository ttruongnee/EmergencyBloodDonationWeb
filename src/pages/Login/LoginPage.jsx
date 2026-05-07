import { useState } from 'react'
import { Form, Input, Button, App, Typography } from 'antd'
import { UserOutlined, LockOutlined, HeartFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'

const { Title, Text } = Typography

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const { message } = App.useApp()
    const navigate = useNavigate()
    const login = useAuthStore((s) => s.login)

    const onFinish = async (values) => {
        setLoading(true)
        try {
            const res = await authApi.login(values)

            if (!res.success) {
                message.error(res.message || 'Đăng nhập thất bại')
                return
            }

            const { accessToken, refreshToken, role } = res.data

            if (role !== 'admin') {
                message.error('Tài khoản không có quyền truy cập trang quản trị')
                return
            }

            login({ accessToken, refreshToken, role })
            message.success('Đăng nhập thành công!')
            navigate('/dashboard', { replace: true })
        } catch (err) {
            message.error(err?.message || 'Đăng nhập thất bại, thử lại!')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.wrapper} className="login-page">
            {/* Background blobs */}
            <div style={styles.blob1} />
            <div style={styles.blob2} />

            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoBox}>
                    <div style={styles.logoCircle}>
                        <HeartFilled style={{ fontSize: 32, color: '#fff' }} />
                    </div>
                    <Title level={3} style={styles.appName}>
                        Hiến Máu Khẩn Cấp
                    </Title>
                    <Text style={styles.subtitle}>Trang quản trị hệ thống</Text>
                </div>

                {/* Form */}
                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                    style={{ marginTop: 32 }}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bbb' }} />}
                            placeholder="Tên đăng nhập"
                            size="large"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bbb' }} />}
                            placeholder="Mật khẩu"
                            size="large"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={loading}
                            block
                            style={styles.btn}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </Form.Item>
                </Form>

                <Text style={styles.footer}>
                    © 2026 Emergency Blood Donation System
                </Text>
            </div>
        </div>
    )
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    blob1: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,57,53,0.15) 0%, transparent 70%)',
        top: -100,
        right: -100,
        pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,57,53,0.1) 0%, transparent 70%)',
        bottom: -80,
        left: -80,
        pointerEvents: 'none',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '48px 40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
    },
    logoBox: {
        textAlign: 'center',
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e53935, #b71c1c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 8px 24px rgba(229,57,53,0.4)',
    },
    appName: {
        color: '#fff',
        margin: 0,
        fontWeight: 700,
        letterSpacing: '-0.5px',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        display: 'block',
        marginTop: 4,
    },
    input: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        color: '#fff',
        height: 48,
    },
    btn: {
        height: 48,
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 15,
        background: 'linear-gradient(135deg, #e53935, #b71c1c)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
    },
    footer: {
        display: 'block',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12,
        marginTop: 32,
    },
}