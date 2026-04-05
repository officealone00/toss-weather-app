export const AD_CONFIG = {
  BANNER_AD_GROUP_ID: 'ait.v2.live.7a0042240f4a41bb',
  INTERSTITIAL_AD_GROUP_ID: 'ait.v2.live.ea9d6f49a0f1484d',
};

export function isAdConfigured(type: 'banner' | 'interstitial'): boolean {
  switch (type) {
    case 'banner': return AD_CONFIG.BANNER_AD_GROUP_ID.length > 0;
    case 'interstitial': return AD_CONFIG.INTERSTITIAL_AD_GROUP_ID.length > 0;
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
