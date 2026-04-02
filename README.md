# 🌤️ 오늘날씨 — 앱인토스 미니앱

기상청 단기예보 API를 활용한 날씨 미니앱입니다.
토스 앱 3,000만 사용자에게 서비스할 수 있는 앱인토스(Apps in Toss) 미니앱으로 제작되었습니다.

## 기능

- 📍 현재 위치 기반 실시간 날씨 (기온, 습도, 풍속, 강수)
- 📊 시간대별 예보 (오늘~모레)
- 🎨 토스 디자인 시스템(TDS) 기반 UI
- 📱 토스 앱 내 모바일 최적화

## 시작하기

### 1. 앱인토스 콘솔 등록

1. [앱인토스 콘솔](https://apps-in-toss.toss.im/)에 접속하여 계정 생성
2. 워크스페이스 생성 후 미니앱 등록
3. 앱 이름(appName)을 확인합니다

### 2. 프로젝트 설정

```bash
# 의존성 설치
npm install

# granite.config.ts에서 appName 수정
# ⚠️ 콘솔에서 등록한 앱 이름으로 변경하세요
```

### 3. 로컬 개발

```bash
# 개발 서버 실행
npm run dev
```

### 4. 샌드박스 테스트

1. 앱인토스 샌드박스 앱 설치 (iOS / Android)
2. 핸드폰과 PC를 같은 Wi-Fi에 연결
3. 샌드박스 앱에서 `intoss://toss-weather` 입력 (appName에 맞게 변경)
4. 로컬 서버에 연결되어 테스트 가능

### 5. 빌드 & 배포

```bash
# .ait 번들 빌드
npm run ait:build

# 콘솔에 배포 (API 키 필요)
npm run ait:deploy
```

### 6. 출시

1. 앱인토스 콘솔에서 '검토 요청하기' 클릭
2. 검수 통과 (영업일 2~3일)
3. '출시하기' 클릭 → 토스 사용자에게 공개!

## 프로젝트 구조

```
toss-weather/
├── granite.config.ts    # 앱인토스 설정 (appName, 권한 등)
├── vite.config.ts       # Vite 빌드 설정
├── package.json
├── index.html
└── src/
    ├── main.tsx         # 엔트리포인트
    ├── App.tsx          # 루트 컴포넌트
    ├── index.css        # TDS 기반 글로벌 스타일
    ├── lib/
    │   └── weather.ts   # 기상청 API, 격자 변환, 유틸리티
    └── pages/
        └── WeatherPage.tsx  # 메인 날씨 페이지
```

## 체크리스트 (검수 전 확인)

- [ ] `granite.config.ts`의 appName을 콘솔 등록명과 일치시킴
- [ ] `granite.config.ts`의 displayName에 한글 이름 입력
- [ ] `granite.config.ts`의 icon에 앱 아이콘 URL 입력
- [ ] 위치 권한 요청이 정상 동작하는지 확인
- [ ] 기상청 API 호출이 정상인지 확인 (CORS)
- [ ] TDS 컴포넌트 스타일 적용 확인
- [ ] Safe area (노치) 대응 확인

## CORS 설정

기상청 API 서버의 CORS 허용 목록에 아래 도메인을 추가해야 할 수 있습니다:
- 실제 환경: `https://<appName>.apps.tossmini.com`
- 테스트 환경: `https://<appName>.private-apps.tossmini.com`

> 기상청 API(data.go.kr)는 대부분의 도메인에서 CORS를 허용하므로
> 별도 설정 없이 동작할 가능성이 높습니다.

## 참고 링크

- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [WebView SDK 가이드](https://developers-apps-in-toss.toss.im/tutorials/webview.html)
- [앱인토스 예제 모음](https://github.com/toss/apps-in-toss-examples)
- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame.html)
