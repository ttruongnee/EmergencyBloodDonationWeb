import axiosClient from './axiosClient'

const accountApi = {
    getAll: (params) => axiosClient.get('/accounts', { params }),

    getById: (id) => axiosClient.get(`/accounts/${id}`),

    updateStatus: (id, status) =>
        axiosClient.put(`/accounts/${id}/status`, { status }),

    updateProfile: (id, data) =>
        axiosClient.put(`/accounts/${id}/profile`, data),

    createAdmin: (data) => axiosClient.post('/accounts/create-admin', data),
}

export default accountApi