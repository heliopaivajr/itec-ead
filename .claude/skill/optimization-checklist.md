# PageSpeed Optimization Checklist - Complete Reference

## 1. CLS (Cumulative Layout Shift) - Target: < 0.1

### 1.1 Images: Explicit Dimensions

Every `<img>` must have `width` and `height` attributes to reserve space before load.

```tsx
// CORRECT - space reserved, no CLS
<img src="/photo.webp" alt="Product" width={400} height={500} loading="lazy" decoding="async" />

// WRONG - causes CLS when image loads
<img src="/photo.webp" alt="Product" className="w-full" />
```

### 1.2 Skeleton Grids Matching Real Layout

Skeleton loading states must use the SAME grid structure as real content.

```tsx
// Skeleton must match: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
  {Array(5).fill(0).map((_, i) => (
    <div key={i} className="flex flex-col">
      <div className="bg-gray-200 aspect-[4/5] rounded-2xl" />
      <div className="mt-3 space-y-2">
        <div className="bg-gray-200 h-5 rounded w-3/4" />
        <div className="bg-gray-200 h-4 rounded w-1/2" />
        <div className="bg-gray-200 h-8 rounded w-24" />
      </div>
    </div>
  ))}
</div>
```

### 1.3 Reserve Space for Dynamic Sections

Sections that load data from API must have min-height.

```tsx
// Container reserves space before API data arrives
<section className="py-16 min-h-[700px]" style={{ contain: 'layout style' }}>
  {isLoading ? <Skeleton /> : <RealContent />}
</section>
```

### 1.4 Suspense Fallback Must Match Content

Never use `fallback={null}` for visible content. Create skeleton that matches real DOM:

```tsx
const BelowFoldSkeleton = () => (
  <div style={{ contain: 'layout' }}>
    <div className="min-h-[200px]" /> {/* Benefits section height */}
    <div className="min-h-[700px]"> {/* Products carousel height */}
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-pulse">
          {Array(5).fill(0).map((_, i) => (
            <div key={i}>
              <div className="bg-gray-200 aspect-[4/5] rounded-2xl" />
              <div className="mt-3 space-y-2">
                <div className="bg-gray-200 h-5 rounded w-3/4" />
                <div className="bg-gray-200 h-4 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="min-h-[200px]" /> {/* Newsletter section height */}
  </div>
);

<Suspense fallback={<BelowFoldSkeleton />}>
  <Benefits />
  <HomeProductsSection />
  <Newsletter />
</Suspense>
```

### 1.5 Contain Property for Reflow Isolation

```tsx
// Isolate reflows within component boundaries
<section style={{ contain: 'layout style' }}>
  {/* Content changes here won't affect parent layout */}
</section>
```

---

## 2. LCP (Largest Contentful Paint) - Target: < 2.5s

### 2.1 Hero Image with Picture Element

```tsx
<picture>
  <source
    srcSet="/images/hero-mobile.avif 800w, /images/hero.avif 1920w"
    sizes="100vw"
    type="image/avif"
  />
  <source
    srcSet="/images/hero-mobile.webp 800w, /images/hero.webp 1920w"
    sizes="100vw"
    type="image/webp"
  />
  <img
    src="/images/hero.webp"
    alt="Hero description"
    className="w-full h-full object-cover"
    width={1920}
    height={1080}
    fetchPriority="high"
  />
</picture>
```

### 2.2 Responsive Preload in index.html

```html
<!-- Mobile preload (smaller image) -->
<link rel="preload" as="image" href="/images/hero-mobile.webp"
  imagesrcset="/images/hero-mobile.avif 1x" type="image/avif"
  media="(max-width: 768px)" fetchpriority="high">

<!-- Desktop preload (full image) -->
<link rel="preload" as="image" href="/images/hero.webp"
  imagesrcset="/images/hero.avif 1x" type="image/avif"
  media="(min-width: 769px)" fetchpriority="high">
```

