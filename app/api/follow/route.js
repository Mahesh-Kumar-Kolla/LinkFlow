// app/api/follow/route.js
export const runtime = 'edge';

const MAX_REDIRECTS = 10;
const TIMEOUT = 8000;

// List of known suspicious TLDs and patterns
const SUSPICIOUS_PATTERNS = [
  /\.ru$/i,
  /\.cn$/i,
  /\.tk$/i,
  /\.ml$/i,
  /\.ga$/i,
  /\.cf$/i,
  /\.gq$/i,
  /phishing/i,
  /malware/i,
  /hack/i,
  /virus/i,
];

// Known safe domains
const SAFE_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'linkedin.com',
  'github.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'wikipedia.org',
  'reddit.com',
  'netflix.com',
  'spotify.com',
];

function analyzeSafety(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a known safe domain
    const isSafeDomain = SAFE_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (isSafeDomain) {
      return { level: 'safe', message: 'Known trusted domain' };
    }
    
    // Check for suspicious patterns
    const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(hostname));
    
    if (isSuspicious) {
      return { level: 'warning', message: 'Potentially suspicious domain' };
    }
    
    // Check for HTTPS
    if (urlObj.protocol !== 'https:') {
      return { level: 'caution', message: 'Not using HTTPS' };
    }
    
    return { level: 'unknown', message: 'Unknown domain - verify before visiting' };
  } catch {
    return { level: 'warning', message: 'Could not analyze URL' };
  }
}

function extractUrlDetails(url) {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol.replace(':', ''),
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
      pathname: urlObj.pathname,
      isHttps: urlObj.protocol === 'https:',
    };
  } catch {
    return null;
  }
}

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
  let serverInfo = null;

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const start = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkFlow/1.0)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - start;

      // Extract some response headers for the last response
      const contentType = response.headers.get("content-type");
      const server = response.headers.get("server");
      
      if (i === 0 || response.status < 300 || response.status >= 400) {
        serverInfo = {
          server: server || 'Unknown',
          contentType: contentType || 'Unknown',
        };
      }

      redirects.push({
        step: i + 1,
        status: response.status,
        url: currentUrl,
        timeMs: duration,
        details: extractUrlDetails(currentUrl),
      });

      const location = response.headers.get("location");

      if (!location || response.status < 300 || response.status >= 400) {
        break;
      }

      currentUrl = new URL(location, currentUrl).toString();
    }

    const finalUrlDetails = extractUrlDetails(currentUrl);
    const safety = analyzeSafety(currentUrl);

    return Response.json({
      redirects,
      finalUrl: currentUrl,
      finalUrlDetails,
      totalRedirects: redirects.length,
      serverInfo,
      safety,
      analyzedAt: new Date().toISOString(),
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
