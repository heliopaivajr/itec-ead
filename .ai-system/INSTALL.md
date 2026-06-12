# Kit de Agentes Portátil — Instalador Mestre
**Versão:** 2.0
**Compatível com:** Claude Code, projetos Node/TypeScript (a stack do produto é definida no PRD)

---

## O que é este kit

Um sistema de agentes de IA reutilizável para acelerar o desenvolvimento
de produtos digitais. Inclui templates de documentação, instruções de
arquitetura, lições aprendidas embutidas e um instalador que adapta tudo
ao seu projeto específico.

**O kit NÃO é código.** É um conjunto de instruções em Markdown que o
Claude Code lê e segue, gerando a estrutura do seu projeto a partir do PRD
que você preencheu.

---

## Pré-requisitos

Antes de instalar, confirme que você tem:

- [ ] **Node.js** 18+ instalado (`node --version`)
- [ ] **pnpm** instalado (`pnpm --version`) — instale com `npm i -g pnpm`
- [ ] **Git** instalado (`git --version`)
- [ ] **Claude Code** instalado e autenticado (`claude --version`)
- [ ] Uma pasta vazia (ou repositório novo) para o projeto
- [ ] O PRD do seu projeto preenchido (ver Passo 2)

---

## Como usar — Visão Geral em 5 Passos

```
Passo 1 → Descompactar o kit na raiz do projeto novo
Passo 2 → Preencher .ai-system/prd/PRD.md com os dados do seu projeto
Passo 3 → Dizer ao Claude Code: "execute o INSTALL.md"
Passo 4 → Revisar o bootstrap gerado e executar os comandos
Passo 5 → Rodar /init do Claude Code para indexar o projeto
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
    │   └── PRD.md     ← você vai criar este
    ├── templates/
    │   ├── adr-template.md      ← templates já existentes do kit
    │   ├── sdd-*.md
    │   └── project/             ← templates de instalação (usados pelo INSTALL)
    │       ├── CLAUDE.md.template
    │       ├── SYSTEM.md.template
    │       ├── STACK.md.template
    │       ├── ARCHITECTURE.md.template
    │       └── README.md.template
    └── agents/        ← definições dos agentes
```

---

## Passo 2 — Preencher o PRD

1. Copie `.ai-system/prd/PRD-TEMPLATE.md` para `.ai-system/prd/PRD.md`
2. Abra `PRD.md` e preencha todas as seções marcadas com `[PREENCHER]`
3. Seções mínimas obrigatórias antes de instalar:
   - Seção 1 (Identidade do Projeto) — completa
   - Seção 3 (Stack Técnica) — pelo menos frontend, backend, banco
   - Seção 5 (Módulos Principais) — pelo menos 3 módulos
   - Seção 7 (Roles e Permissões) — pelo menos 2 roles

> **Dica:** Não tente fazer o PRD perfeito antes de instalar.
> Preencha o suficiente para gerar a estrutura. O PRD evolui com o projeto.

---

## Passo 3 — Executar a instalação

Com o Claude Code aberto na raiz do projeto, diga:

```
execute o INSTALL.md
```

ou

```
instale o kit de agentes seguindo o INSTALL.md
```

O Claude Code vai seguir as instruções da próxima seção automaticamente.

---

## ► INSTRUÇÕES DE EXECUÇÃO PARA O CLAUDE CODE

> **Esta seção é para o Claude Code, não para o usuário.**
> Quando o usuário disser "execute o INSTALL.md" ou "instale o kit",
> siga EXATAMENTE estas etapas na ordem indicada.

---

### ETAPA 1 — Ler e validar o PRD

1.1 Verificar se `.ai-system/prd/PRD.md` existe.
- Se não existir: informar o usuário, mostrar o comando para criar
  (`cp .ai-system/prd/PRD-TEMPLATE.md .ai-system/prd/PRD.md`) e PARAR.

1.2 Ler o arquivo `.ai-system/prd/PRD.md` completo.

1.3 Validar seções mínimas (as que não podem estar como `[PREENCHER]`):
- Seção 1: nome do projeto, descrição, domínio
- Seção 3: frontend, backend, banco de dados
- Seção 5: pelo menos 3 módulos listados
- Seção 7: pelo menos 2 roles definidas

1.4 Se validação falhar: listar exatamente quais campos estão faltando
e PARAR. Não continuar com PRD incompleto.

1.5 Se validação passar: extrair as variáveis abaixo do PRD e armazená-las
para uso nas etapas seguintes:

