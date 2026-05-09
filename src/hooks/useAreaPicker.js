import { useState, useEffect } from 'react'
import mapAreaApi from '../api/mapAreaApi'
import { normalizeArea } from '../utils/normalizeArea'

export function useAreaPicker() {
    const [provinces, setProvinces] = useState([])
    const [wards, setWards] = useState([])

    const [selectedProvince, setSelectedProvince] = useState(null)
    const [selectedWard, setSelectedWard] = useState(null)

    const [loadingP, setLoadingP] = useState(false)
    const [loadingW, setLoadingW] = useState(false)

    useEffect(() => {
        setLoadingP(true)
        mapAreaApi.getProvinces()
            .then(setProvinces)
            .catch(() => { })
            .finally(() => setLoadingP(false))
    }, [])

    const onProvinceChange = async (provinceId, option) => {
        setSelectedProvince({ id: provinceId, full_name: option.label })
        setSelectedWard(null)
        setWards([])

        setLoadingW(true)
        try {
            const data = await mapAreaApi.getWards(provinceId)
            setWards(data)
        } catch { }
        finally { setLoadingW(false) }
    }

    const onWardChange = (wardId, option) => {
        setSelectedWard({ id: wardId, full_name: option.label })
    }

    const reset = () => {
        setSelectedProvince(null)
        setSelectedWard(null)
        setWards([])
    }

    return {
        provinceOptions: provinces.map(p => ({ value: p.id, label: p.full_name })),
        wardOptions: wards.map(w => ({ value: w.id, label: w.full_name })),

        loadingP,
        loadingW,

        onProvinceChange,
        onWardChange,
        reset,

        selectedProvince,
        selectedWard,

        normalizedProvince: normalizeArea(selectedProvince?.full_name ?? ''),
        normalizedWard: normalizeArea(selectedWard?.full_name ?? ''),
    }
}