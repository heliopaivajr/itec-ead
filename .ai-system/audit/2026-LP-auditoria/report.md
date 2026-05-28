# Relatório de Auditoria — Landing Page Pública
**Projeto:** ITEC EAD
**Auditor:** Agente 14 — Chief Technical Inspector
**Data:** 2026-05-25
**Escopo:** Navbar, rotas públicas, componentes LP, SEO, acessibilidade
**Ação:** zero modificações realizadas

---

## ETAPA 1 — Mapeamento de Rotas e Menus

### Rotas públicas no router (App.tsx)

| Rota | Componente | Existe no menu? |
|---|---|---|
| `/` | Index | — (home) |
| `/login` | Login | Botão "Entrar" |
| `/esqueci-senha` | RecuperarSenha | Não |
| `/cadastro` | Cadastro | Não |
| `/cursos` | Cursos | ✅ Desktop + Mobile |
| `/professores` | Professores | ✅ Desktop / ❌ Mobile (ausente) |
| `/sobre` | Sobre | ✅ Submenu "Sobre" desktop + Mobile |
| `/docentes` | Docentes | ✅ Submenu "Sobre" desktop + Mobile |
| `/contato` | Contato | ✅ Submenu "Sobre" desktop + Mobile |
| `/comunidade` | Comunidade | ✅ Desktop + Mobile |
| `/blog` | Blog | ✅ Desktop + Mobile |
| `/reservar-vaga` | ReservarVaga | Card Hero (não no menu) |
| `/dev-setup` | DevSetup | Não (correto — dev only) |

### Menus desktop vs mobile — divergências

| Item | Desktop | Mobile |
|---|---|---|
| Cursos | ✅ | ✅ |
| **Professores** | ✅ link direto | ❌ **AUSENTE** |
| Sobre (dropdown) | ✅ com submenu | — |
| Nossa Missão | Submenu "Sobre" | ✅ link direto |
| Corpo Docente | Submenu "Sobre" | ✅ link direto |
| Contato | Submenu "Sobre" | ✅ link direto |
| Comunidade | ✅ | ✅ |
| Blog | ✅ | ✅ |

### Duplicidade confirmada: `/professores` vs `/docentes`

Existem **duas páginas de professores**:
- `/professores` — `Professores.tsx` — conteúdo "A definir" (3 cards placeholder com `nome: 'A definir'`)
- `/docentes` — `Docentes.tsx` — conteúdo com 6 professores fictícios elaborados

No menu desktop: "Professores" aponta para `/professores` (placeholder) E "Corpo Docente" no submenu aponta para `/docentes`. Confuso para o usuário e duplicado em conteúdo.

---

## ETAPA 2 — Auditoria de Consistência dos Menus

| Item de Menu | Rota | Componente | Status |
|---|---|---|---|
| Cursos | `/cursos` | Cursos.tsx | ✅ OK |
| Professores | `/professores` | Professores.tsx | ⚠️ Conteúdo placeholder ("A definir") |
| Sobre → Nossa Missão | `/sobre` | Sobre.tsx | ✅ OK |
| Sobre → Corpo Docente | `/docentes` | Docentes.tsx | ⚠️ Duplica /professores |
| Sobre → Contato | `/contato` | Contato.tsx | ✅ OK |
| Comunidade | `/comunidade` | Comunidade.tsx | ⚠️ Página "em breve" |
| Blog | `/blog` | Blog.tsx | ⚠️ Conteúdo fictício |
| Professores (mobile) | — | — | ❌ **AUSENTE no mobile** |

---

## ETAPA 3 — Auditoria de Conteúdo da LP

| Seção | Status | Observação |
|---|---|---|
| **Hero** | ⚠️ | Vídeo bg presente. Botão "Matricule-se" aponta para `/matricula` — rota **não existe** no router |
| **Navbar** | ⚠️ | Logo OK, ThemeSwitcher OK, "Professores" ausente no mobile |
| **Features** | ✅ | Dados hardcoded corretos — não precisam vir do banco |
| **CoursePreview** | ✅ | 3 cursos corretos (Teologia Livre, SETEB, Ministerial Mulheres) |
| **VideoReel** | ✅ | 5 vídeos, autoplay ao entrar, controle de som |
| **Testimonials** | ⚠️ | Sem nome real dos alunos (proposital — nota no componente), mas sem foto real |
| **CTA** | ⚠️ | Botão "Baixar E-book Grátis" não leva a nenhum lugar (sem ação funcional). Link "Política de Privacidade" aponta para `/privacidade` que **não existe** |
| **Footer** | ⚠️ | Links Rápidos OK. YouTube aponta para `youtube.com` genérico (sem canal real) |

