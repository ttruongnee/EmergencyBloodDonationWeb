const PREFIXES = [
    'Thành phố ', 'Tỉnh ',           // tỉnh/thành
    'Phường ', 'Xã ', 'Thị trấn ',   // xã/phường
];

export const normalizeArea = (name) => {
    if (!name) return '';
    for (const prefix of PREFIXES) {
        if (name.startsWith(prefix)) return name.slice(prefix.length);
    }
    return name;
};