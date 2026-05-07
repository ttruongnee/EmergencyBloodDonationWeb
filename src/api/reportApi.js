import axiosClient from './axiosClient'

const reportApi = {
    /** GET /reports?status=&page=&pageSize= */
    getAll: (params) => axiosClient.get('/reports', { params }),

    /** GET /reports/:id */
    getById: (id) => axiosClient.get(`/reports/${id}`),

    /** PUT /reports/:id/resolve — ẩn bài + resolved */
    resolve: (id) => axiosClient.put(`/reports/${id}/resolve`),

    /** PUT /reports/:id/reject — bác bỏ */
    reject: (id) => axiosClient.put(`/reports/${id}/reject`),
}

export default reportApi