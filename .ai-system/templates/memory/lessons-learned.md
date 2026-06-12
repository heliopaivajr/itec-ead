# Lições Aprendidas — Memory do Kit
# Versão limpa e universal — Kit de Agentes Portátil v2.0

> Lições destiladas de projetos reais, generalizadas para servir a
> qualquer projeto novo. Seu projeto **nasce sabendo** o que custou caro
> aprender. Conforme novas lições surgirem, adicione-as aqui (o Osábio
> mantém este arquivo vivo após cada sprint).
>
> **Cada lição que vira regra deve refletir nas REG do CLAUDE.md.**

---

## LICAO-001 — SDD: spec aprovada antes de código

**Contexto:** Código escrito sem spec aprovada frequentemente implementa
a coisa errada. Reescrever custa mais do que revisar uma spec.

**Regra:** Toda feature começa por uma spec técnica. O responsável aprova
**antes** de qualquer linha de código.

**Como aplicar:**
1. Escrever a spec (objetivo, escopo, fora de escopo, plano, rollback)
2. Apresentar para aprovação explícita
3. Só então implementar — seguindo a spec aprovada
4. Mudou o escopo no meio? Volta para a spec, não improvisa no código.

---

## LICAO-002 — JOIN aninhado com RLS retorna vazio

**Contexto:** Quando duas tabelas têm RLS ativo, uma query com join
aninhado pode retornar **vazio silenciosamente** — sem erro, sem aviso.
O desenvolvedor pensa que "não há dados" quando na verdade a policy
bloqueou o join.

**Regra:** Não usar join aninhado entre tabelas que ambas têm RLS.
Fazer queries separadas e juntar (merge) no código.

**Como aplicar:**
```
// ❌ ERRADO — falha silenciosa com RLS em ambas
select('*, outra_tabela!fk(campo)')

// ✅ CORRETO — queries separadas + merge
const a = await query('tabela_a')
const b = await query('tabela_b')
const resultado = a.map(x => ({ ...x, campo: b.find(y => y.id === x.b_id)?.campo }))
```

---

## LICAO-003 — Confirmar nomes reais de policies antes de DROP

**Contexto:** `DROP POLICY IF EXISTS "nome"` **ignora silenciosamente**
nomes que não batem. Você acha que removeu/substituiu a policy, mas a
antiga continua ativa — falsa sensação de rollback.

**Regra:** Antes de qualquer `DROP POLICY`, listar as policies reais da
tabela no banco e confirmar o nome exato.

**Como aplicar:**
```sql
-- Confirmar antes de dropar:
SELECT policyname FROM pg_policies WHERE tablename = 'sua_tabela';
```
Só depois escrever o `DROP` com o nome exato confirmado.

---

## LICAO-004 — Migration manual + verificação read-only = seguro

**Contexto:** Aplicar migration via CLI ou ferramenta automatizada pode
falhar silenciosamente, rodar fora de ordem, ou executar com permissão
insuficiente. Difícil auditar o que realmente aconteceu.

**Regra:** Migrations são aplicadas **manualmente** no SQL Editor do
painel (role de serviço). A verificação do resultado pode usar um MCP de
banco em modo **read-only** — nunca escrita por MCP/CLI.

**Como aplicar:**
1. Agente cria o arquivo `.sql` com a migration **e** seu rollback
2. Humano cola no SQL Editor e executa
3. Humano (ou MCP read-only) verifica o resultado com `SELECT`
4. Só então o trabalho continua

---

## LICAO-005 — Auditoria verifica no banco antes de afirmar

**Contexto:** Em um projeto real, uma auditoria reportou "14 tabelas sem
RLS" classificando como severidade alta — quando na verdade **todas** as
tabelas já tinham RLS ativo. O erro veio de **inferir o estado a partir
dos arquivos de migration**, não do banco. Quase gerou retrabalho e
alarme falso.

**Regra:** Nenhuma auditoria classifica estado do banco por leitura de
migrations. Sempre rodar query real e comparar com a lista de tabelas.

