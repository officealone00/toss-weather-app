import { CSSProperties } from 'react';
import {
  type AirQualityData,
  type AirGradeInfo,
  getPM25Grade, getPM10Grade, getCAIGrade, getUVGrade,
  getPM25Percent, getPM10Percent,
  getFeelsLikeTemp,
} from '@/lib/airquality';
import { type CurrentWeather, getSkyText, getWeatherEmoji, getWindDirectionText } from '@/lib/weather';

interface Props {
  current: CurrentWeather | null;
  airData: AirQualityData | null;
  sky: number;
  pty: number;
  hour: number;
  onBack: () => void;
}

export default function WeatherDetail({ current, airData, sky, pty, hour, onBack }: Props) {
  if (!current) return null;

  const feelsLike = getFeelsLikeTemp(current.temperature, current.humidity, current.windSpeed);
  const feelsLikeDiff = feelsLike - Math.round(current.temperature);
  const feelsLikeLabel = feelsLikeDiff > 0 ? `실제보다 ${feelsLikeDiff}° 높음` : feelsLikeDiff < 0 ? `실제보다 ${Math.abs(feelsLikeDiff)}° 낮음` : '실제와 동일';

  const estimatedUV = pty > 0 ? 1 : sky === 1 ? (hour >= 10 && hour <= 14 ? 7 : hour >= 8 && hour <= 16 ? 5 : 2) : sky === 3 ? 3 : 2;
  const uvInfo = getUVGrade(estimatedUV);

  return (
    <div style={styles.container}>
      <div style={{ padding: '0 20px', paddingTop: 'calc(var(--safe-top) + 16px)', paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>

        <div style={styles.header} className="animate-in">
          <button onClick={onBack} style={styles.backBtn}>
            <svg width="20" height="20" fill="none" stroke="#191F28" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span style={styles.headerTitle}>날씨 상세</span>
          <div style={{ width: 40 }} />
        </div>

        <div style={styles.card} className="animate-in">
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🌡️</span>
            <span style={styles.cardLabel}>체감온도</span>
          </div>
          <div style={styles.feelsLikeRow}>
            <span style={styles.feelsLikeNum}>{feelsLike}°</span>
            <div style={styles.feelsLikeMeta}>
              <span style={styles.feelsLikeActual}>실제 {Math.round(current.temperature)}°</span>
              <span style={styles.feelsLikeDiff}>{feelsLikeLabel}</span>
            </div>
          </div>
          <span style={styles.cardSub}>{getSkyText(sky, pty)} {getWeatherEmoji(sky, pty, hour)}</span>
        </div>

        <div style={styles.sectionTitle} className="animate-in">대기질</div>

        {airData ? (
          <div className="animate-in">
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardIcon}>🌍</span>
                <span style={styles.cardLabel}>통합대기환경지수</span>
                <GradeBadge info={getCAIGrade(airData.khai)} />
              </div>
              <div style={styles.stationInfo}>
                측정소: {airData.stationName} · {airData.dataTime}
              </div>
            </div>

            <DustGauge label="초미세먼지 (PM2.5)" value={airData.pm25} unit="μg/m³" gradeInfo={getPM25Grade(airData.pm25)} percent={getPM25Percent(airData.pm25)} thresholds={['0', '15', '35', '75', '150']} />
            <DustGauge label="미세먼지 (PM10)" value={airData.pm10} unit="μg/m³" gradeInfo={getPM10Grade(airData.pm10)} percent={getPM10Percent(airData.pm10)} thresholds={['0', '30', '80', '150', '300']} />
          </div>
        ) : (
          <div style={styles.card} className="animate-in">
            <div style={styles.noDataBox}>
              <span style={styles.noDataEmoji}>💨</span>
              <span style={styles.noDataText}>에어코리아 API키를 등록하면</span>
              <span style={styles.noDataText}>미세먼지 정보를 볼 수 있어요</span>
              <span style={styles.noDataSub}>src/lib/airquality.ts → AIR_SERVICE_KEY</span>
            </div>
          </div>
        )}

        <div style={styles.card} className="animate-in">
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>☀️</span>
            <span style={styles.cardLabel}>자외선 지수</span>
            <GradeBadge info={uvInfo} customLabel={uvInfo.label} />
          </div>
          <div style={styles.uvRow}>
            <span style={styles.uvNum}>{estimatedUV}</span>
            <span style={styles.uvScale}> / 11</span>
          </div>
          <UVBar value={estimatedUV} />
          <span style={styles.cardSub}>
            {estimatedUV <= 2 ? '자외선 걱정 없어요' : estimatedUV <= 5 ? '외출 시 자외선 차단제 권장' : estimatedUV <= 7 ? '모자와 선글라스를 착용하세요' : '외출을 자제하세요'}
          </span>
        </div>

        <div style={styles.sectionTitle} className="animate-in">상세 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="animate-in">
          <InfoCard icon="💧" label="습도" value={`${current.humidity}%`} sub={current.humidity >= 80 ? '매우 높음' : current.humidity >= 60 ? '높음' : current.humidity >= 40 ? '적정' : '건조'} />
          <InfoCard icon="💨" label="풍속" value={`${current.windSpeed}m/s`} sub={getWindDirectionText(current.windDirection) + '풍'} />
          <InfoCard icon="☔" label="강수" value={current.precipitation === '강수없음' || current.precipitation === '0' ? '없음' : current.precipitation} sub={pty === 0 ? '강수 없음' : pty === 1 ? '비' : pty === 3 ? '눈' : '혼합'} />
          <InfoCard icon="🧭" label="풍향" value={`${current.windDirection}°`} sub={getWindDirectionText(current.windDirection)} />
        </div>
      </div>
    </div>
  );
}

function DustGauge({ label, value, unit, gradeInfo, percent, thresholds }: { label: string; value: number; unit: string; gradeInfo: AirGradeInfo; percent: number; thresholds: string[]; }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardLabel}>{label}</span>
        <GradeBadge info={gradeInfo} />
      </div>
      <div style={styles.dustValueRow}>
        <span style={{ ...styles.dustValue, color: gradeInfo.color }}>{value}</span>
        <span style={styles.dustUnit}>{unit}</span>
      </div>
      <div style={styles.gaugeTrack}>
        <div style={styles.gaugeGood} />
        <div style={styles.gaugeModerate} />
        <div style={styles.gaugeBad} />
        <div style={styles.gaugeVeryBad} />
        <div style={{ position: 'absolute' as const, left: `${Math.min(97, Math.max(2, percent))}%`, top: -3, width: 12, height: 12, borderRadius: 6, background: gradeInfo.color, border: '2px solid #FFFFFF', transform: 'translateX(-50%)', transition: 'left 0.6s ease-out' }} />
      </div>
      <div style={styles.gaugeLabels}>
        {thresholds.map((t, i) => <span key={i} style={styles.gaugeLabel}>{t}</span>)}
      </div>
    </div>
  );
}

