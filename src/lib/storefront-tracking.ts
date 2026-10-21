"use client";

type TrackingIds = { facebook?: string | null; tiktok?: string | null };

export type StoreEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

export type StoreEventData = {
  contentId?: string;
  contentName?: string;
  value?: number;
  quantity?: number;
  orderId?: string;
};

const TIKTOK_EVENTS: Record<StoreEvent, string | null> = {
  PageView: null,
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

export function isValidFacebookPixelId(id: string | null | undefined) {
  return Boolean(id && /^\d{10,20}$/.test(id.trim()));
}

export function isValidTiktokPixelId(id: string | null | undefined) {
  return Boolean(id && /^[A-Z0-9]{15,25}$/i.test(id.trim()));
}

const loaded: { facebook?: string; tiktok?: string } = {};

function injectScript(id: string, code: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.text = code;
  document.head.appendChild(script);
}

export function loadStoreTracking(ids: TrackingIds) {
  if (typeof window === "undefined" || window.parent !== window) return;
  const facebook = ids.facebook?.trim();
  const tiktok = ids.tiktok?.trim();

  if (isValidFacebookPixelId(facebook) && loaded.facebook !== facebook) {
    injectScript(
      "dropy-fb-pixel",
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebook}');`
    );
    loaded.facebook = facebook;
  }

  if (isValidTiktokPixelId(tiktok) && loaded.tiktok !== tiktok) {
    injectScript(
      "dropy-tt-pixel",
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');}(window,document,'ttq');`
    );
    loaded.tiktok = tiktok;
  }
}

export function trackStoreEvent(event: StoreEvent, data: StoreEventData = {}) {
  if (typeof window === "undefined" || window.parent !== window) return;
  const w = window as any;

  if (w.fbq) {
    const params: Record<string, unknown> = { currency: "TND" };
    if (data.value !== undefined) params.value = Number(data.value.toFixed(3));
    if (data.contentId) {
      params.content_ids = [data.contentId];
      params.content_type = "product";
    }
    if (data.contentName) params.content_name = data.contentName;
    if (data.quantity) params.num_items = data.quantity;
    if (event === "PageView") w.fbq("track", "PageView");
    else w.fbq("track", event, params, data.orderId ? { eventID: data.orderId } : undefined);
  }

  if (w.ttq) {
    if (event === "PageView") {
      w.ttq.page();
    } else {
      const ttEvent = TIKTOK_EVENTS[event];
      if (ttEvent) {
        w.ttq.track(ttEvent, {
          currency: "TND",
          value: data.value,
          quantity: data.quantity,
          content_id: data.contentId,
          content_name: data.contentName,
          content_type: "product",
        });
      }
    }
  }
}
