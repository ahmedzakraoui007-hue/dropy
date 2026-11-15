export const INDEXNOW_KEY = "5eb97c55013cce939475346266f6ae66";

const ENDPOINT = "https://api.indexnow.org/indexnow";

export function groupByHost(urls: string[]) {
  const groups = new Map<string, string[]>();
  for (const raw of urls) {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") continue;
      const list = groups.get(url.host) || [];
      if (!list.includes(url.toString())) list.push(url.toString());
      groups.set(url.host, list);
    } catch {}
  }
  return groups;
}

export async function submitToIndexNow(urls: string[]) {
  const results: { host: string; count: number; status: number }[] = [];
  for (const [host, list] of groupByHost(urls)) {
    for (let i = 0; i < list.length; i += 10000) {
      const urlList = list.slice(i, i + 10000);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList }),
        });
        results.push({ host, count: urlList.length, status: res.status });
      } catch {
        results.push({ host, count: urlList.length, status: 0 });
      }
    }
  }
  return results;
}
