import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import AppRouter from './routes/AppRouter'
import { APP_NAME } from './constants'

document.title = APP_NAME

function App() {
    return (
        <ConfigProvider
            locale={viVN}
            theme={{
                token: {
                    colorPrimary: '#e53935',
                    colorSuccess: '#52c41a',
                    colorWarning: '#faad14',
                    colorError: '#ff4d4f',
                    borderRadius: 8,
                    fontFamily: "'Be Vietnam Pro', -apple-system, sans-serif",
                },
                components: {
                    Layout: {
                        siderBg: '#1a1a2e',
                        triggerBg: '#16213e',
                    },
                    Menu: {
                        darkItemBg: '#1a1a2e',
                        darkSubMenuItemBg: '#16213e',
                        darkItemSelectedBg: '#e53935',
                    },
                    Table: { borderRadius: 8 },
                    Card: { borderRadius: 8 },
                },
            }}
        >
            <AntApp>
                <AppRouter />
            </AntApp>
        </ConfigProvider>
    )
}

export default App