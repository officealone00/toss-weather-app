import { useEffect, useRef, useState } from 'react';
import { AD_CONFIG, isAdConfigured } from '@/lib/ads';

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!isAdConfigured('banner')) return;
    const loadAd = async () => {
      try {
        const sdk = await (Function('return import("@apps-in-toss/web-framework/ads")')());
        if (containerRef.current) {
          await sdk.renderBannerAd({
            container: containerRef.current,
            adGroupId: AD_CONFIG.BANNER_AD_GROUP_ID,
            onLoad: () => setAdLoaded(true),
            onError: () => setAdError(true),
          });
        }
      } catch { setAdError(true); }
    };
    loadAd();
  }, []);

  if (!isAdConfigured('banner')) return null;

  return (
    <div style={{ margin: '16px 0' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: 56, borderRadius: 12, overflow: 'hidden', background: '#FFF', border: '1px solid #F2F4F6' }}>
        {!adLoaded && !adError && <div style={{ padding: 12 }}><div style={{ width: '100%', height: 50, borderRadius: 8, background: '#F2F4F6' }} /></div>}
        {adError && <div style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}><span style={{ fontSize: 12, color: '#B0B8C1', fontWeight: 500, letterSpacing: 2 }}>AD</span></div>}
      </div>
    </div>
  );
}

export function BannerAdPlaceholder({ devMode = false }: { devMode?: boolean }) {
  if (!devMode && !isAdConfigured('banner')) return null;
  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ width: '100%', height: 64, borderRadius: 12, border: '1.5px dashed #B0B8C1', background: '#F9FAFB', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 500 }}>배너 광고 영역</span>
        <span style={{ fontSize: 11, color: '#B0B8C1', marginTop: 2 }}>ads.ts에 광고 ID 입력</span>
      </div>
    </div>
  );
}