**Como aplicar:**
```sql
-- Quais tabelas REALMENTE têm policy:
SELECT tablename FROM pg_policies WHERE schemaname = 'public';
-- Lista completa de tabelas:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- A diferença é o que está de fato sem policy.
```
Migrations mostram **intenção**, não **estado**. Podem ter sido revertidas,
aplicadas parcialmente ou alteradas direto no painel.

---

## LICAO-006 — Tabela nova precisa das 4 operações de policy

**Contexto:** Criar uma tabela com RLS mas só com policy de `SELECT`
(esquecendo `INSERT`/`UPDATE`/`DELETE`) **quebra a operação**: o app lê
mas não consegue gravar, e o erro aparece longe da causa.

**Regra:** Ao criar uma tabela com RLS, definir as policies para **todas**
as operações que o app realmente usa (SELECT, INSERT, UPDATE, DELETE),
cada uma com sua condição de role.

**Como aplicar:**
- Para cada nova tabela, pergunte: quem lê? quem insere? quem edita? quem
  apaga? Cada resposta vira uma policy explícita.
- Evite policy `ALL` genérica quando os papéis diferem por operação
  (ex: quem edita não é quem apaga). Separe por operação.

---

## LICAO-007 — Validação de regra consulta TODAS as tabelas envolvidas

**Contexto:** Uma regra de negócio que depende de exceções/dispensas
registradas em uma tabela secundária falha se a validação olhar só a
tabela principal. Ex: validar um pré-requisito sem checar a tabela de
exceções aprovadas → bloqueia operação legítima (ou libera indevida).

**Regra:** Ao validar uma regra de negócio, mapear **todas** as tabelas
que influenciam a decisão — principal **e** secundárias (exceções,
dispensas, overrides, status) — e consultar todas.

**Como aplicar:**
1. Antes de implementar a validação, liste todas as fontes de verdade.
2. Inclua explicitamente as tabelas de exceção/override na consulta.
3. Teste o caminho feliz **e** o caminho da exceção.

---

## LICAO-008 — Build 0 erros antes de commit

**Contexto:** Erros de tipo/compilação que "passam batido" no commit
quebram o CI e o deploy para todo o time, e custam mais para corrigir
depois.

**Regra:** `build` deve completar com **0 erros** antes de qualquer commit.
Tipagem estrita, sem `any` implícito.

**Como aplicar:**
- Rodar `build` localmente antes do commit.
- Rodar os testes (`test:run`) — devem passar 100%.
- Commit/PR só com build verde.

---

## LICAO-009 — Não adicionar tecnologia/dependência sem aprovação

**Contexto:** Adicionar uma biblioteca, API externa ou serviço novo sem
avaliação introduz custo, limite de uso, risco de segurança e dependência
difícil de remover depois.

**Regra:** Antes de instalar pacote novo ou usar API externa não listada
na stack: **parar e pedir aprovação**, informando nome, necessidade,
custo, limites e alternativa sem dependência.

**Como aplicar:**
1. PARAR antes do `add`/integração.
2. Apresentar: o que é, por que, grátis/pago, limites, alternativa.
3. Aguardar aprovação explícita do responsável.
4. Bibliotecas já no `package.json` não precisam de aviso.

---

## LICAO-010 — Feature sem ponto de entrada na UI = incompleta

**Contexto:** Uma feature pode estar 100% implementada e com rota registrada,
mas se nenhum menu, botão ou card aponta para ela, o usuário não tem como
chegar — na prática ela é inexistente. Pior: passa despercebida em testes
que navegam por URL direta.

**Regra:** Nenhuma feature/rota é considerada entregue sem pelo menos um
ponto de entrada navegável (link de menu, botão na página pai, ou card no
painel do role correto).

**Como aplicar:**
1. Ao entregar uma página/rota, verificar: a rota existe no router?
2. Existe pelo menos um link/botão apontando para ela?
3. O role correto chega nela sem digitar a URL?
Só então a feature está completa.

---

*Memory do Kit de Agentes Portátil v2.0 — adicione lições conforme o
projeto ensina. O Osábio mantém este arquivo vivo.*
