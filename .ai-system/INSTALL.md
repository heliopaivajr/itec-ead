# Kit de Agentes Portátil — Instalador Mestre
**Versão:** 2.0
**Compatível com:** Claude Code, projetos Node/TypeScript (a stack do produto é definida na entrevista)

---

## O que é este kit

Um sistema de agentes de IA reutilizável para acelerar o desenvolvimento
de produtos digitais. Inclui templates de documentação, instruções de
arquitetura, lições aprendidas embutidas e um instalador que adapta tudo
ao seu projeto específico.

**O kit NÃO é código.** É um conjunto de instruções em Markdown que o
Claude Code lê e segue. A instalação é **guiada por entrevista**: você não
precisa preencher nada à mão — o Claude Code faz 15 perguntas, uma de cada
vez, e gera o PRD e a estrutura do projeto a partir das suas respostas.

---

## Pré-requisitos

Antes de instalar, confirme que você tem:

- [ ] **Node.js** 18+ instalado (`node --version`)
- [ ] **pnpm** instalado (`pnpm --version`) — instale com `npm i -g pnpm`
- [ ] **Git** instalado (`git --version`)
- [ ] **Claude Code** instalado e autenticado (`claude --version`)
- [ ] Uma pasta vazia (ou repositório novo) para o projeto

> Você **não** precisa preencher o PRD antes de começar. A entrevista cuida
> disso. (Se preferir, pode preenchê-lo de antemão — o instalador detecta.)

---

## Como usar — Visão Geral em 5 Passos

```
Passo 1 → Descompactar o kit na raiz do projeto novo
Passo 2 → Dizer ao Claude Code: "instale o kit"
Passo 3 → Responder à entrevista guiada (15 perguntas, uma por vez)
Passo 4 → Revisar o bootstrap gerado e executar os comandos
Passo 5 → Rodar /init do Claude Code (com backup do CLAUDE.md)
```

---

## Passo 1 — Descompactar o kit

Copie a pasta `.ai-system/` inteira para a raiz do seu projeto novo.
A estrutura deve ficar assim:

```
meu-projeto/           ← raiz do projeto (pode estar vazia)
└── .ai-system/
    ├── INSTALL.md     ← este arquivo
    ├── prd/
    │   ├── PRD-TEMPLATE.md
    │   └── PRD.md     ← gerado pela entrevista (não precisa criar à mão)
    ├── templates/
    │   ├── adr-template.md      ← templates já existentes do kit
    │   ├── sdd-*.md
    │   ├── project/             ← templates de instalação (usados pelo INSTALL)
    │   │   ├── CLAUDE.md.template
    │   │   ├── SYSTEM.md.template
    │   │   ├── STACK.md.template
    │   │   ├── ARCHITECTURE.md.template
    │   │   └── README.md.template
    │   └── memory/              ← memória do kit (lições e erros conhecidos)
    └── agents/        ← os 21 agentes (20 numerados + Osábio)
```

---

## Passo 2 — Iniciar a instalação guiada

Com o Claude Code aberto na raiz do projeto, diga:

```
instale o kit
```

ou

```
execute o INSTALL.md
```

O Claude Code vai conduzir a entrevista descrita na próxima seção.

---

## ► INSTRUÇÕES DE EXECUÇÃO PARA O CLAUDE CODE

> **Esta seção é para o Claude Code, não para o usuário.**
> Quando o usuário disser "instale o kit" ou "execute o INSTALL.md", siga
> EXATAMENTE estas etapas, na ordem. Esta é uma **conversa guiada** — você
> conduz a entrevista, não roda um script.

---

### ETAPA 0 — Verificar se já existe PRD

Pergunte exatamente:

```
Você já preencheu o PRD do projeto? (S/N)
```

- **Se N** → vá para a ETAPA 1 (entrevista completa, 15 perguntas).
- **Se S** → leia `.ai-system/prd/PRD.md`, identifique quais campos ainda
  estão como `[PREENCHER]` ou vazios, e pergunte **somente esses** (no mesmo
  formato da ETAPA 1, numerando "X de N restantes"). Depois siga para a ETAPA 2.

---

### ETAPA 1 — Entrevista guiada (15 perguntas)

