"use client";

import { useState } from "react";

type Redirect = {
  step: number;
  status: number;
  url: string;
  timeMs: number;
};

type ApiResult = {
  redirects: Redirect[];
  finalUrl: string;
};

// Copy icon component
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

// Check icon component
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Arrow icon for redirect chain
const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14"/>
    <path d="m19 12-7 7-7-7"/>
  </svg>
);

// External link icon
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" x2="21" y1="14" y2="3"/>
  </svg>
);

// Loading spinner
const LoadingSpinner = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// Link icon
const LinkIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

// Globe icon
const GlobeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" x2="22" y1="12" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// Shield icon
const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

// Zap icon
const ZapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export default function Home() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFinal, setCopiedFinal] = useState(false);

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
    let bgColor = "bg-slate-100 text-slate-700";
    let dotColor = "bg-slate-400";
    let label = "Unknown";

    if (status >= 200 && status < 300) {
      bgColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
      dotColor = "bg-emerald-500";
      label = "Success";
    } else if (status >= 300 && status < 400) {
      bgColor = "bg-amber-50 text-amber-700 border border-amber-200";
      dotColor = "bg-amber-500";
      label = "Redirect";
    } else if (status >= 400 && status < 500) {
      bgColor = "bg-red-50 text-red-700 border border-red-200";
      dotColor = "bg-red-500";
      label = "Client Error";
    } else if (status >= 500) {
      bgColor = "bg-purple-50 text-purple-700 border border-purple-200";
      dotColor = "bg-purple-500";
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

  const truncateUrl = (urlString: string, maxLength: number = 50) => {
    if (urlString.length <= maxLength) return urlString;
    return urlString.substring(0, maxLength) + "...";
  };

  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">LinkFlow</h1>
              <p className="text-xs text-slate-500">URL Redirect Chain Analyzer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Search */}
        <div className="text-center mb-8 animate-fadeInUp">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Where does your link <span className="gradient-text">really</span> go?
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Uncover the complete redirect chain of any URL. Perfect for security checks, debugging, and transparency.
          </p>
        </div>

        {/* Search Section */}
        <div className="glass-card rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 mb-8 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
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
                className="w-full pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-300 text-lg"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <LinkIcon className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={checkRedirects}
              disabled={loading || !isValidUrl(url)}
              className="btn-hover-effect inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none sm:w-auto w-full"
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
          <p className="mt-3 text-sm text-slate-500 text-center">
            Supports shortened URLs like bit.ly and direct links
          </p>
        </div>

        {/* Feature Pills */}
        {!data && !loading && !error && (
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur rounded-full text-sm text-slate-600 border border-slate-200/50">
              <ShieldIcon className="w-4 h-4 text-emerald-500" />
              <span>Security First</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur rounded-full text-sm text-slate-600 border border-slate-200/50">
              <ZapIcon className="w-4 h-4 text-amber-500" />
              <span>Instant Results</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur rounded-full text-sm text-slate-600 border border-slate-200/50">
              <GlobeIcon className="w-4 h-4 text-blue-500" />
              <span>Any URL</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="animate-scaleIn mb-8 p-5 bg-red-50/80 backdrop-blur border border-red-200 rounded-xl flex items-start gap-4 shadow-lg shadow-red-100/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-800">Something went wrong</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
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
                  <div key={i} className="p-5 bg-white/50 rounded-xl border border-slate-200/50">
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
                    <h2 className="text-xl font-bold text-slate-900">Analysis Complete</h2>
                    <p className="text-sm text-slate-500">
                      {data.redirects.length} {data.redirects.length === 1 ? "step" : "steps"} in the redirect chain
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-sm text-slate-600">Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data.redirects.reduce((acc, r) => acc + r.timeMs, 0)}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Redirect Chain - Visual */}
            <div className="glass-card rounded-2xl shadow-xl p-6 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </span>
                Redirect Chain
              </h3>
              
              <div className="space-y-0">
                {data.redirects.map((r, index) => (
                  <div key={r.step} className="animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Redirect Step Card */}
                    <div className="group relative flex items-start gap-4 p-4 bg-white/70 rounded-xl border border-slate-200/50 hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 card-lift">
                      {/* Step Number */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                        {r.step}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getStatusBadge(r.status)}
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {r.timeMs}ms
                          </span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-slate-700 font-mono break-all flex-1 group-hover:text-slate-900 transition-colors" title={r.url}>
                            <span className="hidden sm:inline">{r.url}</span>
                            <span className="sm:hidden">{truncateUrl(r.url, 40)}</span>
                          </p>
                          <button
                            onClick={() => copyToClipboard(r.url, index)}
                            className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Copy URL"
                          >
                            {copiedIndex === index ? (
                              <span className="text-emerald-600 animate-copy">
                                <CheckIcon />
                              </span>
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Arrow between steps */}
                    {index < data.redirects.length - 1 && (
                      <div className="flex justify-center py-2 text-blue-300 animate-arrow">
                        <ArrowDownIcon />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final URL Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-6 text-white animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              {/* Decorative circles */}
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 animate-bounce-subtle">
              <LinkIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to analyze</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Enter a URL above to trace its complete redirect chain and discover where it really leads
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/50 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <p className="text-sm text-slate-500">
                LinkFlow - URL redirect chain analyzer for security and transparency
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
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
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-slate-200/50 w-full justify-center">
              <span className="text-sm text-slate-500">
                Built by <span className="font-semibold text-slate-700">Mahesh Kumar Kolla</span>
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/Mahesh-Kumar-Kolla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all duration-200 hover:scale-105"
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
