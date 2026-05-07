import axios from 'axios'
import { API_URL } from '../constants'

const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        // Bắt buộc với ngrok free — bỏ trang cảnh báo của ngrok
        'ngrok-skip-browser-warning': import.meta.env.VITE_NGROK_SKIP_WARNING || 'true',
    },
})

// ─── Request interceptor: tự gắn Bearer token ──────────────────────────────
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    },
    (error) => Promise.reject(error)
)

// ─── Response interceptor: unwrap data + xử lý 401 ────────────────────────
axiosClient.interceptors.response.use(
    (response) => {
        // BE trả về { success, message, data } — unwrap thẳng về data
        return response.data
    },
    async (error) => {
        const original = error.config

        // Token hết hạn → thử refresh 1 lần
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const res = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    JSON.stringify(refreshToken),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true',
                        },
                    }
                )
                const { accessToken, refreshToken: newRefresh } = res.data.data
                localStorage.setItem('accessToken', accessToken)
                localStorage.setItem('refreshToken', newRefresh)
                original.headers.Authorization = `Bearer ${accessToken}`
                return axiosClient(original)
            } catch {
                // Refresh cũng hết hạn → force logout
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(error)
            }
        }

        // Trả về message lỗi từ BE để dùng trong catch
        return Promise.reject(error.response?.data ?? error)
    }
)

export default axiosClient