function GradeBadge({ info, customLabel }: { info: AirGradeInfo; customLabel?: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: info.bgColor, color: info.textColor, marginLeft: 'auto' }}>
      {info.emoji} {customLabel || info.label}
    </span>
  );
}

function UVBar({ value }: { value: number }) {
  const percent = Math.min(100, (value / 11) * 100);
  return (
    <div style={{ position: 'relative' as const, height: 6, borderRadius: 3, background: '#F2F4F6', margin: '12px 0 4px', overflow: 'visible' as const }}>
      <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: '25%', background: '#3182F6', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute' as const, left: '25%', top: 0, height: '100%', width: '25%', background: '#1D9E75' }} />
      <div style={{ position: 'absolute' as const, left: '50%', top: 0, height: '100%', width: '25%', background: '#EF9F27' }} />
      <div style={{ position: 'absolute' as const, left: '75%', top: 0, height: '100%', width: '25%', background: '#F04452', borderRadius: '0 3px 3px 0' }} />
      <div style={{ position: 'absolute' as const, left: `${Math.min(97, Math.max(2, percent))}%`, top: -4, width: 14, height: 14, borderRadius: 7, background: '#FFFFFF', border: `3px solid ${value <= 2 ? '#3182F6' : value <= 5 ? '#1D9E75' : value <= 7 ? '#EF9F27' : '#F04452'}`, transform: 'translateX(-50%)', transition: 'left 0.6s ease-out' }} />
    </div>
  );
}

function InfoCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#8B95A1' }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 500, color: '#191F28' }}>{value}</span>
      <span style={{ fontSize: 12, color: '#B0B8C1', marginTop: 2, display: 'block' }}>{sub}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { minHeight: '100vh', background: '#F9FAFB' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, border: '1px solid #E5E8EB', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontSize: 17, fontWeight: 500, color: '#191F28' },
  sectionTitle: { fontSize: 14, fontWeight: 500, color: '#4E5968', marginTop: 20, marginBottom: 10, paddingLeft: 4 },
  card: { background: '#FFF', borderRadius: 16, border: '1px solid #F2F4F6', padding: '16px 18px', marginBottom: 10 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardIcon: { fontSize: 16 },
  cardLabel: { fontSize: 14, fontWeight: 500, color: '#191F28' },
  cardSub: { fontSize: 13, color: '#8B95A1', marginTop: 4, display: 'block' },
  feelsLikeRow: { display: 'flex', alignItems: 'center', gap: 16 },
  feelsLikeNum: { fontSize: 48, fontWeight: 200, color: '#191F28', letterSpacing: -2, lineHeight: 1 },
  feelsLikeMeta: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  feelsLikeActual: { fontSize: 14, color: '#4E5968', fontWeight: 500 },
  feelsLikeDiff: { fontSize: 13, color: '#8B95A1' },
  stationInfo: { fontSize: 12, color: '#B0B8C1' },
  dustValueRow: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 },
  dustValue: { fontSize: 32, fontWeight: 500, lineHeight: 1 },
  dustUnit: { fontSize: 13, color: '#B0B8C1' },
  gaugeTrack: { position: 'relative' as const, height: 6, borderRadius: 3, background: '#F2F4F6', margin: '0 0 8px', overflow: 'visible' as const },
  gaugeGood: { position: 'absolute' as const, left: 0, top: 0, height: '100%', width: '25%', background: '#3182F6', borderRadius: '3px 0 0 3px' },
  gaugeModerate: { position: 'absolute' as const, left: '25%', top: 0, height: '100%', width: '25%', background: '#1D9E75' },
  gaugeBad: { position: 'absolute' as const, left: '50%', top: 0, height: '100%', width: '25%', background: '#EF9F27' },
  gaugeVeryBad: { position: 'absolute' as const, left: '75%', top: 0, height: '100%', width: '25%', background: '#F04452', borderRadius: '0 3px 3px 0' },
  gaugeLabels: { display: 'flex', justifyContent: 'space-between' },
  gaugeLabel: { fontSize: 11, color: '#B0B8C1' },
  uvRow: { display: 'flex', alignItems: 'baseline', marginBottom: 4 },
  uvNum: { fontSize: 28, fontWeight: 500, color: '#191F28' },
  uvScale: { fontSize: 14, color: '#B0B8C1' },
  noDataBox: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '20px 0', gap: 4 },
  noDataEmoji: { fontSize: 32, marginBottom: 8 },
  noDataText: { fontSize: 14, color: '#8B95A1' },
  noDataSub: { fontSize: 12, color: '#B0B8C1', marginTop: 4, fontFamily: 'monospace' },
};
