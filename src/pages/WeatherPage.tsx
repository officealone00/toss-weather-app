import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import {
  latLonToGrid, getCurrentWeather, getForecast,
  getSkyText, getWeatherEmoji, getWindDirectionText,
  formatTime, formatDate,
  type CurrentWeather, type ForecastItem, type GridXY,
} from '@/lib/weather';
import { showInterstitialAd } from '@/lib/ads';
import { BannerAd, BannerAdPlaceholder } from '@/components/BannerAd';
import { getAirQualityBySido, extractSidoName, getPM25Grade, getPM10Grade, type AirQualityData } from '@/lib/airquality';
import { type SharedWeatherState } from '@/App';

interface Props {
  onNavigateDetail: () => void;
  onStateUpdate: (state: SharedWeatherState) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 날씨 페이지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function WeatherPage({ onNavigateDetail, onStateUpdate }: Props) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('현재 위치');
  const [grid, setGrid] = useState<GridXY | null>(null);
  const [airData, setAirData] = useState<AirQualityData | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const refreshCount = useRef(0);

  // 전면 광고: 새로고침 3회마다 1번 표시
  const maybeShowAd = useCallback(async () => {
    refreshCount.current += 1;
    if (refreshCount.current % 3 === 0) {
      await showInterstitialAd();
    }
  }, []);

