# SPEC SDD — Menu Notas por turma (grade inline)

**Projeto:** ITEC-EAD · **Alvo:** src/pages/dashboard/PainelAcademicoTurma.tsx (EVOLUIR, não criar nova)
**Agentes:** 06-frontend-engineer · 18-doc-writer
**Status:** aprovada pelo Helio.

## DECISAO CENTRAL
A tela de notas por turma JA EXISTE (PainelAcademicoTurma, 412 linhas, correta: escreve no
BRUTO via lancarNota -> trigger 065; media/status/freq READ do consolidado). Ela e INVISIVEL,
nao inexistente (sem entrada de menu para staff - LICAO-010). Portanto: EVOLUIR + dar menu.
NAO criar tela nova (seria a 3a UI gravando nota - duplicaria caminho de escrita).

## DECISOES TRAVADAS (Helio)
1. Escopo: pacote 1-3 fatiado em N0/N1/N2 (nao so o menu).
2. ensureAvaliacao: MANTER silencioso no Painel (contexto de turma). Ficha (P2a/RN4) mantem
   confirmacao (contexto de correcao de historico). Documentar a diferenca - nao uniformizar.
3. Nome do menu: "Notas" (espelha professor/aluno).
4. LancarNotas SOBREVIVE como caminho do professor. Painel = staff. Coexistem.

## PLANO (um passo por vez)
- N0: item "Notas" no menu (administracao/admin/superadmin) + filtro cascata
  Turma->Modulo->Disciplina (reuso Frequencia flex). Destrava o uso HOJE + resolve as 36
  disciplinas embaralhadas (081). Esforco P/M.
- N1: lancarNotasBatch (novo no notas.service, +testes) + estado pendente + 1 upsert em lote.
  Mata o gargalo (hoje recarrega a turma a cada celula). Esforco M.
- N2: trocar <Input> ad-hoc por InlineField (P0); extrair CelulaNota/validarNota da FichaAluno
  para compartilhado; selo de origem + paridade RN4 (do P2b). Esforco M.
  ⚠️ Extrair CelulaNota/ensureAvaliacao toca FichaAluno + LancarNotas (ERR-LOGIC-004) - avisar.

## REGRAS
- LICAO-042: nota no BRUTO (notas_aluno), trigger 065 consolida. NUNCA matriculas_disciplina.
- LICAO-026: query separada + merge. LICAO-027: erro Supabase nao engolido.
- LICAO-010: feature sem entrada de menu = incompleta.
- Permissao: RoleGuard superadmin/admin/administracao (financeiro NAO edita nota, fronteira 067).
- Reusar: getConsolidadoTurma, getDisciplinasDaTurma (modulo_ordem), getAvaliacoesByDisciplina,
  lancarNota, InlineField, useSecaoEditavel, padrao FrequenciaChamada.
- Construir: lancarNotasBatch + filtro de modulo.

## CRITERIOS DE ACEITE
N0: item "Notas" visivel no menu de staff -> abre o Painel · filtro Turma->Modulo->Disciplina
  funciona (modulo filtra as disciplinas, sem 36 embaralhadas) · nenhuma regressao no Painel.
N1: lancar/editar varias notas -> 1 upsert em lote (nao 1 round-trip por celula) · media
  recalcula pelo trigger apos salvar · +testes do batch.
N2: celulas usam InlineField · CelulaNota/validarNota compartilhados (FichaAluno+Painel sem
  regressao) · selo de origem por aluno/disciplina · RN4 coerente.

## FORA DE ESCOPO
Unificar LancarNotas no Painel (professor muda de fluxo) - decisao futura. Aba Chamada do
Painel (ja existe, nao mexer). Tudo que a SPEC-16 ja marcou fora de escopo.
