import axiosClient from './axiosClient'

const hospitalApi = {
    search: (params) => axiosClient.get('/hospitals', { params }),
    getById: (id) => axiosClient.get(`/hospitals/${id}`),
    getAll: () => axiosClient.get('/hospitals/all'),
    import: (data) => axiosClient.post('/hospitals/import', data),
    create: (data) => axiosClient.post('/hospitals', data),
    update: (id, data) => axiosClient.put(`/hospitals/${id}`, data),
    delete: (id) => axiosClient.delete(`/hospitals/${id}`),
    bulkDelete: (ids) => axiosClient.delete('/hospitals/bulk', { data: ids }),
    deleteAll: (params) => axiosClient.delete('/hospitals/all', { params }),
}

export default hospitalApi