import axiosClient from './axiosClient'

const mapAreaApi = {
    getProvinces: async () => {
        const res = await axiosClient.get('/map/provinces')
        return res.data ?? []
    },

    // SAU SÁP NHẬP 07/2025: endpoint này trả về Xã/Phường trực tiếp (không còn Quận/Huyện)
    getDistricts: async (provinceId) => {
        const res = await axiosClient.get(`/map/provinces/${provinceId}/districts`)
        return res.data ?? []
    },

    // Không còn dùng sau sáp nhập (hệ 2 cấp: Tỉnh → Xã/Phường)
    // getWards: async (districtId) => {
    //     const res = await axiosClient.get(`/map/districts/${districtId}/wards`)
    //     return res.data ?? []
    // },
}

export default mapAreaApi