// app/api/follow/route.js
export const runtime = 'edge';

const MAX_REDIRECTS = 10;
const TIMEOUT = 8000;

export async function POST(request) {
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // SSRF protection – block local/private addresses
  if (
    targetUrl.hostname === "localhost" ||
    targetUrl.hostname.startsWith("127.") ||
    targetUrl.hostname.startsWith("192.168.") ||
    targetUrl.hostname.startsWith("10.")
  ) {
    return Response.json({ error: "Blocked URL" }, { status: 400 });
  }

  const redirects = [];
  let currentUrl = targetUrl.toString();

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const start = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RedirectChecker/1.0)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - start;

      redirects.push({
        step: i + 1,
        status: response.status,
        url: currentUrl,
        timeMs: duration,
      });

      const location = response.headers.get("location");

      if (!location || response.status < 300 || response.status >= 400) {
        break;
      }

      currentUrl = new URL(location, currentUrl).toString();
    }

    return Response.json({
      redirects,
      finalUrl: currentUrl,
      totalRedirects: redirects.length,
    });
  } catch (err) {
    return Response.json(
      {
        error: "Failed to fetch URL",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
