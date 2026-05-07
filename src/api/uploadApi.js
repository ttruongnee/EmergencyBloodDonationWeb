import axiosClient from './axiosClient'

const uploadApi = {
    uploadImage: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return axiosClient.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
}

export default uploadApi