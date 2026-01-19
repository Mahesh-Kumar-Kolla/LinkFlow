"use client";

import { useState, useEffect } from "react";

type UrlDetails = {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  isHttps: boolean;
};

type Redirect = {
  step: number;
  status: number;
  url: string;
  timeMs: number;
  details?: UrlDetails;
};

type Safety = {
  level: 'safe' | 'warning' | 'caution' | 'unknown';
  message: string;
};

type ServerInfo = {
  server: string;
  contentType: string;
};

type ApiResult = {
  redirects: Redirect[];
  finalUrl: string;
  finalUrlDetails?: UrlDetails;
  totalRedirects: number;
  serverInfo?: ServerInfo;
  safety?: Safety;
  analyzedAt?: string;
};

type HistoryItem = {
  id: string;
  inputUrl: string;
  finalUrl: string;
  redirectCount: number;
  analyzedAt: string;
  safety?: Safety;
};

// Icons
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/>
    <path d="m19 12-7 7-7-7"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" x2="21" y1="14" y2="3"/>
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const LinkIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const GlobeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" x2="22" y1="12" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const ZapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const UnlockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

export default function Home() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load dark mode preference and history from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('linkflow-darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    const savedHistory = localStorage.getItem('linkflow-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('linkflow-darkmode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save to history
  const saveToHistory = (inputUrl: string, result: ApiResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      inputUrl,
      finalUrl: result.finalUrl,
      redirectCount: result.redirects.length,
      analyzedAt: result.analyzedAt || new Date().toISOString(),
      safety: result.safety,
    };
    
    const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('linkflow-history', JSON.stringify(updatedHistory));
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('linkflow-history');
  };

  // Delete single history item
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('linkflow-history', JSON.stringify(updatedHistory));
  };

  // Load from history
  const loadFromHistory = (item: HistoryItem) => {
    setUrl(item.inputUrl);
    setShowHistory(false);
  };

  const normalizeUrl = (u: string): string => {
    try {
      new URL(u);
      return u;
    } catch {
      return `https://${u}`;
    }
  };

  const isValidUrl = (value: string): boolean => {
    if (!value) return false;
    try {
      new URL(value.startsWith("http") ? value : `https://${value}`);
      return true;
    } catch {
      return false;
    }
  };

  const checkRedirects = async () => {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const toFetch = normalizeUrl(url);
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: toFetch }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setData(result);
      saveToHistory(url, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number | "final") => {
    try {
      await navigator.clipboard.writeText(text);
      if (index === "final") {
        setCopiedFinal(true);
        setTimeout(() => setCopiedFinal(false), 2000);
      } else {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStatusBadge = (status: number) => {
    let bgColor = darkMode 
      ? "bg-slate-700 text-slate-300 border border-slate-600"
      : "bg-slate-600 text-white border border-slate-700";
    let dotColor = darkMode ? "bg-slate-400" : "bg-slate-300";
    let label = "Unknown";

    if (status >= 200 && status < 300) {
      bgColor = darkMode
        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800"
        : "bg-emerald-600 text-white border border-emerald-700";
      dotColor = darkMode ? "bg-emerald-500" : "bg-emerald-300";
      label = "Success";
    } else if (status >= 300 && status < 400) {
      bgColor = darkMode
        ? "bg-amber-900/30 text-amber-400 border border-amber-800"
        : "bg-amber-500 text-white border border-amber-600";
      dotColor = darkMode ? "bg-amber-500" : "bg-amber-200";
      label = "Redirect";
    } else if (status >= 400 && status < 500) {
      bgColor = darkMode
        ? "bg-red-900/30 text-red-400 border border-red-800"
        : "bg-red-600 text-white border border-red-700";
      dotColor = darkMode ? "bg-red-500" : "bg-red-300";
      label = "Client Error";
    } else if (status >= 500) {
      bgColor = darkMode
        ? "bg-purple-900/30 text-purple-400 border border-purple-800"
        : "bg-purple-600 text-white border border-purple-700";
      dotColor = darkMode ? "bg-purple-500" : "bg-purple-300";
      label = "Server Error";
    }

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${bgColor} transition-all duration-200 hover:scale-105`}>
        <span className={`w-2 h-2 rounded-full ${dotColor} status-dot`}></span>
        <span className="font-mono">{status}</span>
        <span className="hidden sm:inline">- {label}</span>
      </span>
    );
  };

  const getSafetyBadge = (safety?: Safety) => {
    if (!safety) return null;
    
    const styles = {
      safe: darkMode 
        ? "bg-emerald-900/30 text-emerald-400 border-emerald-700"
        : "bg-emerald-600 text-white border-emerald-700",
      warning: darkMode
        ? "bg-red-900/30 text-red-400 border-red-700"
        : "bg-red-600 text-white border-red-700",
      caution: darkMode
        ? "bg-amber-900/30 text-amber-400 border-amber-700"
        : "bg-amber-500 text-white border-amber-600",
      unknown: darkMode
        ? "bg-slate-700 text-slate-300 border-slate-600"
        : "bg-slate-600 text-white border-slate-700",
    };

    const icons = {
      safe: <ShieldIcon className="w-4 h-4" />,
      warning: "⚠️",
      caution: "⚡",
      unknown: "❓",
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${styles[safety.level]}`}>
        <span>{icons[safety.level]}</span>
        <span className="text-sm font-medium">{safety.message}</span>
      </div>
    );
  };

  const truncateUrl = (urlString: string, maxLength: number = 50) => {
    if (urlString.length <= maxLength) return urlString;
    return urlString.substring(0, maxLength) + "...";
  };

  return (
    <main className={`min-h-screen animated-gradient relative overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float ${darkMode ? 'bg-blue-900' : 'bg-blue-200'}`}></div>
        <div className={`absolute top-40 right-10 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed ${darkMode ? 'bg-cyan-900' : 'bg-cyan-200'}`}></div>
        <div className={`absolute bottom-20 left-1/3 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float ${darkMode ? 'bg-indigo-900' : 'bg-indigo-200'}`}></div>
      </div>

      {/* Header */}
      <header className={`relative ${darkMode ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'} sticky top-0 z-50`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">LinkFlow</h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>URL Redirect Chain Analyzer</p>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* History Button */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  showHistory 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                    : darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="History"
              >
                <HistoryIcon />
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                title={darkMode ? "Light Mode" : "Dark Mode"}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 animate-fadeIn`}>
          <div className={`glass-card rounded-2xl shadow-xl p-4 ${darkMode ? 'bg-slate-800/70' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Analyses</h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <TrashIcon />
                  Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} text-center py-4`}>No history yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'} transition-colors cursor-pointer group`}
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-mono truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.inputUrl}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.redirectCount} redirects • {new Date(item.analyzedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Search */}
        <div className="text-center mb-8 animate-fadeInUp">
          <h2 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>
            Where does your link <span className="gradient-text">really</span> go?
          </h2>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-xl mx-auto`}>
            Uncover the complete redirect chain of any URL. Perfect for security checks, debugging, and transparency.
          </p>
        </div>

        {/* Search Section */}
        <div className={`glass-card rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 mb-8 animate-fadeInUp`} style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <input
                id="url-input"
                type="text"
                placeholder="https://bit.ly/xyz"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading && isValidUrl(url)) {
                    e.preventDefault();
                    checkRedirects();
                  }
                }}
                disabled={loading}
                className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'text-white placeholder-slate-500 bg-slate-800 border-slate-600' : 'text-slate-900 placeholder-slate-400 bg-white border-slate-200'} border-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg`}
              />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-blue-500 transition-colors`}>
                <LinkIcon className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={checkRedirects}
              disabled={loading || !isValidUrl(url)}
              className="btn-hover-effect inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none sm:w-auto w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <ZapIcon className="w-5 h-5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
          <p className={`mt-3 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'} text-center`}>
            Supports shortened URLs like bit.ly and direct links
          </p>
        </div>

        {/* Feature Pills */}
        {!data && !loading && !error && (
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/70 border-slate-200/50'} backdrop-blur rounded-full text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'} border`}>
              <ShieldIcon className="w-4 h-4 text-emerald-500" />
              <span>Security First</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/70 border-slate-200/50'} backdrop-blur rounded-full text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'} border`}>
              <ZapIcon className="w-4 h-4 text-amber-500" />
              <span>Instant Results</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/70 border-slate-200/50'} backdrop-blur rounded-full text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'} border`}>
              <GlobeIcon className="w-4 h-4 text-blue-500" />
              <span>Any URL</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`animate-scaleIn mb-8 p-5 ${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50/80 border-red-200'} backdrop-blur border rounded-xl flex items-start gap-4 shadow-lg`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${darkMode ? 'bg-red-900/50' : 'bg-red-100'} flex items-center justify-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className={`text-base font-semibold ${darkMode ? 'text-red-400' : 'text-red-800'}`}>Something went wrong</h3>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'} mt-1`}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="glass-card rounded-2xl shadow-xl p-6 animate-fadeIn">
            <div className="space-y-4">
              <div className="h-7 w-56 animate-shimmer rounded-lg"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`p-5 ${darkMode ? 'bg-slate-800/50' : 'bg-white/50'} rounded-xl border ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 animate-shimmer rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-24 animate-shimmer rounded-lg"></div>
                        <div className="h-4 w-full animate-shimmer rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="glass-card rounded-2xl shadow-xl p-6 animate-scaleIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Analysis Complete</h2>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {data.redirects.length} {data.redirects.length === 1 ? "step" : "steps"} in the redirect chain
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-xl`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total:</span>
                  <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {data.redirects.reduce((acc, r) => acc + r.timeMs, 0)}ms
                  </span>
                </div>
              </div>
            </div>

            {/* URL Details Card */}
            {data.finalUrlDetails && (
              <div className={`glass-card rounded-2xl shadow-xl p-6 animate-fadeInUp`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
                  <span className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'} flex items-center justify-center`}>
                    <GlobeIcon className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </span>
                  URL Details
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} mb-1`}>Protocol</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-1`}>
                      {data.finalUrlDetails.isHttps ? <LockIcon /> : <UnlockIcon />}
                      {data.finalUrlDetails.protocol.toUpperCase()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} mb-1`}>Domain</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} truncate`}>{data.finalUrlDetails.hostname}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} mb-1`}>Port</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{data.finalUrlDetails.port}</p>
                  </div>
                  {data.serverInfo && (
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} mb-1`}>Server</p>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} truncate`}>{data.serverInfo.server}</p>
                    </div>
                  )}
                </div>

                {/* Safety Indicator */}
                {data.safety && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} mb-2`}>Safety Assessment</p>
                    {getSafetyBadge(data.safety)}
                  </div>
                )}
              </div>
            )}

            {/* Redirect Chain */}
            <div className="glass-card rounded-2xl shadow-xl p-6 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6 flex items-center gap-2`}>
                <span className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'} flex items-center justify-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </span>
                Redirect Chain
              </h3>
              
              <div className="space-y-0">
                {data.redirects.map((r, index) => (
                  <div key={r.step} className="animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`group relative flex items-start gap-4 p-4 ${darkMode ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-blue-600' : 'bg-white/70 hover:bg-white border-slate-200/50 hover:border-blue-300'} rounded-xl border hover:shadow-lg transition-all duration-300 card-lift`}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                        {r.step}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getStatusBadge(r.status)}
                          <span className={`text-xs ${darkMode ? 'text-slate-500 bg-slate-700' : 'text-slate-400 bg-slate-100'} font-mono px-2 py-0.5 rounded`}>
                            {r.timeMs}ms
                          </span>
                          {r.details?.isHttps && (
                            <span className="text-emerald-500">
                              <LockIcon />
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <p className={`text-sm ${darkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'} font-mono break-all flex-1 transition-colors`} title={r.url}>
                            <span className="hidden sm:inline">{r.url}</span>
                            <span className="sm:hidden">{truncateUrl(r.url, 40)}</span>
                          </p>
                          <button
                            onClick={() => copyToClipboard(r.url, index)}
                            className={`flex-shrink-0 p-2 ${darkMode ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100`}
                            title="Copy URL"
                          >
                            {copiedIndex === index ? (
                              <span className="text-emerald-500 animate-copy">
                                <CheckIcon />
                              </span>
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {index < data.redirects.length - 1 && (
                      <div className={`flex justify-center py-2 ${darkMode ? 'text-blue-500' : 'text-blue-300'} animate-arrow`}>
                        <ArrowDownIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final URL Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-6 text-white animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Final Destination</h3>
                </div>
                
                <div className="flex items-start gap-3">
                  <p className="flex-1 text-blue-100 font-mono text-sm break-all bg-white/10 backdrop-blur rounded-xl p-4">
                    {data.finalUrl}
                  </p>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(data.finalUrl, "final")}
                      className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                      title="Copy URL"
                    >
                      {copiedFinal ? (
                        <span className="text-emerald-300 animate-copy">
                          <CheckIcon />
                        </span>
                      ) : (
                        <CopyIcon />
                      )}
                    </button>
                    <a
                      href={data.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
                      title="Open URL"
                    >
                      <ExternalLinkIcon />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="text-center py-12 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${darkMode ? 'from-slate-700 to-slate-800' : 'from-slate-100 to-slate-200'} flex items-center justify-center ${darkMode ? 'text-slate-500' : 'text-slate-400'} animate-bounce-subtle`}>
              <LinkIcon className="w-10 h-10" />
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-2`}>Ready to analyze</h3>
            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-md mx-auto`}>
              Enter a URL above to trace its complete redirect chain and discover where it really leads
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`relative border-t ${darkMode ? 'border-slate-700/50 bg-slate-900/50' : 'border-slate-200/50 bg-white/50'} backdrop-blur-sm mt-auto`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                LinkFlow - URL redirect chain analyzer for security and transparency
              </p>
              <div className={`flex items-center gap-4 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="flex items-center gap-1">
                  <ShieldIcon className="w-3 h-3" />
                  Secure
                </span>
                <span className="flex items-center gap-1">
                  <ZapIcon className="w-3 h-3" />
                  Fast
                </span>
                <span className="flex items-center gap-1">
                  <GlobeIcon className="w-3 h-3" />
                  Free
                </span>
              </div>
            </div>
            
            {/* Developer Credits */}
            <div className={`flex flex-col sm:flex-row items-center gap-2 pt-4 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'} w-full justify-center`}>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Built by <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Mahesh Kumar Kolla</span>
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/Mahesh-Kumar-Kolla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${darkMode ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'} rounded-full transition-all duration-200 hover:scale-105`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/mahesh-kumar-kolla/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#004182] rounded-full transition-all duration-200 hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
