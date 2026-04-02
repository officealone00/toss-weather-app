// ============================================================
// 앱인토스 인앱 광고 유틸리티
// ============================================================
// 광고 그룹 ID는 앱인토스 콘솔 > 수익화 > 인앱 광고에서 생성
// ⚠️ 테스트 시 반드시 테스트용 ID 사용 (운영 ID 사용 시 제재 가능)
// ============================================================

/**
 * 광고 설정
 * 앱인토스 콘솔에서 발급받은 광고 그룹 ID를 여기에 입력하세요.
 */
export const AD_CONFIG = {
  // ⚠️ 아래 ID를 실제 광고 그룹 ID로 교체하세요
  BANNER_AD_GROUP_ID: '',         // 배너 광고 그룹 ID
  INTERSTITIAL_AD_GROUP_ID: '',   // 전면형 광고 그룹 ID
  REWARDED_AD_GROUP_ID: '',       // 보상형 광고 그룹 ID
};

/**
 * 광고 ID가 설정되어 있는지 확인
 */
export function isAdConfigured(type: 'banner' | 'interstitial' | 'rewarded'): boolean {
  switch (type) {
    case 'banner':
      return AD_CONFIG.BANNER_AD_GROUP_ID.length > 0;
    case 'interstitial':
      return AD_CONFIG.INTERSTITIAL_AD_GROUP_ID.length > 0;
    case 'rewarded':
      return AD_CONFIG.REWARDED_AD_GROUP_ID.length > 0;
  }
}

/**
 * 전면형 광고 표시
 * 날씨 페이지 진입 시, 또는 새로고침 N회마다 호출
 */
export async function showInterstitialAd(): Promise<boolean> {
  if (!isAdConfigured('interstitial')) return false;

  try {
    // 앱인토스 SDK의 광고 API 호출
    // @ts-ignore — SDK 런타임에서 주입됨
    const { showInterstitialAd } = await import('@apps-in-toss/web-framework/ads');
    await showInterstitialAd({ adGroupId: AD_CONFIG.INTERSTITIAL_AD_GROUP_ID });
    return true;
  } catch (err) {
    console.warn('[AD] 전면 광고 표시 실패:', err);
    return false;
  }
}

/**
 * 보상형 광고 표시
 * 예: "광고 보고 상세 예보 보기" 같은 플로우에 활용
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!isAdConfigured('rewarded')) return false;

  try {
    // @ts-ignore
    const { showRewardedAd } = await import('@apps-in-toss/web-framework/ads');
    const result = await showRewardedAd({ adGroupId: AD_CONFIG.REWARDED_AD_GROUP_ID });
    return result?.rewarded === true;
  } catch (err) {
    console.warn('[AD] 보상형 광고 표시 실패:', err);
    return false;
  }
}