### 2.3 Image Size Rules

| Display Size | Image File Size | Formula |
|-------------|----------------|---------|
| 32x32px | 64x64px | 2x retina |
| 400x500px | 800x1000px | 2x retina |
| Full-width hero | 1920px wide | Max reasonable |
| Mobile hero | 800px wide | Separate file |

### 2.4 Image Format Priority

AVIF > WebP > PNG/JPEG. Always provide both AVIF and WebP via `<picture>`.

### 2.5 Image Resize Commands

```bash
# Using sharp (install: npm install sharp)
node -e "
  const sharp = require('sharp');
  sharp('input.webp').resize(800, 432).toFile('output-mobile.webp');
  sharp('input.avif').resize(800, 432).toFile('output-mobile.avif');
"

# Resize logo to 2x retina of display size
node -e "
  const sharp = require('sharp');
  sharp('logo-huge.webp').resize(64, 80, { fit: 'inside' }).toFile('logo-small.webp');
"
```

### 2.6 LCP Image Rules

- MUST have `fetchPriority="high"`
- MUST NOT have `loading="lazy"`
- MUST NOT have `decoding="async"`
- MUST be preloaded in `<head>`
- SHOULD be in AVIF format (40-60% smaller than WebP)

---

## 3. FCP (First Contentful Paint) - Target: < 1.8s

### 3.1 Non-Blocking Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet" media="print" onload="this.media='all'">
<noscript>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet">
</noscript>
```

### 3.2 Preconnect and DNS-Prefetch

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.shopify.com">
<link rel="dns-prefetch" href="https://cdn.shopify.com">
<link rel="preconnect" href="https://shop.example.com">
<link rel="dns-prefetch" href="https://shop.example.com">
```

### 3.3 Code Splitting

```tsx
// Pages: always lazy
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const AllProductsPage = lazy(() => import("@/pages/AllProductsPage"));

// Below-fold components: lazy
const Newsletter = lazy(() => import("@/components/Newsletter"));
const Footer = lazy(() => import("@/components/Footer"));

// Above-fold: eager (critical for FCP/LCP)
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
```

### 3.4 Remove Inline Style Tags

```tsx
// WRONG - runtime style injection causes parse delay
<style>{`@media (min-width: 1024px) { .btn { display: none; } }`}</style>
<div className="btn" style={{position: 'fixed', bottom: '16px'}}>

// CORRECT - Tailwind classes, zero runtime cost
<div className="fixed bottom-4 left-4 right-4 z-[99999] lg:hidden">
```

---

## 4. Bundle Optimization

### 4.1 Vite Manual Chunks

```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': [
          // ONLY include packages that are actually imported
          '@radix-ui/react-accordion',
          '@radix-ui/react-dialog',
          '@radix-ui/react-label',
          '@radix-ui/react-slot',
          '@radix-ui/react-toast',
          '@radix-ui/react-tooltip',
        ],
        'query-vendor': ['@tanstack/react-query', '@apollo/client', 'graphql'],
      },
    },
  },
},
```

### 4.2 Find Unused Components

```bash
# List all UI component files
ls src/components/ui/

# For each, check if it's imported anywhere
grep -r "from.*ui/component-name" src/ --include="*.tsx" --include="*.ts"

# If no imports found, safe to delete
```

### 4.3 Verify Manual Chunk Packages

```bash
# For each package in manualChunks, verify it's actually imported
grep -r "@radix-ui/react-accordion" src/ --include="*.tsx" --include="*.ts"
# If no results, remove from manual chunks
```

---

## 5. Accessibility - Target: 100/100

### 5.1 Contrast Ratios

