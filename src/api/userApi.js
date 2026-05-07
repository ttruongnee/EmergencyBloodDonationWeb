import axiosClient from './axiosClient'

const userApi = {
    getById: (id) => axiosClient.get(`/users/${id}`),
    getByAccountId: (accountId) => axiosClient.get(`/users/account/${accountId}`),
    // getDonations: (userId) => axiosClient.get(`/donations/user/${userId}`),
    getDonations: (userId) => axiosClient.get(`/donations/user/${userId}/all`),
}

export default userApi