Regras da entrevista:
- **Uma pergunta por vez.** Faça a pergunta, **aguarde a resposta**, só então
  passe à próxima. Nunca despeje várias perguntas juntas.
- Sempre mostre o progresso (`PERGUNTA N de 15`).
- Sempre dê um **exemplo neutro** (domínio fictício — ex: app de tarefas,
  delivery, academia). Nunca use dados de um projeto real.
- Se a resposta vier vaga, peça um detalhe a mais antes de seguir.

Use exatamente este formato para cada pergunta:

```
PERGUNTA N de 15 — [a pergunta]
(preenche {{PLACEHOLDER}})
Exemplo: [exemplo neutro]
→ aguardar resposta
```

#### BLOCO A — Identidade (1–5)

```
PERGUNTA 1 de 15 — Qual o nome do projeto?
(preenche {{PROJETO_NOME}})
Exemplo: TaskFlow
→ aguardar resposta
```
```
PERGUNTA 2 de 15 — Descreva o produto em uma frase.
(preenche {{PROJETO_DESCRICAO}})
Exemplo: Plataforma de gestão de tarefas para equipes remotas
→ aguardar resposta
```
```
PERGUNTA 3 de 15 — Qual o domínio/setor do produto?
(preenche {{PROJETO_DOMINIO}})
Exemplo: Produtividade B2B
→ aguardar resposta
```
```
PERGUNTA 4 de 15 — Qual a URL de produção (ou do repositório)? Pode deixar em branco.
(preenche {{PROJETO_URL}})
Exemplo: https://taskflow.app
→ aguardar resposta
```
```
PERGUNTA 5 de 15 — Quem é o responsável técnico (nome + papel)?
(preenche {{RESPONSAVEL}})
Exemplo: Ana Souza — tech lead
→ aguardar resposta
```

#### BLOCO B — Stack (6–10)

```
PERGUNTA 6 de 15 — Qual o frontend?
(preenche {{STACK_FRONTEND}})
Exemplo: React 18 + TypeScript + Vite + Tailwind
→ aguardar resposta
```
```
PERGUNTA 7 de 15 — Qual o backend / API?
(preenche {{STACK_BACKEND}})
Exemplo: Supabase (BaaS) — ou Node + NestJS
→ aguardar resposta
```
```
PERGUNTA 8 de 15 — Qual o banco de dados?
(preenche {{STACK_BANCO}})
Exemplo: PostgreSQL (Supabase)
→ aguardar resposta
```
```
PERGUNTA 9 de 15 — Onde será o deploy?
(preenche {{STACK_DEPLOY}})
Exemplo: Vercel
→ aguardar resposta
```
```
PERGUNTA 10 de 15 — Qual gerenciador de pacotes?
(preenche {{STACK_PACOTES}})
Exemplo: pnpm
→ aguardar resposta
```

#### BLOCO C — Domínio (11–15)

```
PERGUNTA 11 de 15 — Quais os papéis/roles de usuário e o que cada um acessa?
(preenche {{ROLES}})
Exemplo: admin (tudo) · membro (próprias tarefas) · visitante (somente leitura)
→ aguardar resposta
```
```
PERGUNTA 12 de 15 — Quais os módulos / bounded contexts principais?
(preenche {{MODULOS}})
Exemplo: Autenticação, Tarefas, Equipes, Relatórios
→ aguardar resposta
```
```
PERGUNTA 13 de 15 — Quais as regras de negócio críticas (as invioláveis)?
(preenche {{REGRAS_NEGOCIO}})
Exemplo: usuário só vê tarefas do próprio workspace; só admin exclui workspace
→ aguardar resposta
```
```
PERGUNTA 14 de 15 — Quais restrições ou decisões já tomadas?
(preenche {{RESTRICOES}})
Exemplo: só pnpm; migrations manuais; sem SSR por ora
→ aguardar resposta
```
```
PERGUNTA 15 de 15 — Qual o padrão arquitetural?
(preenche {{ARQUITETURA_PADRAO}})
Exemplo: BaaS + Frontend only · Clean Architecture · Feature-based
→ aguardar resposta
```

---

### ETAPA 2 — Resumo e confirmação

Apresente **todas** as 15 respostas em um resumo organizado por bloco
(Identidade / Stack / Domínio) e pergunte:

