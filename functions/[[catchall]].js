// Cloudflare Pages Function — proxy app routes to Vercel
// Marketing routes are served as static Astro pages.
// Everything else proxies through to the MakerKit app on Vercel.

const VERCEL_URL = 'https://dnssnuff.vercel.app';

const GA4_ID = 'G-VL248KXQF9';
const GA4_ID_2 = 'G-8GEYK7FMK1';
const GA4_SNIPPET = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"><\/script><script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID_2}"><\/script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');gtag('config','${GA4_ID_2}');<\/script>`;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Static marketing paths — let Pages serve them directly
  const marketingPaths = [
    '/pricing', '/features', '/about', '/docs',
    '/use-cases/', '/blog/', '/alternatives/',
    '/privacy-policy', '/terms-of-service', '/cookie-policy',
    '/_astro/', '/styles/',
  ];

  const isMarketing = marketingPaths.some(p => path === p || path.startsWith(p));

  if (isMarketing) {
    // Serve from static Pages build
    const response = await next();
    return addSecurityHeaders(response);
  }

  // App routes — proxy to Vercel
  const vercelUrl = new URL(request.url);
  vercelUrl.hostname = new URL(VERCEL_URL).hostname;
  vercelUrl.protocol = 'https:';

  const proxyRequest = new Request(vercelUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  });

  const response = await fetch(proxyRequest);

  // For HTML responses, inject GA4
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    let body = await response.text();
    body = body.replace('</head>', GA4_SNIPPET + '</head>');
    const newHeaders = new Headers(response.headers);
    newHeaders.delete('content-encoding');
    return addSecurityHeaders(new Response(body, {
      status: response.status,
      headers: newHeaders,
    }));
  }

  return addSecurityHeaders(new Response(response.body, {
    status: response.status,
    headers: response.headers,
  }));
}

function addSecurityHeaders(response) {
  const r = new Response(response.body, response);
  r.headers.set('X-Content-Type-Options', 'nosniff');
  r.headers.set('X-Frame-Options', 'SAMEORIGIN');
  r.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return r;
}
