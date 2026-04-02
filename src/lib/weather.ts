// ============================================================
// 기상청 단기예보 API 유틸리티
// ============================================================

const API_BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const SERVICE_KEY = "cc6ebdd36c8e107f3508da6394d1d81d6c28b6481bd8c235bc1535cb08eb2842";

// ── 위경도 → 격자 변환 (LCC Projection) ──────────────────────
const RE = 6371.00877;
const GRID = 5.0;
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0;
const OLAT = 38.0;
const XO = 43;
const YO = 136;

export interface GridXY {
  nx: number;
  ny: number;
}

export function latLonToGrid(lat: number, lon: number): GridXY {
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

// ── 날짜/시간 유틸 ───────────────────────────────────────────
function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function getBaseDateTime(type: "ncst" | "fcst" | "ultra"): {
  baseDate: string;
  baseTime: string;
} {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 30);

  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = now.getHours();

  if (type === "ncst") {
    return { baseDate: `${y}${m}${d}`, baseTime: `${pad(h)}00` };
  }

  if (type === "ultra") {
    return { baseDate: `${y}${m}${d}`, baseTime: `${pad(h)}30` };
  }

  const baseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseH = baseTimes[0];
  let baseD = new Date(now);

  for (let i = baseTimes.length - 1; i >= 0; i--) {
    if (h >= baseTimes[i]) {
      baseH = baseTimes[i];
      break;
    }
  }

  if (h < 2) {
    baseD.setDate(baseD.getDate() - 1);
    baseH = 23;
  }

  const by = baseD.getFullYear();
  const bm = pad(baseD.getMonth() + 1);
  const bd = pad(baseD.getDate());

  return { baseDate: `${by}${bm}${bd}`, baseTime: `${pad(baseH)}00` };
}

// ── API 호출 ─────────────────────────────────────────────────
interface KMAItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
  obsrValue?: string;
}

async function fetchKMA(
  operation: string,
  params: Record<string, string>
): Promise<KMAItem[]> {
  const url = new URL(`${API_BASE}${operation}`);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);

  const json = await res.json();
  const items = json?.response?.body?.items?.item;
  if (!items) {
    const code = json?.response?.header?.resultCode;
    const msg = json?.response?.header?.resultMsg;
    throw new Error(`API 오류: [${code}] ${msg}`);
  }
  return items;
}

// ── 초단기실황 조회 ──────────────────────────────────────────
export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitationType: number;
  precipitation: string;
}

export async function getCurrentWeather(nx: number, ny: number): Promise<CurrentWeather> {
  const { baseDate, baseTime } = getBaseDateTime("ncst");
  const items = await fetchKMA("/getUltraSrtNcst", {
    base_date: baseDate,
    base_time: baseTime,
    nx: nx.toString(),
    ny: ny.toString(),
  });

  const result: CurrentWeather = {
    temperature: 0, humidity: 0, windSpeed: 0,
    windDirection: 0, precipitationType: 0, precipitation: "0",
  };

  items.forEach((item) => {
    const val = item.obsrValue ?? item.fcstValue;
    switch (item.category) {
      case "T1H": result.temperature = parseFloat(val); break;
      case "REH": result.humidity = parseFloat(val); break;
      case "WSD": result.windSpeed = parseFloat(val); break;
      case "VEC": result.windDirection = parseFloat(val); break;
      case "PTY": result.precipitationType = parseInt(val); break;
      case "RN1": result.precipitation = val; break;
    }
  });

  return result;
}

// ── 단기예보 조회 ────────────────────────────────────────────
export interface ForecastItem {
  date: string;
  time: string;
  temperature: number;
  sky: number;
  precipitationProb: number;
  precipitationType: number;
  windSpeed: number;
  humidity: number;
  minTemp?: number;
  maxTemp?: number;
}

export async function getForecast(nx: number, ny: number): Promise<ForecastItem[]> {
  const { baseDate, baseTime } = getBaseDateTime("fcst");
  const items = await fetchKMA("/getVilageFcst", {
    base_date: baseDate,
    base_time: baseTime,
    nx: nx.toString(),
    ny: ny.toString(),
  });

  const grouped: Record<string, Partial<ForecastItem>> = {};

  items.forEach((item) => {
    const key = `${item.fcstDate}-${item.fcstTime}`;
    if (!grouped[key]) {
      grouped[key] = { date: item.fcstDate, time: item.fcstTime };
    }
    const val = item.fcstValue;
    switch (item.category) {
      case "TMP": grouped[key].temperature = parseFloat(val); break;
      case "SKY": grouped[key].sky = parseInt(val); break;
      case "POP": grouped[key].precipitationProb = parseInt(val); break;
      case "PTY": grouped[key].precipitationType = parseInt(val); break;
      case "WSD": grouped[key].windSpeed = parseFloat(val); break;
      case "REH": grouped[key].humidity = parseInt(val); break;
      case "TMN": grouped[key].minTemp = parseFloat(val); break;
      case "TMX": grouped[key].maxTemp = parseFloat(val); break;
    }
  });

  return Object.values(grouped)
    .filter((item) => item.temperature !== undefined)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)) as ForecastItem[];
}

// ── 날씨 코드 → 텍스트/이모지 ───────────────────────────────
export function getSkyText(sky: number, pty: number): string {
  if (pty > 0) {
    const map: Record<number, string> = { 1: "비", 2: "비/눈", 3: "눈", 5: "빗방울", 6: "빗방울/눈날림", 7: "눈날림" };
    return map[pty] || "강수";
  }
  const map: Record<number, string> = { 1: "맑음", 3: "구름많음", 4: "흐림" };
  return map[sky] || "맑음";
}

export function getWeatherEmoji(sky: number, pty: number, hour?: number): string {
  const isNight = hour !== undefined && (hour >= 18 || hour < 6);
  if (pty > 0) {
    if (pty === 3 || pty === 7) return "❄️";
    if (pty === 2 || pty === 6) return "🌨️";
    return "🌧️";
  }
  if (sky === 1) return isNight ? "🌙" : "☀️";
  if (sky === 3) return isNight ? "☁️" : "⛅";
  return "☁️";
}

export function getWindDirectionText(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function formatTime(time: string): string {
  const h = parseInt(time.substring(0, 2));
  if (h === 0) return "자정";
  if (h === 12) return "정오";
  return h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
}

export function formatDate(dateStr: string): string {
  const y = parseInt(dateStr.substring(0, 4));
  const m = parseInt(dateStr.substring(4, 6));
  const d = parseInt(dateStr.substring(6, 8));
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  const dayNames = ["일","월","화","수","목","금","토"];
  const dayName = dayNames[date.getDay()];
  if (diff === 0) return `오늘 (${dayName})`;
  if (diff === 1) return `내일 (${dayName})`;
  if (diff === 2) return `모레 (${dayName})`;
  return `${m}/${d} (${dayName})`;
}
