// ============================================================
// 에어코리아 대기질 API + 체감온도/UV 유틸리티
// ============================================================
// API 발급: https://www.data.go.kr → "에어코리아_대기오염정보" 검색 → 활용 신청
// ⚠️ 기상청 API키와 별도로 에어코리아 API도 신청해야 합니다
// ============================================================

// ⚠️ 에어코리아 API키 (data.go.kr 기상청 API와 동일 키 사용 가능)
const AIR_SERVICE_KEY = 'cc6ebdd36c8e107f3508da6394d1d81d6c28b6481bd8c235bc1535cb08eb2842';

const AIR_BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';
const STATION_BASE = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc';

// ── 대기질 등급 정의 ────────────────────────────────────────
export type AirGrade = 'good' | 'moderate' | 'bad' | 'veryBad';

export interface AirGradeInfo {
  grade: AirGrade;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  emoji: string;
}

const GRADE_MAP: Record<AirGrade, AirGradeInfo> = {
  good:     { grade: 'good',     label: '좋음',     color: '#3182F6', bgColor: '#E8F3FF', textColor: '#185FA5', emoji: '😊' },
  moderate: { grade: 'moderate', label: '보통',     color: '#1D9E75', bgColor: '#E1F5EE', textColor: '#0F6E56', emoji: '🙂' },
  bad:      { grade: 'bad',      label: '나쁨',     color: '#EF9F27', bgColor: '#FAEEDA', textColor: '#854F0B', emoji: '😷' },
  veryBad:  { grade: 'veryBad',  label: '매우나쁨', color: '#F04452', bgColor: '#FFF0F0', textColor: '#A32D2D', emoji: '🚨' },
};

// PM2.5 초미세먼지 등급 (μg/m³)
export function getPM25Grade(value: number): AirGradeInfo {
  if (value <= 15) return GRADE_MAP.good;
  if (value <= 35) return GRADE_MAP.moderate;
  if (value <= 75) return GRADE_MAP.bad;
  return GRADE_MAP.veryBad;
}

// PM10 미세먼지 등급 (μg/m³)
export function getPM10Grade(value: number): AirGradeInfo {
  if (value <= 30) return GRADE_MAP.good;
  if (value <= 80) return GRADE_MAP.moderate;
  if (value <= 150) return GRADE_MAP.bad;
  return GRADE_MAP.veryBad;
}

// 통합대기환경지수(CAI) 등급
export function getCAIGrade(value: number): AirGradeInfo {
  if (value <= 50) return GRADE_MAP.good;
  if (value <= 100) return GRADE_MAP.moderate;
  if (value <= 250) return GRADE_MAP.bad;
  return GRADE_MAP.veryBad;
}

// UV지수 등급
export function getUVGrade(value: number): AirGradeInfo & { label: string } {
  if (value <= 2) return { ...GRADE_MAP.good, label: '낮음' };
  if (value <= 5) return { ...GRADE_MAP.moderate, label: '보통' };
  if (value <= 7) return { ...GRADE_MAP.bad, label: '높음' };
  return { ...GRADE_MAP.veryBad, label: '매우높음' };
}

// ── 게이지 퍼센트 계산 ──────────────────────────────────────
export function getPM25Percent(value: number): number {
  return Math.min(100, Math.round((value / 150) * 100));
}

export function getPM10Percent(value: number): number {
  return Math.min(100, Math.round((value / 300) * 100));
}

// ── 체감온도 계산 ────────────────────────────────────────────
export function getFeelsLikeTemp(temp: number, humidity: number, windSpeed: number): number {
  // 체감온도 (한국 기상청 기준)
  if (temp <= 10) {
    // 풍랭 지수 (Wind Chill)
    const v = windSpeed * 3.6; // m/s → km/h
    if (v < 4.8) return Math.round(temp);
    return Math.round(
      13.12 + 0.6215 * temp - 11.37 * Math.pow(v, 0.16) + 0.3965 * temp * Math.pow(v, 0.16)
    );
  }
  if (temp >= 25) {
    // 열지수 (Heat Index) - 간이 공식
    return Math.round(
      -8.785 + 1.611 * temp + 2.339 * humidity
      - 0.1461 * temp * humidity - 0.01231 * temp * temp
      - 0.01642 * humidity * humidity
      + 0.002212 * temp * temp * humidity
      + 0.0007255 * temp * humidity * humidity
      - 0.000003582 * temp * temp * humidity * humidity
    );
  }
  return Math.round(temp);
}

