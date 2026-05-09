import axiosClient from './axiosClient'

const mapAreaApi = {
    getProvinces: async () => {
        const res = await axiosClient.get('/map/provinces')
        return res.data ?? []
    },

    // Hệ 2 cấp: endpoint trả về Xã/Phường
    getWards: async (provinceId) => {
        const res = await axiosClient.get(`/map/provinces/${provinceId}/wards`)
        return res.data ?? []
    },
}

export default mapAreaApi