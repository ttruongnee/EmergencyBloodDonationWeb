import { useState, useEffect, useCallback, useRef } from 'react';
import { Image } from 'antd';

const ratioCache = {};

export default function PostImages({ images }) {
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const GAP = 4;

    // Lấy kích thước container
    useEffect(() => {
        if (!containerRef.current) return;
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(entries => {
                for (const entry of entries) {
                    setContainerWidth(entry.contentRect.width);
                }
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        } else {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, []);

    // Lấy tỉ lệ ảnh
    const [ratios, setRatios] = useState(() => {
        if (!images?.length) return {};
        return images.reduce((acc, url, idx) => {
            if (ratioCache[url] != null) acc[idx] = ratioCache[url];
            return acc;
        }, {});
    });

    useEffect(() => {
        if (!images?.length) return;
        let cancelled = false;
        images.forEach((url, idx) => {
            if (ratioCache[url] != null) return;
            const img = new window.Image();
            img.onload = () => {
                if (cancelled) return;
                const r = img.naturalWidth / img.naturalHeight;
                ratioCache[url] = r;
                setRatios(prev => ({ ...prev, [idx]: r }));
            };
            img.onerror = () => { };
            img.src = url;
        });
        return () => { cancelled = true; };
    }, [images]);

    const getGridHeight = useCallback((colW, indices, minHR = 0.3, maxHR = 3.0) => {
        const loaded = indices.map(i => ratios[i]).filter(Boolean);
        if (loaded.length === 0) return colW * 0.85;
        const hRatios = loaded.map(r => 1 / r).sort((a, b) => a - b);
        const mid = Math.floor(hRatios.length / 2);
        const median = hRatios.length % 2 === 0
            ? (hRatios[mid - 1] + hRatios[mid]) / 2
            : hRatios[mid];
        return Math.floor(colW * Math.min(Math.max(median, minHR), maxHR));
    }, [ratios]);

    if (!images?.length || containerWidth === 0)
        return <div ref={containerRef} style={{ width: '100%' }} />;

    // Hàm renderImage – sửa phần <Image>
    const renderImage = (url, idx, width, height, overlayContent = null) => (
        <div key={idx} style={{ position: 'relative', width, height }}>
            <Image
                src={url}
                width="100%"
                height="100%"
                style={{ objectFit: 'cover', display: 'block' }}
                preview={{ mask: null }}  // ← cho phép preview nhưng ẩn mask
            />
            {overlayContent && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        color: '#fff',
                        fontSize: 28,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                    }}
                >
                    {overlayContent}
                </div>
            )}
        </div>
    );

    // Các trường hợp số lượng ảnh (1, 2, 3, 4, 5+)
    if (images.length === 1) {
        const r = ratios[0];
        const h = r ? containerWidth / r : containerWidth * 0.65;
        return (
            <div ref={containerRef} style={{ width: '100%' }}>
                {renderImage(images[0], 0, '100%', h)}
            </div>
        );
    }

    if (images.length === 2) {
        const colW = (containerWidth - GAP) / 2;
        const colH = getGridHeight(colW, [0, 1]);
        return (
            <div ref={containerRef} style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: GAP }}>
                    {images.map((url, idx) => renderImage(url, idx, colW, colH))}
                </div>
            </div>
        );
    }

    if (images.length === 3) {
        const mainW = containerWidth * 0.62;
        const mainH = getGridHeight(mainW, [0, 1, 2]);
        const sideW = containerWidth - mainW - GAP;
        const sideH = (mainH - GAP) / 2;
        return (
            <div ref={containerRef} style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: GAP }}>
                    {renderImage(images[0], 0, mainW, mainH)}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: sideW }}>
                        {images.slice(1).map((url, idx) =>
                            renderImage(url, idx + 1, '100%', sideH)
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (images.length === 4) {
        const colW = (containerWidth - GAP) / 2;
        const colH = getGridHeight(colW, [0, 1, 2, 3]);
        return (
            <div ref={containerRef} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: GAP }}>
                    {images.map((url, idx) => renderImage(url, idx, colW, colH))}
                </div>
            </div>
        );
    }

    // 5+ ảnh
    // 5+ ảnh
    const topW1 = Math.floor((containerWidth - GAP) / 2);
    const topW2 = containerWidth - GAP - topW1;
    const topH = getGridHeight(topW1, [0, 1]);

    const botW1 = Math.floor((containerWidth - GAP * 2) / 3);
    const botW3 = containerWidth - GAP * 2 - botW1 * 2;
    const botH = getGridHeight(botW1, [2, 3, 4], 0.5, 2.5);

    const visible = images.slice(0, 5);
    const remaining = images.length - 5;

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {/* hàng trên: 2 ảnh đầu */}
                <div style={{ display: 'flex', gap: GAP }}>
                    {visible.slice(0, 2).map((url, idx) =>
                        renderImage(url, idx, idx === 0 ? topW1 : topW2, topH)
                    )}
                </div>
                {/* hàng dưới: 3 ảnh tiếp theo */}
                <div style={{ display: 'flex', gap: GAP }}>
                    {visible.slice(2).map((url, idx) => {
                        const absIdx = idx + 2;
                        const isLast = absIdx === 4 && remaining > 0;
                        const w = idx === 2 ? botW3 : botW1;
                        const overlay = isLast ? `+${remaining + 1}` : null;
                        return renderImage(url, absIdx, w, botH, overlay);
                    })}
                </div>
                {/* Render các ảnh còn lại (từ index 5 trở đi) ở dạng ẩn */}
                {images.length > 5 && (
                    <div style={{ display: 'none' }}>
                        {images.slice(5).map((url, idx) =>
                            renderImage(url, idx + 5, 0, 0)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}