// ── 에어코리아 API 호출 ──────────────────────────────────────
export interface AirQualityData {
  pm25: number;       // 초미세먼지 (μg/m³)
  pm10: number;       // 미세먼지 (μg/m³)
  o3: number;         // 오존 (ppm)
  no2: number;        // 이산화질소 (ppm)
  co: number;         // 일산화탄소 (ppm)
  so2: number;        // 아황산가스 (ppm)
  khai: number;       // 통합대기환경지수
  khaiGrade: string;  // 통합지수 등급
  stationName: string;
  dataTime: string;
}

/**
 * 근접 측정소 조회 (TM 좌표 기반)
 */
async function getNearestStation(tmX: number, tmY: number): Promise<string> {
  const url = new URL(`${STATION_BASE}/getNearbyMsrstnList`);
  url.searchParams.set('serviceKey', AIR_SERVICE_KEY);
  url.searchParams.set('returnType', 'json');
  url.searchParams.set('tmX', tmX.toString());
  url.searchParams.set('tmY', tmY.toString());

  const res = await fetch(url.toString());
  const json = await res.json();
  const items = json?.response?.body?.items;
  if (!items || items.length === 0) throw new Error('근접 측정소를 찾을 수 없습니다.');
  return items[0].stationName;
}

/**
 * 시도별 실시간 측정정보 조회
 * (근접 측정소 조회가 복잡할 경우 이 방식 사용)
 */
export async function getAirQualityBySido(sidoName: string): Promise<AirQualityData | null> {
  if (!AIR_SERVICE_KEY) return null;

  try {
    const url = new URL(`${AIR_BASE}/getCtprvnRltmMesureDnsty`);
    url.searchParams.set('serviceKey', AIR_SERVICE_KEY);
    url.searchParams.set('returnType', 'json');
    url.searchParams.set('numOfRows', '1');
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('sidoName', sidoName);
    url.searchParams.set('ver', '1.3');

    const res = await fetch(url.toString());
    const json = await res.json();
    const items = json?.response?.body?.items;
    if (!items || items.length === 0) return null;

    const item = items[0];
    return {
      pm25: parseFloat(item.pm25Value) || 0,
      pm10: parseFloat(item.pm10Value) || 0,
      o3: parseFloat(item.o3Value) || 0,
      no2: parseFloat(item.no2Value) || 0,
      co: parseFloat(item.coValue) || 0,
      so2: parseFloat(item.so2Value) || 0,
      khai: parseFloat(item.khaiValue) || 0,
      khaiGrade: item.khaiGrade || '',
      stationName: item.stationName || '',
      dataTime: item.dataTime || '',
    };
  } catch (err) {
    console.warn('[AIR] 대기질 조회 실패:', err);
    return null;
  }
}

/**
 * 측정소별 실시간 측정정보 조회
 */
export async function getAirQualityByStation(stationName: string): Promise<AirQualityData | null> {
  if (!AIR_SERVICE_KEY) return null;

  try {
    const url = new URL(`${AIR_BASE}/getMsrstnAcctoRltmMesureDnsty`);
    url.searchParams.set('serviceKey', AIR_SERVICE_KEY);
    url.searchParams.set('returnType', 'json');
    url.searchParams.set('numOfRows', '1');
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('stationName', stationName);
    url.searchParams.set('dataTerm', 'DAILY');
    url.searchParams.set('ver', '1.3');

    const res = await fetch(url.toString());
    const json = await res.json();
    const items = json?.response?.body?.items;
    if (!items || items.length === 0) return null;

    const item = items[0];
    return {
      pm25: parseFloat(item.pm25Value) || 0,
      pm10: parseFloat(item.pm10Value) || 0,
      o3: parseFloat(item.o3Value) || 0,
      no2: parseFloat(item.no2Value) || 0,
      co: parseFloat(item.coValue) || 0,
      so2: parseFloat(item.so2Value) || 0,
      khai: parseFloat(item.khaiValue) || 0,
      khaiGrade: item.khaiGrade || '',
      stationName: item.stationName || '',
      dataTime: item.dataTime || '',
    };
  } catch (err) {
    console.warn('[AIR] 대기질 조회 실패:', err);
    return null;
  }
}

// ── 시도명 추출 헬퍼 ─────────────────────────────────────────
// 주소 문자열에서 시도명 추출 (에어코리아 API 파라미터용)
export function extractSidoName(address: string): string {
  const sidoMap: Record<string, string> = {
    '서울': '서울', '부산': '부산', '대구': '대구', '인천': '인천',
    '광주': '광주', '대전': '대전', '울산': '울산', '세종': '세종',
    '경기': '경기', '강원': '강원', '충북': '충북', '충남': '충남',
    '전북': '전북', '전남': '전남', '경북': '경북', '경남': '경남',
    '제주': '제주',
  };
  for (const [key, value] of Object.entries(sidoMap)) {
    if (address.includes(key)) return value;
  }
  return '서울'; // 기본값
}
