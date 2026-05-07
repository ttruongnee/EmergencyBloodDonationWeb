import axiosClient from './axiosClient'

const mapApi = {
    resolveCoords: (url) =>
        axiosClient.get('/map/resolve-coords', { params: { url } }),
}

export default mapApi