```
PROJETO_NOME          ← Seção 1
PROJETO_DESCRICAO     ← Seção 1
PROJETO_DOMINIO       ← Seção 1
PROJETO_URL           ← Seção 1
RESPONSAVEL           ← Seção 1
STACK_FRONTEND        ← Seção 3
STACK_BACKEND         ← Seção 3
STACK_BANCO           ← Seção 3
STACK_DEPLOY          ← Seção 3
STACK_PACOTES         ← Seção 3 (gerenciador de pacotes)
ARQUITETURA_PADRAO    ← Seção 4.1
MODULOS               ← Seção 5 (lista)
ROLES                 ← Seção 7 (lista)
ROLE_PADRAO           ← Seção 7.1 (fallback)
```

---

### ETAPA 2 — Criar a estrutura de pastas

2.1 Com base em `ARQUITETURA_PADRAO`, criar a estrutura de pastas:

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

2.2 Substituir `[modulo-N]` pelos módulos reais da Seção 5 do PRD
(usar kebab-case, ex: "Gestão de Tarefas" → `gestao-tarefas`).

2.3 Criar um `.gitkeep` em cada pasta vazia para que o git as rastreie.

---

### ETAPA 3 — Gerar arquivos a partir dos templates

Para cada template em `.ai-system/templates/project/`, gerar o arquivo
correspondente na raiz do projeto, substituindo todos os placeholders
pelos valores extraídos do PRD.

#### 3.1 Gerar `CLAUDE.md` (na raiz)

Usar `.ai-system/templates/project/CLAUDE.md.template` como base.
Substituir:
- `{{PROJETO_NOME}}` → valor extraído
- `{{PROJETO_DESCRICAO}}` → valor extraído
- `{{STACK_FRONTEND}}` → valor extraído
- `{{STACK_BACKEND}}` → valor extraído
- `{{STACK_BANCO}}` → valor extraído
- `{{STACK_PACOTES}}` → valor extraído
- `{{MODULOS}}` → lista formatada em Markdown
- `{{ROLES}}` → tabela formatada em Markdown
- `{{REGRAS_NEGOCIO}}` → lista da Seção 6 do PRD
- `{{RESTRICOES}}` → lista da Seção 9 do PRD
- `{{DATA_ATUAL}}` → data de hoje

> **Importante:** O `CLAUDE.md` gerado é o mais crítico. É lido
> automaticamente pelo Claude Code em toda sessão. Deve estar completo.

#### 3.2 Gerar `SYSTEM.md`, `STACK.md`, `ARCHITECTURE.md`, `README.md`

Mesmo processo: usar template, substituir placeholders, salvar na raiz.

---

### ETAPA 4 — Gerar o bootstrap

**NÃO executar comandos de terminal diretamente.**

Em vez disso, criar o arquivo `.ai-system/bootstrap.md` com todos os
comandos necessários, organizados por seção, para o usuário revisar
e executar manualmente.

O bootstrap deve conter, adaptado à stack do PRD:

```markdown
# Bootstrap — {{PROJETO_NOME}}
Gerado em: {{DATA_ATUAL}}
Revisar antes de executar. Executar na ordem indicada.

## 1. Git
git init
git branch -M main
echo "# {{PROJETO_NOME}}" > README.md (já gerado pelo kit)

## 2. Package Manager
[Se pnpm:]
pnpm init
[Se npm:]
npm init -y

## 3. Dependências principais
[Listar os comandos pnpm add / npm install corretos para a stack do PRD]

Exemplos para React + TypeScript + Vite + Tailwind + Supabase:
pnpm add react react-dom
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
pnpm add -D tailwindcss postcss autoprefixer
pnpm add @supabase/supabase-js
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

## 4. Configuração inicial
[Listar comandos de init específicos da stack, ex:]
npx tailwindcss init -p
[Para Supabase local, se aplicável:]
npx supabase init

## 5. Variáveis de ambiente
[Criar .env.example com as variáveis necessárias para a stack]
Crie manualmente o arquivo .env.local com os valores reais.
NUNCA commitar .env.local.

## 6. .gitignore
[Listar o conteúdo sugerido do .gitignore para a stack]

## 7. Primeiro commit
git add .
git commit -m "chore: init project from ai-system kit v2.0"

## Próximos passos (não automatizados)
- Criar repositório no GitHub e fazer push
- Configurar projeto no Supabase (se aplicável)
- Configurar deploy no Vercel/Netlify (se aplicável)
- Rodar /init no Claude Code
```

> **Por que não executar automaticamente?**
> Comandos de instalação de dependências podem demorar, falhar por
> conflito de versão, ou instalar algo que você não queria.
> Revisar antes de executar é uma regra de segurança do kit.

