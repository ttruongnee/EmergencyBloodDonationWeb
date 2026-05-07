import axiosClient from './axiosClient'

const dashboardApi = {
    getStats: () => axiosClient.get('/dashboard/stats'),
    getBloodTypeStats: () => axiosClient.get('/dashboard/blood-type-stats'),
    getProvinceStats: () => axiosClient.get('/dashboard/province-stats'),
}

export default dashboardApi