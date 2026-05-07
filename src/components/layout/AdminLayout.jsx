import { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const { Content } = Layout

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} />
            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 240,
                    transition: 'margin-left 0.2s',
                    background: '#f0f2f5',
                }}
            >
                <Header
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                />
                <Content
                    style={{
                        margin: '80px 24px 24px',
                        minHeight: 'calc(100vh - 104px)',
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}