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

const KNOWN_BRANDS = [
  'google', 'youtube', 'facebook', 'twitter', 'instagram', 'linkedin',
  'github', 'microsoft', 'apple', 'amazon', 'paypal', 'netflix', 'spotify',
  'reddit', 'wikipedia', 'dropbox', 'gmail', 'yahoo', 'outlook', 'chase',
  'bankofamerica', 'wellsfargo', 'citibank', 'coinbase', 'binance',
];

function normalizeLeet(str) {
  return str
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/-/g, '');
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getRegistrableDomain(hostname) {
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
}

function assessLegitimacy(finalUrl, redirects) {
  let hostname;
  try {
    hostname = new URL(finalUrl).hostname.toLowerCase();
  } catch {
    return { verdict: 'suspicious', flags: [] };
  }

  const parts = hostname.split('.');
  const sld = parts.length >= 2 ? parts[parts.length - 2] : hostname;

  // Flag: IP address domain
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[');

  // Flag: Punycode / IDN
  const isPunycode = parts.some(p => p.startsWith('xn--'));

  // Flag: Typosquatting
  let typosquatDetail = null;
  const normalizedSld = normalizeLeet(sld);
  for (const brand of KNOWN_BRANDS) {
    if (normalizedSld === brand && sld !== brand) {
      typosquatDetail = brand;
      break;
    }
    if (sld !== brand && sld.length >= brand.length - 1 && sld.length <= brand.length + 1) {
      if (editDistance(sld, brand) === 1) {
        typosquatDetail = brand;
        break;
      }
    }
  }

  // Flag: Excessive subdomains (more than 2 levels before the TLD+SLD)
  const excessiveSubdomains = parts.length > 4;

  // Flag: Long SLD
  const longDomain = sld.length > 30;

  // Flag: Domain hopping (3+ unique registrable domains in chain)
  const chainDomains = new Set(redirects.map(r => {
    try { return getRegistrableDomain(new URL(r.url).hostname.toLowerCase()); } catch { return ''; }
  }).filter(Boolean));
  chainDomains.add(getRegistrableDomain(hostname));
  const domainHopping = chainDomains.size >= 3;

  const flags = [
    { id: 'ip_domain', triggered: isIp, label: 'IP Address Domain', desc: isIp ? 'Domain uses a raw IP address instead of a name' : 'Domain uses a proper hostname', detail: isIp ? hostname : null, critical: true },
    { id: 'punycode', triggered: isPunycode, label: 'Punycode / IDN Domain', desc: isPunycode ? 'Domain uses internationalized characters (possible homograph attack)' : 'No internationalized characters detected', detail: isPunycode ? hostname : null, critical: true },
    { id: 'typosquat', triggered: typosquatDetail !== null, label: 'Brand Typosquatting', desc: typosquatDetail ? `Domain closely resembles a known brand` : 'No brand impersonation detected', detail: typosquatDetail ? `Similar to: ${typosquatDetail}` : null, critical: true },
    { id: 'excessive_subdomains', triggered: excessiveSubdomains, label: 'Excessive Subdomains', desc: excessiveSubdomains ? `Unusually deep subdomain nesting (${parts.length - 2} levels)` : 'Normal subdomain depth', detail: null, critical: false },
    { id: 'long_domain', triggered: longDomain, label: 'Suspicious Domain Length', desc: longDomain ? `Domain name is unusually long (${sld.length} characters)` : 'Domain name length looks normal', detail: null, critical: false },
    { id: 'domain_hopping', triggered: domainHopping, label: 'Domain Hopping', desc: domainHopping ? `Chain passes through ${chainDomains.size} unrelated domains` : 'Redirect chain stays within related domains', detail: null, critical: false },
  ];

  const hasCritical = flags.some(f => f.critical && f.triggered);
  const hasModerate = flags.some(f => !f.critical && f.triggered);
  const verdict = hasCritical ? 'fraudulent' : hasModerate ? 'suspicious' : 'legitimate';

  return {
    verdict,
    flags: flags.map(({ id, triggered, label, desc, detail }) => ({ id, triggered, label, desc, detail })),
  };
}

async function checkGoogleSafeBrowsing(urls) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'linkflow', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: urls.map(u => ({ url: u })),
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.matches || [];
  } catch {
    return null;
  }
}

async function analyzeSafety(finalUrl, allUrls) {
  const threats = await checkGoogleSafeBrowsing(allUrls);
  if (threats !== null && threats.length > 0) {
    const threatTypes = [...new Set(threats.map(t => t.threatType))];
    return {
      level: 'danger',
      message: `Threat detected: ${threatTypes[0].replace(/_/g, ' ')}`,
      threats: threatTypes,
    };
  }

  try {
    const urlObj = new URL(finalUrl);
    const hostname = urlObj.hostname.toLowerCase();

    const isSafeDomain = SAFE_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (isSafeDomain) {
      return { level: 'safe', message: 'Known trusted domain' };
    }

    const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(hostname));

    if (isSuspicious) {
      return { level: 'warning', message: 'Potentially suspicious domain' };
    }

    if (urlObj.protocol !== 'https:') {
      return { level: 'caution', message: 'Not using HTTPS' };
    }

    return { level: 'unknown', message: 'Unknown domain - verify before visiting' };
  } catch {
    return { level: 'warning', message: 'Could not analyze URL' };
  }
}

function buildSecurityInfo(finalUrl, redirects, headers) {
  const isHttps = finalUrl.startsWith('https://');
  const hsts = headers?.get('strict-transport-security') || null;
  const noSniff = headers?.get('x-content-type-options')?.toLowerCase() === 'nosniff';
  const frameOptions = headers?.get('x-frame-options') || null;
  const cspHeader = headers?.get('content-security-policy') || null;
  const csp = cspHeader !== null;
  const frameProtection = frameOptions !== null || (cspHeader !== null && cspHeader.includes('frame-ancestors'));

  const firstUrl = redirects[0]?.url || finalUrl;
  const httpsUpgrade = firstUrl.startsWith('http://') && isHttps;

  const score = [isHttps, hsts !== null, noSniff, frameProtection, csp, httpsUpgrade].filter(Boolean).length;

  return { https: isHttps, hsts, noSniff, frameOptions, csp, frameProtection, httpsUpgrade, score, maxScore: 6 };
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
  let finalResponseHeaders = null;

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

      finalResponseHeaders = response.headers;

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
    const allUrls = redirects.map(r => r.url);
    const [safety, securityInfo] = await Promise.all([
      analyzeSafety(currentUrl, allUrls),
      Promise.resolve(buildSecurityInfo(currentUrl, redirects, finalResponseHeaders)),
    ]);
    const legitimacy = assessLegitimacy(currentUrl, redirects);

    return Response.json({
      redirects,
      finalUrl: currentUrl,
      finalUrlDetails,
      totalRedirects: redirects.length,
      serverInfo,
      safety,
      securityInfo,
      legitimacy,
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