---

### ETAPA 5 — Apresentar resumo

Ao final, apresentar ao usuário:

```
✅ INSTALAÇÃO CONCLUÍDA

Arquivos gerados:
  CLAUDE.md              ← lido automaticamente pelo Claude Code
  SYSTEM.md
  STACK.md
  ARCHITECTURE.md
  README.md
  .ai-system/bootstrap.md

Estrutura de pastas criada:
  [listar as pastas criadas]

PRÓXIMOS PASSOS (faça agora):

1. Revise .ai-system/bootstrap.md
2. Execute os comandos do bootstrap na ordem indicada
3. Abra um novo terminal na pasta do projeto e rode:
      claude
   Dentro do Claude Code, execute:
      /init
   Isso vai indexar o projeto e confirmar que CLAUDE.md está ativo.

4. Para começar o primeiro sprint, diga ao Claude Code:
   "Agente 20, preciso planejar o Sprint 1 com base no PRD."
```

---

## Passo 4 — Revisar e executar o bootstrap

Abra `.ai-system/bootstrap.md` e leia com atenção antes de rodar.

Verifique especialmente:
- As versões de pacotes estão corretas para sua stack?
- As variáveis de ambiente fazem sentido para o projeto?
- O `.gitignore` cobre todos os arquivos sensíveis?

Depois de revisar, execute os comandos **na ordem listada**.

Se algum comando falhar, resolva antes de continuar.
Não pule etapas.

---

## Passo 5 — Inicializar o Claude Code

Com o projeto com a estrutura criada e o bootstrap executado:

```bash
# Na raiz do projeto
claude
```

Dentro do Claude Code, execute o comando `/init`:

```
/init
```

O `/init` faz o Claude Code ler toda a estrutura do projeto, indexar
os arquivos e confirmar que o `CLAUDE.md` na raiz está sendo lido
corretamente. Isso garante que todas as sessões futuras vão começar
com o contexto certo do projeto.

> **O que é o CLAUDE.md?**
> É o arquivo de instruções do projeto para o Claude Code. Ele é lido
> automaticamente no início de cada sessão. Contém a stack, as regras
> de negócio, os comandos importantes e as restrições do projeto.
> Sem ele, o Claude não sabe nada sobre o seu projeto específico.

> ⚠️ **ATENÇÃO — o `/init` pode sobrescrever o CLAUDE.md**
> O comando `/init` do Claude Code gera seu próprio `CLAUDE.md` a partir
> da análise do código, e isso pode **sobrescrever** o `CLAUDE.md` rico
> que o kit gerou a partir do PRD.
>
> **Recomendação:**
> 1. Antes de rodar `/init`, faça uma cópia de segurança:
>    `cp CLAUDE.md CLAUDE.kit.md`
> 2. Rode `/init`
> 3. Compare os dois arquivos. Se o `/init` sobrescreveu com algo mais
>    pobre, restaure a versão do kit:
>    `cp CLAUDE.kit.md CLAUDE.md`
> 4. Idealmente, faça um merge: mantenha a estrutura do kit e incorpore
>    só o que o `/init` descobriu de útil sobre o código.
> 5. Apague o backup quando terminar: `rm CLAUDE.kit.md`

---

## O que fazer depois (pós-instalação)

Após executar o bootstrap e rodar `/init`:

1. **Revise o `CLAUDE.md`** gerado na raiz — ajuste o que não ficou certo
2. **Crie o repositório no GitHub** e faça o primeiro push
3. **Configure o projeto na infraestrutura** (Supabase, Vercel, etc.)
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

### "O Claude não está lendo o CLAUDE.md"
→ Verifique se o arquivo está na raiz do projeto (não dentro de pastas)
→ Rode `/init` novamente
→ Feche e abra o Claude Code

### "A estrutura de pastas não foi criada corretamente"
→ Verifique se o PRD estava preenchido corretamente na Seção 4
→ Peça ao Claude Code: "recrie a estrutura de pastas conforme o PRD"

### "O bootstrap falhou em algum comando"
→ Não continue sem resolver o erro
→ Identifique o erro, corrija e reexecute a partir do ponto de falha

### "Quero usar uma stack diferente do que o kit sugere"
→ Preencha a Seção 3 do PRD com a sua stack
→ O kit vai adaptar os comandos do bootstrap automaticamente

---

*Kit de Agentes Portátil v2.0 — Instalador Mestre*
*Desenvolvido a partir de lições aprendidas em produção*
