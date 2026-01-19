// pages/api/follow.js

import { URL } from "url";

const MAX_REDIRECTS = 10;
const TIMEOUT = 8000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // SSRF protection – block local/private addresses
  if (
    targetUrl.hostname === "localhost" ||
    targetUrl.hostname.startsWith("127.") ||
    targetUrl.hostname.startsWith("192.168.") ||
    targetUrl.hostname.startsWith("10.")
  ) {
    return res.status(400).json({ error: "Blocked URL" });
  }

  const redirects = [];
  let currentUrl = targetUrl.toString();

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const start = Date.now();

      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RedirectChecker/1.0)",
        },
        signal: AbortSignal.timeout(TIMEOUT),
      });

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

    return res.status(200).json({
      redirects,
      finalUrl: currentUrl,
      totalRedirects: redirects.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch URL",
      details: err.message,
    });
  }
}
