function getPath(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url;
  }
}

export function injectMeta(html: string, requestUrl: string): string {
  const path = getPath(requestUrl);

  // Public user pages (ticket tracking, contact, notice board) — do not index
  if (path.startsWith("/p/")) {
    html = html.replace(
      "</head>",
      '  <meta name="robots" content="noindex, nofollow">\n</head>',
    );
  }

  // Landing page — rich structured data for search engines & AI models
  if (path === "/") {
    const jsonLd = `
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Latte",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Customer support platform built for the next generation of startups — with a unified inbox, AI-powered replies, ticket tracking, and workflow automation.",
    "url": "https://getlatte.app/",
    "sameAs": [
      "https://twitter.com/getlatte",
      "https://github.com/getlatte"
    ],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Unified inbox for all customer channels",
      "AI-powered automated replies",
      "Public ticket tracking page",
      "Customizable contact forms",
      "Public notice board for updates",
      "Email template management",
      "Multi-inbox support",
      "Team collaboration tools"
    ],
    "screenshot": "https://getlatte.app/og-image.png"
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Latte",
    "url": "https://getlatte.app/",
    "logo": "https://getlatte.app/og-image.png",
    "description": "Customer support for the next generation.",
    "sameAs": [
      "https://twitter.com/getlatte",
      "https://github.com/getlatte"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Latte",
    "url": "https://getlatte.app/",
    "description": "Customer support platform built for the next generation of startups — with a unified inbox, AI-powered replies, ticket tracking, and workflow automation.",
    "inLanguage": "en-US"
  }
]
</script>

<script type="text/markdown" aria-hidden="true">
# Latte — Customer support for the next generation

Latte is a customer support platform built for the next generation of startups. Key features include:

## Core Features
- **Unified Inbox**: Manage all customer channels in one place
- **AI-Powered Replies**: Automated responses using intelligent agents
- **Ticket Tracking**: Public ticket status page for customers
- **Contact Pages**: Customizable public contact forms
- **Notice Board**: Public updates and announcements board
- **Email Templates**: Pre-built and customizable email templates
- **Multi-Inbox**: Support for multiple email domains and inboxes
- **Team Collaboration**: Workspaces and agent management

## Links
- Website: https://getlatte.app/
- Twitter: https://twitter.com/getlatte
- GitHub: https://github.com/getlatte
</script>`;

    html = html.replace("</head>", `${jsonLd}\n</head>`);
  }

  return html;
}
