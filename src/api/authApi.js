import axiosClient from './axiosClient'

const authApi = {
    login: (data) => axiosClient.post('/auth/login', data),
    logout: () => axiosClient.post('/auth/logout'),
    changePassword: (data) => axiosClient.post('/auth/change-password', data),
    refreshToken: (token) => axiosClient.post('/auth/refresh-token', token),
}

export default authApi