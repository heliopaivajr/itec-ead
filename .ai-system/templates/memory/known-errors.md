# Erros Conhecidos — Catálogo de Padrões
# Versão limpa e universal — Kit de Agentes Portátil v2.0

> Catálogo de **padrões de erro** que se repetem em projetos. São
> genéricos e reutilizáveis: o objetivo é reconhecer o sintoma cedo e
> aplicar a prevenção. Adicione novos padrões conforme o projeto encontrar
> (o Osábio mantém vivo).
>
> Formato: **ID · Sintoma · Causa raiz · Prevenção.**

---

## ERR-RLS — Erros de Row Level Security

### ERR-RLS-001 — Query retorna vazio sem erro
- **Sintoma:** A consulta não traz dados, mas não há erro. Os dados
  existem no banco (confirmado via role de serviço).
- **Causa raiz:** Join aninhado entre tabelas com RLS ativo; a policy
  bloqueia silenciosamente o lado do join.
- **Prevenção:** Queries separadas + merge no código (ver LICAO-002).
  Nunca join aninhado entre duas tabelas com RLS.

### ERR-RLS-002 — App lê mas não grava
- **Sintoma:** Listagens funcionam, mas inserir/editar/apagar falha ou
  não persiste.
- **Causa raiz:** Tabela tem policy de `SELECT` mas falta `INSERT`,
  `UPDATE` e/ou `DELETE`.
- **Prevenção:** Criar as 4 policies necessárias por tabela, cada uma com
  sua condição de role (ver LICAO-006).

### ERR-RLS-003 — Recursão infinita em policy
- **Sintoma:** Erro de recursão / stack depth ao consultar uma tabela; ou
  timeout inexplicável.
- **Causa raiz:** A policy da tabela A consulta a tabela B, cuja policy
  consulta A de volta (direta ou indiretamente).
- **Prevenção:** Para checagem de papel/role em policies, usar uma VIEW
  **sem RLS** que projeta `(user_id, role)`. A VIEW quebra o ciclo de
  recursão. Documentar que essa VIEW nunca recebe RLS.

### ERR-RLS-004 — DROP de policy "funciona" mas a antiga continua
- **Sintoma:** Após um rollback/refatoração de policies, o comportamento
  antigo persiste.
- **Causa raiz:** `DROP POLICY IF EXISTS "nome"` com nome que não bate é
  ignorado silenciosamente; a policy antiga permanece ativa.
- **Prevenção:** Confirmar o nome real no banco antes do DROP (LICAO-003).

---

## ERR-INFRA — Erros de Infraestrutura e Migrations

### ERR-INFRA-001 — Migration aplicada via CLI corrompe estado
- **Sintoma:** Schema do banco diverge do esperado; migration "aplicada"
  mas efeito ausente; ordem de aplicação incerta.
- **Causa raiz:** Migration rodada por CLI/ferramenta automatizada que
  falhou parcialmente, rodou fora de ordem ou com permissão insuficiente.
- **Prevenção:** Migrations **sempre manuais** no SQL Editor (role de
  serviço). Verificação por `SELECT` (read-only). Nunca CLI/MCP para
  escrita (ver LICAO-004).

### ERR-INFRA-002 — Secret commitado no repositório
- **Sintoma:** Chave de API, senha ou token aparece no histórico do git;
  alerta de scanner de segredos.
- **Causa raiz:** `.env*` ou arquivo de credenciais adicionado ao git por
  falta de `.gitignore` configurado antes do primeiro commit.
- **Prevenção:** Configurar `.gitignore` (cobrindo `.env*`) **antes** do
  primeiro `git add`. Versionar só `.env.example` com chaves vazias.
  Secret no histórico é permanente mesmo após remoção — rotacione a chave.

### ERR-INFRA-003 — Estado do banco afirmado por inferência
- **Sintoma:** Relatório/auditoria afirma "X tabelas sem RLS" (ou similar)
  e gera alarme — mas o banco real está correto.
- **Causa raiz:** Estado inferido da leitura de arquivos de migration, não
  de query real ao banco.
- **Prevenção:** Sempre confrontar `pg_policies` × `pg_tables` antes de
  classificar severidade (ver LICAO-005).

---

## ERR-LOGIC — Erros de Lógica de Negócio

### ERR-LOGIC-001 — Validação ignora tabela secundária
- **Sintoma:** Uma operação legítima é bloqueada (ou uma indevida é
  liberada) porque uma exceção/override registrado não foi considerado.
- **Causa raiz:** A validação consulta apenas a tabela principal e ignora
  tabelas secundárias (exceções, dispensas, overrides, status especiais).
- **Prevenção:** Mapear **todas** as fontes de verdade da regra antes de
  implementar; consultar principal + secundárias; testar o caminho da
  exceção (ver LICAO-007).

### ERR-LOGIC-002 — Regra implementada sem spec aprovada
- **Sintoma:** Feature entregue não corresponde à intenção; retrabalho
  grande após a revisão.
- **Causa raiz:** Implementação começou sem spec aprovada — premissas
  erradas só apareceram no fim.
- **Prevenção:** SDD obrigatório — spec aprovada antes do código
  (ver LICAO-001).

### ERR-LOGIC-003 — Status/opção que viola constraint do banco
- **Sintoma:** Inserção/atualização falha com erro de constraint ao
  escolher um valor de status numa UI (dropdown/seletor).
- **Causa raiz:** A UI oferece opções de status que não batem com o
  `CHECK constraint` real da tabela.
- **Prevenção:** Antes de definir opções de status na UI, confirmar os
  valores aceitos pelo `CHECK constraint` no banco. UI e schema sempre
  alinhados.

---

*Memory do Kit de Agentes Portátil v2.0 — quando um erro novo for
diagnosticado, registre o padrão aqui para o projeto não repeti-lo.*
