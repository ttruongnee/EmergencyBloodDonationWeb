import { create } from 'zustand'

const useAuthStore = create((set) => ({
    // Đọc thẳng từ localStorage khi store khởi tạo — ĐỒNG BỘ
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    role: localStorage.getItem('role'),
    isLoggedIn: !!localStorage.getItem('accessToken'),

    login: ({ accessToken, refreshToken, role }) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('role', role)
        set({ accessToken, refreshToken, role, isLoggedIn: true })
    },

    logout: () => {
        localStorage.clear()
        set({ accessToken: null, refreshToken: null, role: null, isLoggedIn: false })
    },
}))

export default useAuthStore