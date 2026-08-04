# SPEC SDD — Ficha do Aluno editável inline (Diretriz 8.10)

**Projeto:** ITEC-EAD · **Arquivo-alvo principal:** `src/pages/dashboard/FichaAluno.tsx`
**Escopo:** 16.1 (dados pessoais inline) + 16.2 (histórico inline) + 16.3 ("Em breve") + 15.1 (bug data −1 dia)
**Agentes:** 06-frontend-engineer (UI inline) · 18-doc-writer (esta spec)
**Status:** **aprovada pelo Hélio.**

---

## DECISÕES TRAVADAS

| # | Decisão | Resolução |
|---|---------|-----------|
| 1 | Histórico: disciplina sem N1/N2 | **(a)** criar avaliação no ato (1 clique, N1/N2 peso 1.0) → grava no **BRUTO**. Respeita LICAO-042, sobrevive ao trigger 065. |
| 2 | "Em breve" | Ativar **só** Situação Financeira + Boletim (reúso puro). Certificado + Relatório Final → backlog, saem da ficha. |
| 3 | `role` como campo inline | **NÃO.** O WITH CHECK da policy `profiles_update_administracao` derruba o save inteiro se `role` mudar. Fica em `Usuarios.tsx`. |
| 4 | Manter "Lançamento Retroativo" | **SIM, por enquanto.** Inline = editar o que existe; Retroativo = criar disciplina fora da grade. Absorver é v1.1. |

---

## 1. ESPECIFICAÇÃO FUNCIONAL (O QUÊ)

### Persona
Secretaria (role `administracao`) cadastrando e corrigindo dados reais de alunos.
Diretriz 8.10: tudo editável por ela, rápido, **no lugar**, sem pular de tela.

### Comportamento esperado
Clicar num dado → **vira input no lugar** → edita → salva numa barra no rodapé **da seção**.
Sem ícone de lápis. Sem redirect. Sem modal de edição.
*(O Dialog de "Aprovar matrícula" permanece — é ação irreversível, não edição.)*

### Blocos e o que muda

| Bloco | Hoje | Depois |
|-------|------|--------|
| Dados pessoais (nome, e-mail, tel, CPF, RG, nasc., sexo, bio) | só leitura; campo vazio **some** | **inline**; campo vazio vira `— clique para preencher` |
| Endereço | só leitura | **inline** |
| Ministério (`igreja_local`) | só leitura | **inline** |
| Histórico Acadêmico (N1/N2/Rec/Média/Freq/Status) | só leitura | **N1/N2/Rec/Falta editáveis inline no BRUTO**; Média/Freq/Status continuam derivados (read-only, do consolidado) |
| Documentos e Impressões | 1 ativo / 4 "Em breve" | **3 ativos** (+ Situação Financeira + Boletim); Certificado/Relatório saem |
| Foto, Observações, `ValoresMatriculaPanel` | já inline | **inalterados** (são a referência de padrão) |
| Matrículas (aprovar), Lançamento Retroativo | ação / modal | **inalterados** |

### Regras de negócio

- **RN1** — Dados pessoais gravam em `public.profiles` via `updatePerfil(userId, payloadParcial)`. `data_nascimento` passa por `sanitizeDate` na gravação.
- **RN2** — `role` nunca é campo inline (decisão 3).
- **RN3 (LICAO-042)** — Nota grava em `notas_aluno` (bruto, por `avaliacao_id`); falta grava em `frequencia` (bruto). **NUNCA escrever em `matriculas_disciplina`** (consolidado). O trigger 065 (`trg_consolida_par` → `recalcular_consolidado`) consolida.
- **RN4 (risco silencioso)** — Disciplina com consolidado retroativo mas **sem** N1/N2 no bruto: editar só N1 faria o trigger gravar `nota = NULL` (perde o retroativo). A UI deve **oferecer criar N1/N2 no ato** e só então gravar. Nunca cair no consolidado por baixo dos panos.
- **RN5 (LICAO-027)** — Erro do Supabase nunca é engolido: toast com a **mensagem real** + a seção **permanece em edição** com os valores digitados.
- **RN6** — Save é **por seção** (1 update por seção), nunca "salvar tudo" global.

### Casos de erro
- Save falha (RLS, rede, constraint) → toast com erro real, valores digitados preservados, seção continua editável.
- CPF duplicado (unicidade) → tratar a mensagem do banco; correção fina é backlog 8.9 (não trava esta spec).
- Editar nota sem N1/N2 → prompt "criar avaliação agora?" (não grava até resolver).

---

## 2. ESPECIFICAÇÃO TÉCNICA (COMO)

### Stack
React18 + TS + Vite + Tailwind + Shadcn + Supabase (RLS). pnpm.
**Sem migration nova** (nenhum ALTER) — reavaliar só se a leitura do `avaliacao_id` exigir (P2).

### ♻️ Reaproveitar (NÃO recriar)
- `updatePerfil(userId, payloadParcial)` — `usuarios.service.ts:346` (já importado na ficha).
- `ValoresMatriculaPanel` — **molde de UX** (inputs + Save embaixo + toast).
- `InlineStatusSelect` — `src/components/dashboard/InlineStatusSelect.tsx` `{ value, options, onSave, disabled }` → selects (sexo/status).
- `lancarNota` (`notas.service.ts:122`) e `lancarFrequencia` (`frequencia.service`) — escrita no bruto.
- Estado local pendente + save em lote — padrão da Frequência flex (já validado).
- `sanitizeDate` — normalização na gravação.
- `R06_PDF` / `DossieAlunoPDF` / `ExtratoFinanceiroPDF` / `VisaoGeralFinanceiraPDF` — destravar os 2 "Em breve".