```
Confirma estas respostas? (S / ajustar)
```

- Se o usuário pedir ajuste, corrija o campo indicado e mostre o resumo de
  novo. Repita até receber **S**.
- Só avance com confirmação explícita.

---

### ETAPA 3 — Gerar o PRD preenchido

Com as respostas confirmadas, gere `.ai-system/prd/PRD.md` a partir de
`.ai-system/prd/PRD-TEMPLATE.md`, preenchendo as seções com as respostas da
entrevista. Este arquivo é o **registro permanente** do projeto — confirme
ao usuário que ele foi criado.

---

### ETAPA 4 — Gerar os arquivos raiz a partir dos templates

Para cada template em `.ai-system/templates/project/`, gere o arquivo
correspondente na raiz do projeto, substituindo os placeholders pelos
valores coletados.

> ⚠️ **Substituição por LISTA BRANCA (obrigatório).** O motor de
> substituição só pode trocar placeholders **conhecidos** do kit:
> `PROJETO_NOME`, `PROJETO_DESCRICAO`, `PROJETO_DOMINIO`, `PROJETO_URL`,
> `RESPONSAVEL`, `STACK_FRONTEND`, `STACK_BACKEND`, `STACK_BANCO`,
> `STACK_DEPLOY`, `STACK_PACOTES`, `ARQUITETURA_PADRAO`, `MODULOS`,
> `ROLES`, `REGRAS_NEGOCIO`, `RESTRICOES`, `DATA_ATUAL`.
> **NUNCA** "substituir tudo entre chaves duplas" genericamente — alguns
> arquivos do kit contêm sintaxe nativa de terceiros que usa `{{ }}` e deve
> ser preservada intacta. Exemplo real: o agente `09-infra-engineer` traz um
> workflow do GitHub Actions com `${{ secrets.VERCEL_TOKEN }}` — uma
> substituição cega quebraria o CI gerado. O que não estiver na lista
> permanece literal.

Gere, nesta ordem, na **raiz do projeto**:
- `CLAUDE.md`  ← o mais crítico (lido pelo Claude Code em toda sessão)
- `SYSTEM.md`
- `STACK.md`
- `ARCHITECTURE.md`
- `README.md`

Para listas (`MODULOS`, `ROLES`, `REGRAS_NEGOCIO`, `RESTRICOES`), formate as
respostas como listas/tabelas em Markdown. Use a data de hoje em `DATA_ATUAL`.

---

### ETAPA 5 — Criar a estrutura de pastas

Com base em `ARQUITETURA_PADRAO`, crie a estrutura de pastas e confirme cada
etapa ao usuário.

**Se BaaS + Frontend only:**
```
src/
  components/
    ui/
    dashboard/
  pages/
  services/
  hooks/
  types/
  test/
    services/
    components/
public/
supabase/
  migrations/
  seed/
```

**Se Clean Architecture:**
```
src/
  domain/
    entities/
    repositories/
    services/
  application/
    use-cases/
    dtos/
  interface/
    components/
    pages/
    hooks/
  infrastructure/
    database/
    storage/
    external/
  shared/
    types/
    utils/
  test/
public/
```

**Se Feature-based:**
```
src/
  features/
    [modulo-1]/
      components/
      hooks/
      services/
      types/
    [modulo-2]/
      ...
  shared/
    components/
    hooks/
    types/
  test/
public/
```

