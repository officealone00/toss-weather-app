export const AD_CONFIG = {
  BANNER_AD_GROUP_ID: '',
  INTERSTITIAL_AD_GROUP_ID: '',
  REWARDED_AD_GROUP_ID: '',
};

export function isAdConfigured(type: 'banner' | 'interstitial' | 'rewarded'): boolean {
  switch (type) {
    case 'banner': return AD_CONFIG.BANNER_AD_GROUP_ID.length > 0;
    case 'interstitial': return AD_CONFIG.INTERSTITIAL_AD_GROUP_ID.length > 0;
    case 'rewarded': return AD_CONFIG.REWARDED_AD_GROUP_ID.length > 0;
  }
}

export async function showInterstitialAd(): Promise<boolean> {
  if (!isAdConfigured('interstitial')) return false;
  try {
    const sdk = await (Function('return import("@apps-in-toss/web-framework/ads")')());
    await sdk.showInterstitialAd({ adGroupId: AD_CONFIG.INTERSTITIAL_AD_GROUP_ID });
    return true;
  } catch { return false; }
}

export async function showRewardedAd(): Promise<boolean> {
  if (!isAdConfigured('rewarded')) return false;
  try {
    const sdk = await (Function('return import("@apps-in-toss/web-framework/ads")')());
    const result = await sdk.showRewardedAd({ adGroupId: AD_CONFIG.REWARDED_AD_GROUP_ID });
    return result?.rewarded === true;
  } catch { return false; }
}
