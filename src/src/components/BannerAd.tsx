import { useEffect, useRef, useState } from 'react';
import { isAdReady } from '@/lib/ads';

// 배너 광고 컴포넌트 - adGroupId를 받아서 렌더링
export function BannerAd({ adGroupId }: { adGroupId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!isAdReady(adGroupId)) return;
    const loadAd = async () => {
      try {
        const sdk = await (Function('return import("@apps-in-toss/web-framework/ads")')());
        if (containerRef.current) {
          await sdk.renderBannerAd({
            container: containerRef.current,
            adGroupId,
            onLoad: () => setAdLoaded(true),
            onError: () => setAdError(true),
          });
        }
      } catch { setAdError(true); }
    };
    loadAd();
  }, [adGroupId]);

  if (!isAdReady(adGroupId)) return null;

  return (
    <div style={{ margin: '12px 0' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: 56, borderRadius: 12, overflow: 'hidden', background: '#FFF', border: '1px solid #F2F4F6' }}>
        {!adLoaded && !adError && <div style={{ padding: 12 }}><div style={{ width: '100%', height: 50, borderRadius: 8, background: '#F2F4F6' }} /></div>}
        {adError && <div style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}><span style={{ fontSize: 12, color: '#B0B8C1', fontWeight: 500, letterSpacing: 2 }}>AD</span></div>}
      </div>
    </div>
  );
}

// 개발 중 광고 영역 확인용 플레이스홀더
export function BannerAdPlaceholder({ label = '배너 광고', devMode = false }: { label?: string; devMode?: boolean }) {
  if (!devMode) return null;
  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ width: '100%', height: 56, borderRadius: 12, border: '1.5px dashed #3182F6', background: '#E8F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -9, left: 12, background: '#3182F6', color: '#FFF', fontSize: 11, padding: '1px 8px', borderRadius: 4, fontWeight: 500 }}>AD</div>
        <span style={{ fontSize: 13, color: '#185FA5', fontWeight: 500 }}>{label}</span>
      </div>
    </div>
  );
}