Substitua `[modulo-N]` pelos módulos reais (kebab-case, ex: "Gestão de
Tarefas" → `gestao-tarefas`). Crie um `.gitkeep` em cada pasta vazia.

---

### ETAPA 6 — Gerar o bootstrap

**NÃO execute comandos de terminal diretamente.**

Crie o arquivo `.ai-system/bootstrap.md` com todos os comandos necessários,
organizados por seção, para o usuário revisar e executar manualmente,
adaptado à stack coletada:

```markdown
# Bootstrap — {{PROJETO_NOME}}
Gerado em: {{DATA_ATUAL}}
Revisar antes de executar. Executar na ordem indicada.

## 1. Git
git init
git branch -M main

## 2. Package Manager
[{{STACK_PACOTES}} init  — ou equivalente da stack]

## 3. Dependências principais
[Listar os comandos de instalação corretos para a stack do PRD]

## 4. Configuração inicial
[Comandos de init específicos da stack]

## 5. Variáveis de ambiente
[Criar .env.example com as variáveis necessárias]
Crie manualmente o .env.local com os valores reais. NUNCA commitar .env.local.

## 6. .gitignore
[Conteúdo sugerido do .gitignore para a stack — cobrir .env*]

## 7. Primeiro commit
git add .
git commit -m "chore: init project from ai-system kit v2.0"

## Próximos passos (não automatizados)
- Criar repositório no Git remoto e fazer push
- Configurar serviços de backend/deploy (se aplicável)
- Rodar /init no Claude Code
```

> **Por que não executar automaticamente?**
> Comandos de instalação podem demorar, falhar por conflito de versão, ou
> instalar algo que você não queria. Revisar antes de executar é uma regra
> de segurança do kit (nível 1.5).

---

### ETAPA 7 — Apresentar o resumo final

Ao final, apresente ao usuário:

```
✅ INSTALAÇÃO CONCLUÍDA

Gerados:
  .ai-system/prd/PRD.md   ← registro do projeto (a partir da entrevista)
  CLAUDE.md               ← lido automaticamente pelo Claude Code
  SYSTEM.md · STACK.md · ARCHITECTURE.md · README.md
  .ai-system/bootstrap.md

Estrutura de pastas criada:
  [listar as pastas criadas]

PRÓXIMOS PASSOS (faça agora):
1. Revise .ai-system/bootstrap.md
2. Execute os comandos do bootstrap na ordem indicada
3. Abra um terminal na pasta do projeto e rode:  claude
   Dentro do Claude Code, faça backup e rode /init (ver Passo 5).
4. Para começar o primeiro sprint, diga:
   "Agente 20, planeje o Sprint 1 com base no PRD."
```

---

## Passo 4 — Revisar e executar o bootstrap

Abra `.ai-system/bootstrap.md` e leia com atenção antes de rodar.

Verifique especialmente:
- As versões de pacotes estão corretas para sua stack?
- As variáveis de ambiente fazem sentido para o projeto?
- O `.gitignore` cobre todos os arquivos sensíveis?

Depois de revisar, execute os comandos **na ordem listada**.
Se algum comando falhar, resolva antes de continuar. Não pule etapas.

---

## Passo 5 — Inicializar o Claude Code

Com a estrutura criada e o bootstrap executado:

```bash
# Na raiz do projeto
claude
```

Dentro do Claude Code, execute o comando `/init`.

> **O que é o CLAUDE.md?**
> É o arquivo de instruções do projeto para o Claude Code. Ele é lido
> automaticamente no início de cada sessão. Contém a stack, as regras
> de negócio, os comandos importantes e as restrições do projeto.
> Sem ele, o Claude não sabe nada sobre o seu projeto específico.

> ⚠️ **ATENÇÃO — o `/init` pode sobrescrever o CLAUDE.md**
> O comando `/init` gera seu próprio `CLAUDE.md` a partir da análise do
> código, e isso pode **sobrescrever** o `CLAUDE.md` rico que o kit gerou.
>
> **Recomendação:**
> 1. Antes de rodar `/init`, faça backup: `cp CLAUDE.md CLAUDE.kit.md`
> 2. Rode `/init`
> 3. Compare os dois. Se o `/init` empobreceu o arquivo, restaure:
>    `cp CLAUDE.kit.md CLAUDE.md`
> 4. Idealmente, faça um merge: mantenha a estrutura do kit e incorpore
>    só o que o `/init` descobriu de útil sobre o código.
> 5. Apague o backup quando terminar: `rm CLAUDE.kit.md`

---

## O que fazer depois (pós-instalação)

Após executar o bootstrap e rodar `/init`:

1. **Revise o `CLAUDE.md`** gerado na raiz — ajuste o que não ficou certo
2. **Crie o repositório remoto** e faça o primeiro push
3. **Configure o projeto na infraestrutura** (backend, deploy, etc.)
4. **Comece o Sprint 1** com o Agente 20:
   > "Agente 20, com base no PRD aprovado, me ajude a planejar o Sprint 1."
5. **Mantenha o PRD atualizado** conforme o produto evolui

---

## Regras de Segurança Embutidas

Estas regras foram aprendidas em projetos reais e estão embutidas
nos agentes do kit. Leia uma vez para entender o porquê.

### REG-001 — Migrations sempre manuais

**Regra:** Nunca aplicar migrations de banco via CLI ou MCP.
Sempre copiar o SQL e executar manualmente no SQL Editor do painel
do banco (Supabase Dashboard → SQL Editor → service_role).

**Por quê:** CLIs de migration (supabase db push, prisma migrate deploy)
podem falhar silenciosamente, aplicar migrations fora de ordem, ou
executar com permissões insuficientes. O SQL Editor com service_role
é explícito, auditável e seguro.

**Como aplicar:**
1. Agente cria o arquivo `.sql` em `supabase/migrations/`
2. Você abre o SQL Editor no painel
3. Você copia, cola e executa
4. Você valida o resultado
5. Só então confirma para o agente continuar

### REG-002 — MCP de banco só para leitura

**Regra:** Conexões MCP ao banco de dados são permitidas apenas
para consultas de diagnóstico (SELECT). Nunca para DDL ou DML.

**Por quê:** Um agente com acesso de escrita ao banco via MCP pode
executar uma migration errada, dropar uma tabela ou corromper dados
sem chance de revisão. Leitura é segura; escrita requer revisão humana.

### REG-003 — Confirmar policies antes de DROP

**Regra:** Antes de executar `DROP POLICY IF EXISTS "nome"`, verificar
no banco se o nome da policy existe exatamente como escrito.

**Por quê:** Policies com nomes diferentes das esperadas são silenciosamente
ignoradas pelo `DROP IF EXISTS`. Isso dá falsa sensação de que o rollback
funcionou quando na verdade a policy antiga continua ativa.

**Como aplicar:**
```sql
-- Verificar antes de dropar:
SELECT policyname FROM pg_policies
WHERE tablename = 'sua_tabela';
```

### REG-004 — JOIN aninhado com RLS retorna vazio

**Regra:** Quando duas tabelas têm RLS ativo, queries com nested joins
(`select('*, outra_tabela!fk(campo)')`) podem retornar silenciosamente
vazio em vez de erro.

**Solução obrigatória:** Fazer queries separadas e merge manual em JavaScript.

```typescript
// ❌ ERRADO — falha silenciosamente com RLS em ambas as tabelas
const { data } = await supabase
  .from('tabela_a')
  .select('*, tabela_b!fk(campo)');

// ✅ CORRETO — queries separadas + merge
const { data: a } = await supabase.from('tabela_a').select('*');
const { data: b } = await supabase.from('tabela_b').select('id, campo');
const resultado = a.map(item => ({
  ...item,
  campo: b.find(x => x.id === item.b_id)?.campo
}));
```

### REG-005 — SDD: Spec aprovada antes de código

**Regra:** Spec-Driven Development obrigatório para qualquer feature
nova. O agente apresenta a spec para aprovação; o usuário aprova;
só então o código é escrito.

**Por quê:** Código escrito sem spec aprovada frequentemente implementa
a coisa errada. Reescrever é mais caro do que revisar uma spec.

**Fluxo:**
```
SPEC → APROVAÇÃO → IMPLEMENTAÇÃO → TESTES → REVIEW → DEPLOY
```

### REG-006 — Build 0 erros antes de commit

**Regra:** `pnpm build` (ou equivalente) deve completar com 0 erros
antes de qualquer commit. TypeScript strict, sem `any` implícito.

**Por quê:** Erros de TypeScript em produção custam mais do que resolver
em desenvolvimento. Build quebrado bloqueia o CI e o deploy para todos.

### REG-007 — Nunca commitar secrets

**Regra:** Arquivos `.env`, `.env.local`, credenciais, chaves de API
nunca entram no git. `.gitignore` deve estar configurado antes do
primeiro `git add`.

**Por quê:** Secrets no histórico do git são permanentes, mesmo após
remoção, e indexados por scanners automáticos em repositórios públicos.

### REG-008 — Auditoria verifica no banco antes de afirmar

**Regra:** Nenhuma auditoria pode classificar uma tabela como "sem RLS"
ou afirmar qualquer estado do banco por inferência de leitura de
migrations. Deve executar uma query real contra o banco e comparar
o resultado com a lista de tabelas antes de classificar severidade.

**Por quê:** Inferir o estado do banco a partir de arquivos `.sql` gera
falso-positivo. Uma auditoria real reportou "14 tabelas sem RLS" quando
todas as 29 tabelas já tinham RLS ativo — quase gerando trabalho
desnecessário e alarme falso. Arquivos de migration mostram a intenção,
não o estado atual: migrations podem ter sido aplicadas parcialmente,
revertidas, ou alteradas direto no painel.

**Como aplicar:**
```sql
-- Verificar quais tabelas REALMENTE têm RLS ativo:
SELECT tablename FROM pg_policies WHERE schemaname = 'public';

-- Comparar com a lista completa de tabelas:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- A diferença entre as duas é o que realmente está sem policy.
```
Só depois de confrontar query real × lista de tabelas, classificar
a severidade de cada achado.

---

## Troubleshooting

### "O Claude não conduziu a entrevista"
→ Confirme que o arquivo é o `.ai-system/INSTALL.md` deste kit
→ Diga explicitamente: "instale o kit seguindo o INSTALL.md, etapa por etapa"

### "O Claude não está lendo o CLAUDE.md"
→ Verifique se o arquivo está na raiz do projeto (não dentro de pastas)
→ Rode `/init` novamente
→ Feche e abra o Claude Code

### "A estrutura de pastas não foi criada corretamente"
→ Verifique a resposta da pergunta 15 (padrão arquitetural)
→ Peça ao Claude Code: "recrie a estrutura de pastas conforme o PRD"

### "O bootstrap falhou em algum comando"
→ Não continue sem resolver o erro
→ Identifique o erro, corrija e reexecute a partir do ponto de falha

### "Quero usar uma stack diferente do que o kit sugere"
→ Responda a entrevista com a sua stack (perguntas 6 a 10)
→ O kit adapta os comandos do bootstrap automaticamente

---

## Roadmap do Kit — Próximos Entregáveis

> Registro do que ainda falta construir no próprio kit (não no projeto do
> usuário). Mantido aqui para não se perder entre sessões.

### Sequência planejada

```
1º  Instalação Guiada (Opção 3)   → CONCLUÍDA (esta seção de entrevista).

2º  Bloco 5 — Empacotamento        → VERSION.md (changelog do kit) +
                                     geração do zip LIMPO (blocos 1-4),
                                     sem nada específico de projeto real.

3º  Manual-Guia Completo (.docx)   → POR ÚLTIMO. Documenta o kit já final
                                     e estável. É o entregável de destino.
```

A ordem importa: o Manual só é escrito **depois** que a instalação guiada e
o empacotamento estão fechados — assim ele documenta o kit definitivo, não
um alvo em movimento.

### Entregável final — Manual-Guia Completo (.docx)

Documento extenso que **ensina e guia** (não é só referência). Estrutura
prevista em 7 partes:

1. **Visão geral + filosofia** — SDD, "vibe coding" vs engenharia de verdade.
2. **Arquitetura e engenharia por trás** — os 21 agentes, as camadas, o
   fluxo `LLM → Parser → Validator → DTO`, a hierarquia, a memory e a
   evolução dos agentes.
3. **"Aula" de cada agente (21 + Osábio)** — para cada um: nome, quem é, o
   que faz, propósito, como trabalha / como deve trabalhar, agente-parceiro,
   exemplos de **prompts fictícios** em domínios neutros (ex: "SaaS de
   academias", "app de delivery" — **nunca** projetos reais), e o que nunca faz.
4. **Papel especial do Osábio** — auto-evolução, os 2 ciclos (20 etapas =
   evoluir 1 agente; 6 passos = consolidar memory), teto de nível 4.
5. **Guia de instalação passo a passo** — usando a Instalação Guiada (Opção 3).
6. **Trabalho no dia a dia** — ciclo de uma feature, os 4 modos, o sprint.
7. **Glossário + referência rápida.**

> Regra de ouro do Manual: todos os exemplos usam **domínios neutros e
> fictícios**. Nenhum projeto, nome ou dado real entra no documento — o kit
> é limpo e portátil por definição.

---

*Kit de Agentes Portátil v2.0 — Instalador Mestre*
*Desenvolvido a partir de lições aprendidas em produção*
