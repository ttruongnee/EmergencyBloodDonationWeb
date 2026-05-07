import axiosClient from './axiosClient'

const donationApi = {
    /** Admin: full list kể cả cancelled */
    getByPostId: (postId) => axiosClient.get(`/donations/post/${postId}`),
}

export default donationApi