const WIDTHS = [480, 828, 1200, 1600];

export function responsiveImage(src?: string | null, widths: number[] = WIDTHS) {
  if (!src) return { src: undefined };
  try {
    const url = new URL(src);
    if (url.hostname === "images.unsplash.com") {
      const make = (w: number) => {
        const u = new URL(url.toString());
        u.searchParams.set("w", String(w));
        u.searchParams.set("auto", "format");
        u.searchParams.set("fit", "crop");
        if (!u.searchParams.get("q")) u.searchParams.set("q", "75");
        return u.toString();
      };
      return { src: make(widths[widths.length - 1]), srcSet: widths.map((w) => `${make(w)} ${w}w`).join(", ") };
    }
  } catch {}
  return { src };
}
