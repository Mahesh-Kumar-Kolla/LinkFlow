# LinkFlow - URL Redirect Chain Analyzer

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Problem & Purpose

Shortened URLs (bit.ly, tinyurl, etc.) hide their final destinations. You never know where a link actually leads before clicking it. **LinkFlow reveals the complete redirect chain** - showing every step from the original URL to the final destination, so you can verify exactly where you're going.

## Key Features

- **Complete Redirect Chain Visibility** - See every hop in the URL redirect sequence (up to 10 redirects)
- **HTTP Status Code Tracking** - View status codes for each step (2xx, 3xx, 4xx, 5xx)
- **Performance Metrics** - Measure response time for each redirect hop in milliseconds
- **Domain Safety Assessment** - Identifies trusted domains, suspicious patterns, and insecure connections
- **One-Click Copy** - Easily copy any URL in the chain or the final destination
- **Analysis History** - Saves and organizes your last 10 analyzed URLs for quick re-checks

## What You Can Do

**Reveal Redirect Chains**
Follow shortened URLs and marketing redirects to see their final destination without visiting them

**Verify Security**
Detect phishing attempts, malicious domains, and insecure HTTP connections before clicking

**Debug Redirect Issues**
Analyze redirect configurations, identify bottlenecks, and measure performance at each hop

**Check URL Safety**
Know exactly where a link leads - whether it's from an email, message, or social media

**Keep History**
Save your recent analyses and quickly re-check URLs without retyping them

## How It Works

LinkFlow uses a serverless Edge Function architecture deployed on Vercel. When you submit a URL, the Edge Function sends HTTP requests following redirect responses (301, 302, etc.), capturing status codes, response headers, and timing information at each hop. The complete redirect chain is then returned to the frontend with structured data, including safety assessment of the final destination.

## Real-World Use Cases

**🔒 For Security Teams**
- Detect phishing attempts hidden behind URL redirects
- Identify malicious domains before users visit them
- Verify suspicious links in emails and messages

**📊 For Marketers**
- Verify campaign links work and chain correctly
- Validate tracking link configurations
- Check competitor URLs and their redirects

**🔧 For Developers**
- Debug redirect configuration issues
- Identify performance bottlenecks in redirect chains
- Test URL forwarding and redirect behavior

**👥 For Everyone**
- Know where shortened URLs lead before clicking
- Avoid phishing and malicious websites
- Understand how URL shorteners work

## Screenshot

![LinkFlow Screenshot](screenshot.png)

## Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Runtime:** Vercel Edge Functions
- **Deployment:** Vercel

## Try It Now

Visit **[LinkFlow](https://linkflows.vercel.app)** to start analyzing URL redirect chains

## Author

**Mahesh Kumar Kolla**

- GitHub: [@Mahesh-Kumar-Kolla](https://github.com/Mahesh-Kumar-Kolla)
- LinkedIn: [Mahesh Kumar Kolla](https://www.linkedin.com/in/mahesh-kumar-kolla/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
