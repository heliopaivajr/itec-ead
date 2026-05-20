# Playwright PageSpeed Diagnosis - Detailed Reference

## Overview

This reference documents the exact Playwright MCP tool calls needed to perform automated PageSpeed Insights diagnosis. The workflow navigates to pagespeed.web.dev, triggers analysis, extracts all metrics, and captures diagnostic details.

## Prerequisites

Playwright MCP must be available. Two providers may exist:
- `mcp__playwright__*` (direct)
- `mcp__plugin_playwright_playwright__*` (plugin)

If one fails with "browser closed", try the other provider.

---

## Complete Audit Flow

### Step 1: Navigate to PageSpeed

```
Tool: browser_navigate
URL: https://pagespeed.web.dev/analysis?url=https://www.example.com/
```

The URL parameter triggers automatic analysis. PageSpeed will start analyzing immediately.

### Step 2: Wait for Results

The analysis takes 10-30 seconds. Wait for the score to appear:

```
Tool: browser_wait_for
text: "Desempenho" (Portuguese) or "Performance" (English)
timeout: 60000
```

Alternative: wait for the score circle to render:

```
Tool: browser_wait_for
text: "First Contentful Paint"
timeout: 60000
```

### Step 3: Capture Mobile Scores

**Screenshot** the viewport (captures the score circle and metrics):

```
Tool: browser_take_screenshot
type: png
filename: pagespeed-mobile-scores.png
```

**Snapshot** the page to extract text values:

```
Tool: browser_snapshot
```

From the snapshot, extract:
- Performance score (number in the circle)
- FCP value (e.g., "3.0 s")
- LCP value (e.g., "4.6 s")
- TBT value (e.g., "40 ms")
- CLS value (e.g., "0.883")
- Speed Index (e.g., "3.6 s")

### Step 4: Capture Mobile Diagnostics

Take a full-page screenshot to capture all diagnostics:

```
Tool: browser_take_screenshot
type: png
fullPage: true
filename: pagespeed-mobile-full.png
```

### Step 5: Switch to Desktop

From the snapshot, find the ref for the "Computador" or "Desktop" tab and click it:

```
Tool: browser_click
ref: [ref from snapshot for Desktop/Computador tab]
```

Wait for desktop results to load:

```
Tool: browser_wait_for
text: "First Contentful Paint"
timeout: 30000
```

### Step 6: Capture Desktop Scores

```
Tool: browser_take_screenshot
type: png
filename: pagespeed-desktop-scores.png
```

```
Tool: browser_snapshot
```

### Step 7: Capture Desktop Diagnostics

```
Tool: browser_take_screenshot
type: png
fullPage: true
filename: pagespeed-desktop-full.png
```

### Step 8: Extract Diagnostic Details

For specific issues that need detail, expand them by clicking:

Common expandable sections in PageSpeed results:
- "Melhorar a entrega de imagens" / "Properly size images"
- "Causas da troca de layout" / "Avoid large layout shifts"
- "Use ciclos de vida eficientes de cache" / "Serve static assets with an efficient cache policy"
- "Reduza o JavaScript nao usado" / "Reduce unused JavaScript"
- "Reduza o CSS nao usado" / "Reduce unused CSS"
- "Renderizar solicitacoes de bloqueio" / "Eliminate render-blocking resources"
- "Arvore de dependencia da rede" / "Avoid chaining critical requests"

For each relevant section:

```
Tool: browser_click
ref: [ref for the expandable section]
```

```
Tool: browser_take_screenshot
type: png
filename: pagespeed-detail-{section-name}.png
```

---

## Site Functionality Verification Flow

After deploying optimizations, verify the site still works correctly.

### Step 1: Homepage Check

```
Tool: browser_navigate
URL: https://www.example.com/
```

```
Tool: browser_console_messages
level: error
```

```
Tool: browser_take_screenshot
type: png
fullPage: true
filename: site-homepage.png
```

### Step 2: Key Pages Check

Navigate to each critical page and check for errors:

```
Pages to check:
- / (homepage)
- /produtos (product listing)
- /produto/{handle} (product detail)
- /assinatura-mensal (subscription)
- /nossa-historia (about)
- /fale-conosco (contact)
- /login (auth)
```

For each page:

```
Tool: browser_navigate -> URL
Tool: browser_console_messages -> level: error
Tool: browser_take_screenshot -> filename: site-{page-name}.png
```

### Step 3: Mobile Responsiveness Check

```
Tool: browser_resize
width: 375
height: 812
```

```
Tool: browser_navigate -> homepage URL
Tool: browser_take_screenshot -> fullPage: true, filename: site-mobile-homepage.png
Tool: browser_navigate -> products URL
Tool: browser_take_screenshot -> filename: site-mobile-products.png
```

Reset to desktop:

```
Tool: browser_resize
width: 1280
height: 800
```

---

## Interpreting PageSpeed Results

### Score Ranges

| Range | Color | Meaning |
|-------|-------|---------|
| 90-100 | Green | Good |
| 50-89 | Orange | Needs Improvement |
| 0-49 | Red | Poor |

### Metric Targets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| FCP | < 1.8s | 1.8-3.0s | > 3.0s |
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| TBT | < 200ms | 200-600ms | > 600ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| SI | < 3.4s | 3.4-5.8s | > 5.8s |
| INP | < 200ms | 200-500ms | > 500ms |

### Score Weight (Lighthouse 10+)

| Metric | Weight |
|--------|--------|
| TBT | 30% |
| LCP | 25% |
| CLS | 25% |
| FCP | 10% |
| SI | 10% |

CLS + LCP = 50% of the score. Fixing these two metrics has the biggest impact.

---

## Common PageSpeed Diagnostic Translations (PT-BR to EN)

| Portuguese | English | Category |
|-----------|---------|----------|
| Melhorar a entrega de imagens | Properly size images | Performance |
| Causas da troca de layout | Avoid large layout shifts | CLS |
| Use ciclos de vida eficientes de cache | Serve static assets with efficient cache policy | Performance |
| Reduza o JavaScript nao usado | Reduce unused JavaScript | Performance |
| Reduza o CSS nao usado | Reduce unused CSS | Performance |
| Renderizar solicitacoes de bloqueio | Eliminate render-blocking resources | FCP |
| Arvore de dependencia da rede | Avoid chaining critical requests | LCP |
| Evitar tarefas longas da linha de execucao principal | Avoid long main-thread tasks | TBT |
| Detalhamento da LCP | LCP breakdown | LCP |
| Terceiros | Third-party code | Performance |

---

## Troubleshooting

### Browser Closed Error

If Playwright returns "Target page, context or browser has been closed":
1. Try the alternative provider (`mcp__plugin_playwright_playwright__*` vs `mcp__playwright__*`)
2. If both fail, use `curl` as fallback:
   ```bash
   curl -s -o /dev/null -w "HTTP %{http_code}" https://www.example.com/
   ```

### PageSpeed Analysis Stuck

If the analysis doesn't complete in 60s:
1. Reload the page: `browser_navigate` to the same URL again
2. If still stuck, use Lighthouse CLI as fallback:
   ```bash
   npx lighthouse URL --output=json --emulated-form-factor=mobile --quiet
   ```

### Scores Different from Manual Test

PageSpeed results vary 3-5 points between runs. This is normal. For reliable results:
- Run 3 times and take the median
- Wait 1-2 minutes after deploy before testing
- Test at consistent times (avoid peak hours)
