// ============================================================
// 앱인토스 인앱 광고 설정
// ⚠️ 광고 그룹 ID가 구글 반영되면 아래에 입력하세요
// ============================================================

export const AD_CONFIG = {
  // 배너 광고 (홈 화면 상단 - 현재 날씨 아래)
  BANNER_TOP_ID: '',
  // 배너 광고 (홈 화면 하단 - 예보 사이)
  BANNER_BOTTOM_ID: '',
  // 전면 광고 (상세보기 진입 시)
  INTERSTITIAL_ID: '',
};

export function isAdReady(id: string): boolean {
  return id.length > 0;
}

// 전면 광고 표시 후 콜백 실행
export async function showInterstitialThenNavigate(onComplete: () => void): Promise<void> {
  if (!isAdReady(AD_CONFIG.INTERSTITIAL_ID)) {
    onComplete();
    return;
  }
  try {
    const sdk = await (Function('return import("@apps-in-toss/web-framework/ads")')());
    await sdk.showInterstitialAd({ adGroupId: AD_CONFIG.INTERSTITIAL_ID });
    onComplete();
  } catch {
    onComplete();
  }
}
