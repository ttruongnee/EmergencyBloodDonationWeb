import { Typography, Space } from 'antd'

const { Title, Text } = Typography

export default function PageHeader({ title, subtitle, extra }) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
            }}
        >
            <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    {title}
                </Title>
                {subtitle && (
                    <Text type="secondary" style={{ fontSize: 13, marginTop: 2, display: 'block' }}>
                        {subtitle}
                    </Text>
                )}
            </div>
            {extra && <Space>{extra}</Space>}
        </div>
    )
}