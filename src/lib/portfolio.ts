export const PORTFOLIO_CATEGORIES: Record<string, string> = {
  product_photo: "Photographie produit",
  ugc_video: "Vidéo UGC",
  video_ad: "Publicité vidéo",
  lifestyle: "Lifestyle",
  unboxing: "Unboxing",
  design: "Design",
};

const LEGACY: Record<string, string> = {
  "Product Photography": "product_photo",
  "UGC Video": "ugc_video",
  "Video Ad": "video_ad",
  Lifestyle: "lifestyle",
};

export function portfolioCategoryLabel(value: string | null | undefined) {
  if (!value) return "Général";
  return PORTFOLIO_CATEGORIES[value] || PORTFOLIO_CATEGORIES[LEGACY[value]] || value;
}

export function isVideoUrl(url: string | null | undefined) {
  return Boolean(url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url));
}
