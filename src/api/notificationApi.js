import axiosClient from './axiosClient'

const notificationApi = {
    /** Admin: lấy lịch sử broadcast */
    getBroadcastHistory: (params) =>
        axiosClient.get('/notifications/admin/history', { params }),

    /** Admin: gửi thông báo broadcast
     * body: { title, content, destination, bloodType?, province?, ward?, userId? }
     */
    broadcast: (data) => axiosClient.post('/notifications/broadcast', data),
}

export default notificationApi