| Element | Minimum Ratio | Example |
|---------|--------------|---------|
| Normal text | 4.5:1 | text-pink-700 (#be185d) on white = 5.4:1 |
| Large text (18px+) | 3.0:1 | text-teal-600 on dark bg |
| UI components | 3.0:1 | Borders, icons |

### 5.2 Heading Hierarchy

```html
<!-- CORRECT -->
<h1>Page Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>

<!-- WRONG - skipping levels -->
<h1>Title</h1>
  <h4>This should be h2</h4>

<!-- WRONG - non-semantic heading usage -->
<h3>Payment Methods</h3> <!-- If it's just a visual label, use <p> -->
```

### 5.3 Interactive Element Nesting

```tsx
// WRONG - button inside anchor
<a href="/page"><button>Click</button></a>

// CORRECT - styled anchor
<a href="/page" className="inline-block bg-pink-600 text-white px-8 py-3 rounded">Click</a>
```

---

## 6. Security Headers (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://cdn.shopify.com; connect-src 'self' https://shop.example.com https://*.shopify.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin-allow-popups" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy-Report-Only", "value": "require-trusted-types-for 'script';" }
      ]
    }
  ]
}
```

---

## 7. Cache Headers (vercel.json)

Order matters: specific rules BEFORE generic catch-all.

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/images/backgrounds/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/images/logos/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/images/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800, stale-while-revalidate=86400" }]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        // security headers here (catch-all last)
      ]
    }
  ]
}
```

---

## 8. Console Cleanup

```ts
// WRONG - console.warn always executes in production
if (!TOKEN) {
  console.warn("Token missing");
}

// CORRECT - only in development
if (import.meta.env.DEV && !TOKEN) {
  console.warn("Token missing");
}

// ACCEPTABLE - console.error in catch blocks for real errors
catch (error) {
  console.error("API request failed:", error);
}
```

---

## 9. Environment Variables

### Vite .env Rules

```bash
# WRONG - Vite does NOT interpolate variables
VITE_API_URL=https://${VITE_DOMAIN}/api/${VITE_VERSION}/graphql.json

# CORRECT - Use literal values
VITE_API_URL=https://shop.example.com/api/2024-04/graphql.json
```

### Vercel Env Sync

```bash
# Compare Vercel env with local
vercel env pull .env.vercel --yes --token=TOKEN
diff .env .env.vercel

# Fix a wrong env var
vercel env rm VAR_NAME production --yes --token=TOKEN
echo "correct-value" | vercel env add VAR_NAME production --token=TOKEN

# Redeploy after env change
vercel --prod --yes --token=TOKEN
```

---

## 10. Score Impact Reference

Based on real measurements:

| Optimization | Score Impact (mobile) | Score Impact (desktop) |
|-------------|----------------------|----------------------|
| Fix CLS from 0.9 to 0.05 | +20-30 points | +10-15 points |
| Fix LCP from 6s to 2s | +15-20 points | +5-10 points |
| Hero image AVIF + preload | +5-10 points | +3-5 points |
| Responsive srcSet mobile | +5-10 points | 0 points |
| Code splitting (lazy) | +5-10 points | +3-5 points |
| Remove unused JS/CSS | +3-5 points | +2-3 points |
| Security headers | 0 (perf) | 0 (perf), +8 (BP) |
| Cache headers | +1-2 points | +1-2 points |
| Font loading optimization | +2-3 points | +1-2 points |

---

## 11. Architectural Limitations

### React SPA Cannot Score 100 Performance Mobile

A React SPA calling external APIs (Shopify, etc.) will typically score 85-95 on mobile due to:
- React hydration cost (~100-200ms on throttled mobile)
- react-vendor bundle (345KB, 107KB gzip) is irreducible
- External API latency penalized by Lighthouse
- 4x CPU throttling on mobile simulation

To reach 100 mobile: migrate to SSR/SSG (Next.js, Astro).

### Lighthouse Variability

Mobile scores vary 3-5 points between runs. Use median of 3 runs. A score of 97-99 in one run does not indicate a real problem.

### CrUX vs Lab Data

Field data (CrUX) takes 28 days to reflect changes. Lab data (Lighthouse) validates immediately. Both are shown in PageSpeed Insights.
