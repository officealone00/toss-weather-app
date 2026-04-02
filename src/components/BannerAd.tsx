import { useEffect, useRef, useState, CSSProperties } from 'react';
import { AD_CONFIG, isAdConfigured } from '@/lib/ads';

/**
 * 앱인토스 배너 광고 컴포넌트
 *
 * 사용법:
 *   <BannerAd />
 *
 * 광고 ID가 설정되지 않으면 자동으로 숨겨짐
 */
export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!isAdConfigured('banner')) return;

    const loadBannerAd = async () => {
      try {
        // @ts-ignore — 앱인토스 SDK 런타임에서 주입
        const { renderBannerAd } = await import('@apps-in-toss/web-framework/ads');
        if (containerRef.current) {
          await renderBannerAd({
            container: containerRef.current,
            adGroupId: AD_CONFIG.BANNER_AD_GROUP_ID,
            onLoad: () => setAdLoaded(true),
            onError: () => setAdError(true),
          });
        }
      } catch {
        // SDK가 없는 환경 (로컬 개발 등)에서는 플레이스홀더 표시
        setAdError(true);
      }
    };

    loadBannerAd();
  }, []);

  // 광고 ID 미설정 시 렌더링하지 않음
  if (!isAdConfigured('banner')) return null;

  return (
    <div style={styles.wrapper}>
      {/* 실제 광고가 렌더링될 컨테이너 */}
      <div ref={containerRef} style={styles.container}>
        {!adLoaded && !adError && (
          <div style={styles.placeholder}>
            <div style={styles.skeleton} />
          </div>
        )}
        {adError && (
          <div style={styles.fallback}>
            <span style={styles.fallbackText}>AD</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 배너 광고 플레이스홀더
 * 광고 ID가 아직 없을 때 레이아웃 확인용
 * - devMode={true}로 설정하면 개발 중 광고 영역을 시각적으로 확인 가능
 */
export function BannerAdPlaceholder({ devMode = false }: { devMode?: boolean }) {
  if (!devMode && !isAdConfigured('banner')) return null;

  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.container, ...styles.devPlaceholder }}>
        <span style={styles.devLabel}>배너 광고 영역</span>
        <span style={styles.devSub}>콘솔에서 광고 그룹 ID 발급 후 ads.ts에 입력</span>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    margin: '16px 0',
    width: '100%',
  },
  container: {
    width: '100%',
    minHeight: 56,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#FFFFFF',
    border: '1px solid #F2F4F6',
  },
  placeholder: {
    padding: 12,
  },
  skeleton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    background: 'linear-gradient(90deg, #F2F4F6 25%, #E5E8EB 50%, #F2F4F6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  fallback: {
    width: '100%',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F9FAFB',
  },
  fallbackText: {
    fontSize: 12,
    color: '#B0B8C1',
    fontWeight: 500,
    letterSpacing: 2,
  },
  devPlaceholder: {
    height: 64,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F9FAFB',
    border: '1.5px dashed #B0B8C1',
  },
  devLabel: {
    fontSize: 13,
    color: '#8B95A1',
    fontWeight: 500,
  },
  devSub: {
    fontSize: 11,
    color: '#B0B8C1',
    marginTop: 2,
  },
};
