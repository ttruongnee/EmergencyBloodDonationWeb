import axiosClient from './axiosClient'

const accountApi = {
    /** GET /accounts?role=&status=&page=&pageSize= */
    getAll: (params) => axiosClient.get('/accounts', { params }),

    /** GET /accounts/:id */
    getById: (id) => axiosClient.get(`/accounts/${id}`),

    /** PUT /accounts/:id/status  body: { status } */
    updateStatus: (id, status) =>
        axiosClient.put(`/accounts/${id}/status`, { status }),

    updateProfile: (id, data) =>
        axiosClient.put(`/accounts/${id}/profile`, data),

    createAdmin: (data) => axiosClient.post('/accounts/create-admin', data),
}

export default accountApi