---

## ETAPA 4 — Auditoria Técnica dos Componentes LP

### `import React` desnecessário (React 18 não exige)

Os seguintes arquivos têm `import React from 'react'` sem usar `React` diretamente — não é erro crítico, mas é código desnecessário:

- `CallToAction.tsx:1`
- `CourseCard.tsx:1`
- `CoursePreview.tsx:1`
- `Features.tsx:1`
- `Testimonials.tsx:1`
- `ThemeSwitcher.tsx:1`
- `LeadCaptureModal.tsx:1`

### Dados hardcoded que poderiam ser variáveis (baixo risco, consistência)

| Dado | Arquivo | Linha | Observação |
|---|---|---|---|
| `secretaria@itecedu.com` | CallToAction.tsx | 49 | Hardcoded — igual ao .env |
| `(81) 99116-1448` | CallToAction.tsx | 48, 89 | Hardcoded |
| `secretaria@itecedu.com` | Footer.tsx | 70 | Hardcoded |
| `(81) 99116-1448` | Footer.tsx | 71 | Hardcoded |
| `https://forms.gle/16rAE9rjrS3fb4b79` | CallToAction.tsx | 76 | Google Form externo hardcoded |

### Rotas inexistentes linkadas no código

| Link | Arquivo | Linha | Status |
|---|---|---|---|
| `/matricula` | Hero.tsx | 154 | ❌ Rota não existe no router |
| `/privacidade` | CallToAction.tsx | 33 | ❌ Rota não existe no router |

### Console.log / TODOs

Zero `console.log` nos componentes da LP. ✅
Zero `TODO`/`FIXME`. ✅

### Formulário /reservar-vaga

✅ Campos `required` no HTML nativo
✅ Validação de LGPD antes do submit (`if (!form.lgpd) setErro(...)`)
✅ Estado de loading e erro tratados
✅ Inserção no Supabase com fallback
⚠️ Sem validação de formato de telefone (aceita qualquer string)
⚠️ Sem rate limiting / proteção contra spam

---

## ETAPA 5 — Acessibilidade e SEO

| Item | Status | Detalhe |
|---|---|---|
| `<html lang="pt-BR">` | ✅ | Presente no index.html |
| Botão mobile menu — aria-label | ✅ | `aria-label` e `aria-expanded` corretos |
| Logo alt text | ✅ | "ITEC Logo" |
| YouTube link — aria-label | ❌ | `<a href="https://youtube.com">` sem `aria-label` |
| Meta description | ✅ | Correta no index.html |
| OG tags — URL | ✅ | Aponta para `itecedu.com` |
| OG tags — image | ✅ | `itecedu.com/og-image.png` |
| Meta tags por página | ⚠️ | Só o index.html tem meta tags — `/cursos`, `/sobre`, etc. **não têm meta description própria** (SPA limitation) |
| Twitter @site | ⚠️ | `@itec_br` — verificar se é o handle real |
| Favicon | ⚠️ | Só `.ico` — sem PNG moderno (192px, 512px) para PWA |

---

## Score da Landing Page: 6.5/10 🟡 ATENÇÃO

---

## 🔴 Problemas Críticos

| # | Problema | Arquivo | Linha | Impacto |
|---|---|---|---|---|
| C1 | Botão "Matricule-se" aponta para `/matricula` — rota inexistente (404) | Hero.tsx | 154 | Usuário clica e cai no NotFound — perde conversão |
| C2 | Link "Política de Privacidade" aponta para `/privacidade` — rota inexistente (404) | CallToAction.tsx | 33 | Problema legal LGPD — formulário de e-mail menciona link quebrado |

---

