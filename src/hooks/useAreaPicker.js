import { useState, useEffect } from 'react'
import mapAreaApi from '../api/mapAreaApi'
import { normalizeArea } from '../utils/normalizeArea';

export function useAreaPicker() {
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [wards, setWards] = useState([])

    const [selectedProvince, setSelectedProvince] = useState(null) // {id, full_name}
    const [selectedDistrict, setSelectedDistrict] = useState(null)
    const [selectedWard, setSelectedWard] = useState(null)

    const [loadingP, setLoadingP] = useState(false)
    const [loadingD, setLoadingD] = useState(false)
    const [loadingW, setLoadingW] = useState(false)

    // Load tỉnh khi mount
    useEffect(() => {
        setLoadingP(true)
        mapAreaApi.getProvinces()
            .then(setProvinces)
            .catch(() => { })
            .finally(() => setLoadingP(false))
    }, [])

    const onProvinceChange = async (provinceId, option) => {
        setSelectedProvince({ id: provinceId, full_name: option.label })
        setSelectedDistrict(null)
        setSelectedWard(null)
        setDistricts([])
        setWards([])

        setLoadingD(true)
        try {
            const data = await mapAreaApi.getDistricts(provinceId)
            setDistricts(data)
        } catch { }
        finally { setLoadingD(false) }
    }

    const onDistrictChange = async (districtId, option) => {
        setSelectedDistrict({ id: districtId, full_name: option.label })
        setSelectedWard(null)
        setWards([])

        setLoadingW(true)
        try {
            const data = await mapAreaApi.getWards(districtId)
            setWards(data)
        } catch { }
        finally { setLoadingW(false) }
    }

    const onWardChange = (wardId, option) => {
        setSelectedWard({ id: wardId, full_name: option.label })
    }

    const reset = () => {
        setSelectedProvince(null)
        setSelectedDistrict(null)
        setSelectedWard(null)
        setDistricts([])
        setWards([])
    }

    return {
        // Options cho Select
        provinceOptions: provinces.map((p) => ({ value: p.id, label: p.full_name })),
        districtOptions: districts.map((d) => ({ value: d.id, label: d.full_name })),
        wardOptions: wards.map((w) => ({ value: w.id, label: w.full_name })),

        // Loading states
        loadingP, loadingD, loadingW,

        // Handlers
        onProvinceChange,
        onDistrictChange,
        onWardChange,
        reset,

        // Giá trị đã chọn (full_name gốc từ esgoo)
        selectedProvince,
        selectedDistrict,
        selectedWard,

        // Giá trị đã normalize để gửi BE — dùng cái này khi submit
        normalizedProvince: normalizeArea(selectedProvince?.full_name ?? ''),
        normalizedDistrict: normalizeArea(selectedDistrict?.full_name ?? ''),
        normalizedWard: normalizeArea(selectedWard?.full_name ?? ''),
    }
}