  const fetchWeatherData = useCallback(async (nx: number, ny: number) => {
    setLoading(true);
    setError(null);
    try {
      const [cur, fc] = await Promise.all([
        getCurrentWeather(nx, ny),
        getForecast(nx, ny),
      ]);
      setCurrent(cur);
      setForecast(fc);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err.message || '날씨 정보를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('위치 서비스를 지원하지 않는 환경이에요.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const g = latLonToGrid(latitude, longitude);
        setGrid(g);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ko`
          );
          const data = await res.json();
          const a = data.address;
          const city = a?.city || a?.county || a?.town || a?.village || '현재 위치';
          const district = a?.borough || a?.quarter || a?.suburb || '';
          setLocationName(district ? `${city} ${district}` : city);
        } catch { setLocationName('현재 위치'); }
        fetchWeatherData(g.nx, g.ny);
        // 대기질 조회 (에어코리아)
        try {
          const sido = extractSidoName(locationName || '서울');
          const air = await getAirQualityBySido(sido);
          setAirData(air);
        } catch { /* 에어코리아 API 미등록 시 무시 */ }
      },
      () => {
        const def = latLonToGrid(37.5665, 126.978);
        setGrid(def);
        setLocationName('서울');
        fetchWeatherData(def.nx, def.ny);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchWeatherData]);

  useEffect(() => { getLocation(); }, [getLocation]);

  const handleRefresh = () => {
    maybeShowAd();
    if (grid) fetchWeatherData(grid.nx, grid.ny);
    else getLocation();
  };

  // 오늘 시간대 추정
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
  const nearestFc = forecast.find(f => f.date === todayStr && Math.abs(parseInt(f.time.substring(0,2)) - currentHour) <= 1);
  const sky = nearestFc?.sky ?? 1;
  const pty = current?.precipitationType ?? 0;

  // 날짜별 그룹
  const byDate = forecast.reduce<Record<string, ForecastItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  // ── 로딩 스켈레톤 ───────────────
  if (loading && !current) {
    return (
      <div style={styles.container}>
        <div style={{ padding: '20px 20px 0' }}>
          <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 24 }} />
          <div style={styles.card}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
              <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 32 }} />
              <div className="skeleton" style={{ width: 80, height: 48 }} />
              <div className="skeleton" style={{ width: 60, height: 20 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ padding: '0 20px', paddingTop: 'calc(var(--safe-top) + 16px)', paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>

        {/* ── 헤더 ─────────── */}
        <div style={styles.header} className="animate-in">
          <div>
            <div style={styles.locationRow}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#3182F6">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span style={styles.locationText}>{locationName}</span>
            </div>
            {lastUpdated && <span style={styles.updateText}>{lastUpdated} 업데이트</span>}
          </div>
          <button onClick={handleRefresh} style={styles.refreshBtn} disabled={loading}>
            <svg width="18" height="18" fill="none" stroke="#4E5968" strokeWidth="2" viewBox="0 0 24 24"
              style={loading ? { animation: 'spin 1s linear infinite' } : {}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        {/* ── 에러 ─────────── */}
        {error && (
          <div style={styles.errorCard}>
            <span style={{ fontSize: 14 }}>{error}</span>
            <button onClick={handleRefresh} style={styles.retryBtn}>다시 시도</button>
          </div>
        )}

        {/* ── 현재 날씨 카드 ─────────── */}
        {current && (
          <div className="animate-in">
            <div style={styles.card}>
              <div style={styles.currentMain}>
                <span style={{ fontSize: 56 }}>{getWeatherEmoji(sky, pty, currentHour)}</span>
                <div style={styles.tempRow}>
                  <span style={styles.tempNum}>{Math.round(current.temperature)}</span>
                  <span style={styles.tempDeg}>°</span>
                </div>
                <span style={styles.skyLabel}>{getSkyText(sky, pty)}</span>
              </div>
            </div>

            {/* ── 상세 정보 ─────────── */}
            <div style={styles.detailGrid}>
              <DetailCard icon="💧" label="습도" value={`${current.humidity}%`} />
              <DetailCard icon="💨" label="풍속" value={`${current.windSpeed}m/s`} sub={getWindDirectionText(current.windDirection)} />
              <DetailCard icon="☂️" label="강수" value={current.precipitation === '강수없음' || current.precipitation === '0' ? '없음' : current.precipitation} />
            </div>

            {/* ── 미세먼지 미니 카드 ─────────── */}
            {airData && (
              <div style={{ ...styles.card, marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => {
                  onStateUpdate({ current, airData, sky, pty, hour: currentHour });
                  onNavigateDetail();
                }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <AirMiniPill label="초미세" value={airData.pm25} grade={getPM25Grade(airData.pm25)} />
                  <AirMiniPill label="미세" value={airData.pm10} grade={getPM10Grade(airData.pm10)} />
                </div>
                <svg width="16" height="16" fill="none" stroke="#B0B8C1" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}

            {/* ── 상세보기 버튼 ─────────── */}
            <button
              onClick={() => {
                onStateUpdate({ current, airData, sky, pty, hour: currentHour });
                onNavigateDetail();
              }}
              style={styles.detailBtn}
            >
              날씨 상세보기
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ── 배너 광고 ─────────── */}
        <BannerAd />
        {/* 개발 중 광고 영역 확인용 (devMode={true}로 변경) */}
        <BannerAdPlaceholder devMode={false} />

        {/* ── 시간대별 예보 ─────────── */}
        {Object.keys(byDate).length > 0 && (
          <div className="animate-in-delay">
            {Object.entries(byDate).map(([date, items]) => (
              <div key={date} style={{ marginTop: 20 }}>
                <span style={styles.dateLabel}>{formatDate(date)}</span>
                <div style={styles.card}>
                  <div style={styles.forecastScroll} className="scrollbar-hide">
                    {items.map((item, idx) => {
                      const h = parseInt(item.time.substring(0,2));
                      return (
                        <div key={`${item.date}-${item.time}`} style={{
                          ...styles.forecastItem,
                          borderLeft: idx > 0 ? '1px solid var(--toss-gray-100)' : 'none',
                        }}>
                          <span style={styles.fcTime}>{formatTime(item.time)}</span>
                          <span style={{ fontSize: 24, margin: '6px 0 2px' }}>{getWeatherEmoji(item.sky, item.precipitationType, h)}</span>
                          <span style={styles.fcTemp}>{Math.round(item.temperature)}°</span>
                          {item.precipitationProb > 0 && (
                            <span style={styles.fcRain}>{item.precipitationProb}%</span>
                          )}
                          <span style={styles.fcWind}>{item.windSpeed}m/s</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 풋터 ─────────── */}
        <div style={styles.footer}>
          기상청 단기예보 API · 격자 ({grid?.nx ?? '-'}, {grid?.ny ?? '-'})
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상세 정보 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DetailCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={styles.detailCard}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={styles.detailValue}>{value}</span>
      {sub && <span style={styles.detailSub}>{sub}</span>}
      <span style={styles.detailLabel}>{label}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 미세먼지 미니 필
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AirMiniPill({ label, value, grade }: { label: string; value: number; grade: { label: string; color: string; bgColor: string; textColor: string; emoji: string } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#8B95A1' }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 500,
        padding: '3px 10px', borderRadius: 20,
        background: grade.bgColor, color: grade.textColor,
      }}>
        {grade.emoji} {value} {grade.label}
      </span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 인라인 스타일 (TDS 기반)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#F9FAFB',
  },

  // 헤더
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingTop: 4,
  },
  locationRow: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  locationText: {
    fontSize: 17, fontWeight: 600, color: '#191F28',
  },
  updateText: {
    fontSize: 12, color: '#8B95A1', marginLeft: 22, marginTop: 2, display: 'block',
  },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12, border: '1px solid #E5E8EB',
    background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.15s',
  },

  // 에러
  errorCard: {
    background: '#FFF0F0', borderRadius: 12, padding: '14px 16px',
    marginBottom: 16, color: '#F04452', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
  },
  retryBtn: {
    fontSize: 13, color: '#F04452', background: 'transparent', border: 'none',
    textDecoration: 'underline', cursor: 'pointer', fontWeight: 500,
  },

  // 카드 공통
  card: {
    background: '#FFFFFF', borderRadius: 16, border: '1px solid #F2F4F6',
    overflow: 'hidden',
  },

  // 현재 날씨
  currentMain: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '28px 20px 24px', gap: 4,
  },
  tempRow: {
    display: 'flex', alignItems: 'flex-start',
  },
  tempNum: {
    fontSize: 56, fontWeight: 200, color: '#191F28', lineHeight: 1, letterSpacing: -3,
  },
  tempDeg: {
    fontSize: 28, fontWeight: 300, color: '#8B95A1', marginTop: 4,
  },
  skyLabel: {
    fontSize: 16, color: '#4E5968', fontWeight: 500,
  },

  // 상세 그리드
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12,
  },
  detailCard: {
    background: '#FFFFFF', borderRadius: 12, border: '1px solid #F2F4F6',
    padding: '14px 8px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
  },
  detailValue: {
    fontSize: 15, fontWeight: 600, color: '#191F28',
  },
  detailSub: {
    fontSize: 11, color: '#8B95A1',
  },
  detailLabel: {
    fontSize: 12, color: '#8B95A1', marginTop: 2,
  },

  // 날짜 라벨
  dateLabel: {
    fontSize: 14, fontWeight: 600, color: '#4E5968',
    display: 'block', marginBottom: 8, paddingLeft: 4,
  },

  // 시간대별 예보
  forecastScroll: {
    display: 'flex', overflowX: 'auto', minWidth: '100%',
  },
  forecastItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '16px 14px', minWidth: 72, flexShrink: 0,
  },
  fcTime: { fontSize: 12, color: '#8B95A1' },
  fcTemp: { fontSize: 15, fontWeight: 600, color: '#191F28' },
  fcRain: { fontSize: 11, color: '#3182F6', marginTop: 2 },
  fcWind: { fontSize: 10, color: '#B0B8C1', marginTop: 2 },

  // 상세보기 버튼
  detailBtn: {
    width: '100%', padding: '14px 0', marginTop: 10,
    borderRadius: 12, border: '1px solid #E5E8EB', background: '#FFFFFF',
    fontSize: 14, fontWeight: 500, color: '#4E5968',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    cursor: 'pointer', transition: 'background 0.15s',
  },

  // 풋터
  footer: {
    textAlign: 'center', fontSize: 11, color: '#B0B8C1',
    marginTop: 24, paddingBottom: 8,
  },
};
