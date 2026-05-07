import axiosClient from './axiosClient'

const postApi = {
    getAllForAdmin: (params) => axiosClient.get('/posts/admin', { params }),
    getById: (id) => axiosClient.get(`/posts/${id}`),
    hide: (id) => axiosClient.put(`/posts/${id}/hide`),
    unhide: (id) => axiosClient.put(`/posts/${id}/unhide`),
    delete: (id) => axiosClient.delete(`/posts/${id}`),
    deleteMany: (ids) => axiosClient.delete('/posts/bulk', { data: ids }),
    hideMany: (ids) => axiosClient.put('/posts/bulk/hide', ids),
    unhideMany: (ids) => axiosClient.put('/posts/bulk/unhide', ids),
    hideAll: (params) => axiosClient.put('/posts/all/hide', null, { params }),
    unhideAll: (params) => axiosClient.put('/posts/all/unhide', null, { params }),
}

export default postApi