## 🟠 Problemas de Alto Impacto

| # | Problema | Arquivo | Impacto |
|---|---|---|---|
| A1 | "Professores" ausente no menu mobile | Navbar.tsx:106-111 | Usuário mobile não consegue acessar /professores |
| A2 | `/professores` tem 3 cards com `nome: 'A definir'` — conteúdo placeholder visível em produção | Professores.tsx:14-33 | Passa imagem de desorganização institucional |
| A3 | Duplicidade: `/professores` e `/docentes` existem separados com conteúdo similar | App.tsx + Navbar | Confunde usuário e dilui SEO |
| A4 | CTA "Baixar E-book Grátis" sem funcionalidade — botão não faz nada | CallToAction.tsx:27-29 | Promessa não cumprida ao visitante |
| A5 | YouTube no Footer aponta para `youtube.com` genérico sem canal real | Footer.tsx:31 | Link inútil que prejudica credibilidade |

---

## 🟡 Melhorias Recomendadas

| # | Melhoria | Arquivo | Benefício |
|---|---|---|---|
| M1 | Remover `import React` desnecessário (7 arquivos) | Múltiplos | Limpeza de código |
| M2 | Depoimentos em Testimonials.tsx sem nome/foto real | Testimonials.tsx | Maior credibilidade social |
| M3 | Adicionar `aria-label` no link YouTube do Footer | Footer.tsx:31 | Acessibilidade |
| M4 | Validação de formato de telefone no /reservar-vaga | ReservarVaga.tsx | Qualidade de dados |
| M5 | Meta tags por página (react-helmet ou equivalente) | Todas as páginas públicas | SEO de subpáginas |
| M6 | Favicon PNG moderno (192/512px) para PWA | public/ | PWA readiness |
| M7 | Verificar se `@itec_br` é o Twitter/X handle real | index.html:32 | Credibilidade |
| M8 | `forms.gle` hardcoded no CTA — mover para env var | CallToAction.tsx:76 | Manutenibilidade |

---

## ✅ O que está correto

- Fontes não-bloqueantes (media=print + onload) ✅
- Script gptengineer.js com `defer` ✅
- OG tags apontando para `itecedu.com` (não lovable.dev) ✅
- `<html lang="pt-BR">` presente ✅
- Logo com alt text, width/height definidos ✅
- Botão mobile menu com `aria-label` e `aria-expanded` ✅
- Code splitting com React.lazy em todas as páginas ✅
- Instagram @itec.teologia com link correto em Footer e CTA ✅
- WhatsApp `wa.me/5581991161448` correto ✅
- Formulário /reservar-vaga com LGPD e validação HTML5 ✅
- Meta description sem "100% online" (corrigida para híbrida) ✅
- ThemeSwitcher presente e funcional em Navbar ✅
- Zero console.log na LP ✅

---

## Plano de Remediação Priorizado

| Ordem | Ação | Agente | Tempo Estimado |
|---|---|---|---|
| 1 | **C1** — Redirecionar `/matricula` → `/reservar-vaga` no Hero.tsx | 06-frontend | 5 min |
| 2 | **C2** — Criar página `/privacidade` ou redirecionar para `/contato` | 06-frontend | 30 min |
| 3 | **A1** — Adicionar "Professores" no menu mobile | 06-frontend | 5 min |
| 4 | **A2+A3** — Decidir: fundir `/professores` + `/docentes` em uma só página ou remover `/professores` | 01-architect | 1h |
| 5 | **A4** — Botão E-book: ou criar funcionalidade real ou substituir por link para `/reservar-vaga` | 06-frontend | 15 min |
| 6 | **A5** — Remover ou atualizar link YouTube para canal real (ou ocultar até ter canal) | 06-frontend | 5 min |
| 7 | **M1** — Remover `import React` desnecessário | 12-code-reviewer | 15 min |
| 8 | **M2** — Atualizar depoimentos com nomes/fotos reais quando disponíveis | Conteúdo (humano) | — |

---

*Relatório gerado pelo Agente 14 — Auditor de Codebase*
*Nenhum arquivo foi modificado*
*Aguardando aprovação do responsável (Pr. Hélio Paiva) para iniciar remediações*