### 🔨 Construir
1. **`InlineField`** genérico (texto / número / data) — foco automático, `Esc` cancela, `Enter` confirma o campo. Não existe equivalente no projeto.
2. **Barra de seção** `● N alterações — [Cancelar] [Salvar]`, revelada quando a seção tem alteração pendente.
3. **Renderização incondicional** dos campos: vazio vira placeholder editável (hoje `{perfil.cpf && …}` faz o campo sumir).
4. **`src/utils/date.ts`** com detecção date-only vs timestamptz:
   - `/^\d{4}-\d{2}-\d{2}$/` → `new Date(iso + 'T12:00')`
   - senão → `new Date(iso)` (não quebra timestamptz, que já está correto)
5. **Histórico inline** com **selo bruto vs consolidado** + tratamento da RN4.
6. **Leitura do `avaliacao_id`** (N1/N2) na ficha — hoje `getHistoricoAluno` traz as notas mas **não os ids das avaliações**, necessários para `lancarNota`. Ajustar a leitura.

### Contratos afetados
- `updatePerfil` — já aceita payload parcial; garantir `sanitizeDate` na chamada inline (ou mover para dentro do service — decidir no P1).
- `getHistoricoAluno(alunoId, turmaId)` — estender para retornar `avaliacao_id` de N1/N2 por disciplina.
- `lancarNota(avaliacaoId, alunoId, disciplinaId, turmaId, nota, lancadoPor)` — reúso direto.

### RLS (já resolvido, sem mudança)
- `profiles_update_administracao` autoriza tudo **exceto `role`** (WITH CHECK). ✅
- Escrita de nota/falta segue as policies já existentes de `notas_aluno` / `frequencia`.

### Bug data 15.1 — pontos exatos a trocar (após criar `date.ts`)

| Arquivo | Linha | Coluna | Trocar? |
|---------|-------|--------|---------|
| `FichaAluno.tsx` | 315 | `data_nascimento` (DATE) | ✅ |
| `FichaAluno.tsx` | 591 | `data_vencimento` (DATE) | ✅ |
| `FichaAluno.tsx` | 592 | `data_pagamento` (DATE) | ✅ |
| `FichaProfessor.tsx` | 149 | `data_nascimento` (DATE) | ✅ |
| (os 7 usos timestamptz) | — | — | ❌ **já corretos, não tocar** |

---

## 3. PLANO DE EXECUÇÃO (ORDEM) — um passo por vez

| Passo | Escopo | Esforço | Depende de |
|-------|--------|---------|-----------|
| **P0** | `src/utils/date.ts` + trocar os 4 pontos DATE (bug 15.1) + `InlineField` genérico | P/M | — |
| **P1** | 16.1 Dados pessoais inline (+ Endereço + Ministério) usando `InlineField` + barra de seção + `updatePerfil` | M (~1d) | P0 |
| **P2** | 16.2 Histórico inline: estender leitura p/ `avaliacao_id`, editar N1/N2/Rec/Falta no bruto, selo bruto/consolidado, RN4 | G (~1,5–2d) | P0, P1 |
| **P3** | 16.3 Ativar Situação Financeira + Boletim (validar cobertura dos PDFs), remover Certificado/Relatório da ficha | P/M | — |

**Cada passo fecha com:** build 0 erros TS → teste em produção com conta real → push → PR → merge → pull → delete branch → `Ctrl+Shift+R` + confirmar deploy Vercel.

---

## 4. CRITÉRIOS DE ACEITE (QUANDO ESTÁ PRONTO)

### P0
- [ ] `date.ts` existe e detecta date-only vs timestamptz.
- [ ] `data_nascimento` exibe o dia correto (não −1).
- [ ] Nenhum dos 7 usos timestamptz quebrou.
- [ ] `InlineField` renderiza, foca ao clicar, `Esc` cancela, `Enter` confirma o campo.

### P1
- [ ] Clicar em nome/tel/e-mail/CPF/RG/nasc./sexo vira input **no lugar**.
- [ ] Campo vazio aparece como `— clique para preencher` (não some).
- [ ] Barra `● N alterações [Cancelar] [Salvar]` aparece **só** quando há alteração.
- [ ] Salvar grava via `updatePerfil`; erro = toast real + seção continua editável (LICAO-027).
- [ ] `role` **não** aparece inline.
- [ ] `data_nascimento` salva pela ficha com o dia correto (`sanitizeDate`).

### P2
- [ ] N1/N2/Rec editáveis inline gravam em `notas_aluno` (bruto).
- [ ] Falta editável inline grava em `frequencia` (bruto).
- [ ] Média/Freq/Status permanecem **read-only** (derivados do trigger 065).
- [ ] Selo indica se a disciplina grava no bruto ou é consolidado retroativo.
- [ ] Editar nota em disciplina sem N1/N2 → **oferece criar avaliação no ato**; só grava após criar (RN4).
- [ ] **Nenhuma** escrita direta em `matriculas_disciplina`.

### P3
- [ ] Situação Financeira e Boletim geram PDF a partir da ficha (cobertura validada).
- [ ] Certificado e Relatório Final não aparecem mais como "Em breve" na ficha.
- [ ] Ambos registrados no backlog.

---

## 5. FORA DE ESCOPO (v1.1 / backlog)

- Absorver "Lançamento Retroativo" no histórico inline.
- Correção fina de unicidade de CPF (backlog 8.9).
- Certificado de Conclusão (pré-req: assinaturas PNG + mockup aprovado).
- Relatório Final do Aluno (não existe — construir do zero depois).
- Configuração de peso/tipo de avaliação além de N1/N2 padrão.
- Frequência 2b (editar/mover data lançada) e 3 (impressão da situação real).
