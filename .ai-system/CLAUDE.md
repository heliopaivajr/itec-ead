# CLAUDE.md — Sistema de Agentes IA para Gestão Documental
# ITEC – Instituto Teológico Educação Cristã | Paulista-PE

> **Este arquivo é carregado automaticamente pelo assistente de IA do ITEC.**
> Contém as regras globais que se aplicam a TODOS os agentes e a TODOS os documentos gerados.
> Nunca viole estas regras. Nunca faça exceções sem aprovação da Direção Acadêmica.

---

## 🏷️ Identidade do Projeto

```
Nome:        ITEC – Instituto Teológico Educação Cristã
Tipo:        Gestão documental institucional — seminário teológico presencial/híbrido
Stack:       Claude.ai (Sonnet 4.6) + Microsoft Word (.docx) + Google Drive
Repositório: Claude.ai — Projeto "ITEC – Gestão Documental"
Local:       Unidade Janga, Paulista-PE, Brasil
Fase:        Padronização contínua (8 de 16 manuais concluídos)
Responsável: Pr. Hélio Paiva — Diretor Acadêmico — 81-9.8272.4556
```

---

## 📋 Metodologia Obrigatória: Padrão NOVO3

**Todo documento gerado segue o padrão estabelecido no template NOVO3. Sem exceções.**

Antes de criar ou editar qualquer manual do professor, existem obrigatoriamente:
1. **Consulta ao template** — ler `ITEC_PADRAO_MANUAL_PROFESSOR.md` antes de qualquer ação
2. **Verificação da estrutura** — 16 seções na ordem exata definida no padrão
3. **Checklist de seções variáveis** — Seção 8 (Plano de Aulas) e Seção 10 (Bibliografia) são específicas por disciplina
4. **Critérios de aceite** — documento só está pronto quando todas as 16 seções estão presentes e corretas

```
REGRA ABSOLUTA: Se não há consulta ao ITEC_PADRAO_MANUAL_PROFESSOR.md, não há documento.
REGRA ABSOLUTA: Se não está no padrão, não será implementado sem aprovação da Direção Acadêmica.
REGRA ABSOLUTA: Nenhuma decisão de formatação é tomada sem base no template oficial.
```

---

## 🏛️ Arquitetura Documental

**Padrão:** 16 seções fixas + 2 seções variáveis + contrato ao final

```
Hierarquia de documentos:
  Institucional  → Manual ITEC 2025, Estatuto, Estrutura Organizacional
  Acadêmico      → Manuais do Professor (16 disciplinas), Manual do Aluno
  Operacional    → Horários, Matriz RACI, Atribuições da Secretaria
  Jurídico       → Contratos (Aluno e Professor)
  Didático       → Apostilas por disciplina

IA pode criar/modificar livremente:
  ✅ Seções variáveis (Seção 8 — Plano de Aulas, Seção 10 — Bibliografia)
  ✅ Novos documentos baseados nos templates estabelecidos
  ✅ Revisões incrementais de documentos existentes (REV+1)
  ✅ Apostilas didáticas (skill itec-apostila)
  ✅ Sugestões de melhoria e identificação de inconsistências

IA NUNCA modifica sem aprovação da Direção Acadêmica:
  ❌ Seções 11 a 16 (fixas e idênticas em todos os manuais)
  ❌ Missão, Visão e Valores institucionais (Seção 2)
  ❌ Contatos da liderança (Seção 4) — só atualizar se informado pela Direção
  ❌ Regras de avaliação (nota 7,0 e frequência 75%) — definidas pela instituição
  ❌ Estrutura das 16 seções — ordem e nomenclatura são imutáveis
```

**Skills disponíveis:** `itec-apostila`, `docx`, `xlsx`, `sermao`, `brainstorming`, `file-reading`
**Template oficial:** `ITEC_PADRAO_MANUAL_PROFESSOR.md`
**Instruções de uso:** `ITEC_INSTRUCOES_MELHORIA_CONTINUA.md`

---

## 📝 Convenções de Documentos

```
# Nomenclatura
Manuais do Professor:  MP-ITEC_-_[CÓDIGO]_-_[Nome_da_Disciplina].docx
Outros documentos:     [NOME_DO_DOCUMENTO]_-_ITEC_-_[CÓDIGO].docx
Apostilas:             Apostila_ITEC_[Disciplina]_-_rev00.docx
Versionamento:         sufixo REV00, REV01... ou rev010, rev011... — sempre incrementar

# Formatação padrão
Fonte:                 Arial — em TODO o documento, sem exceção
Corpo do texto:        10pt (size 20 em half-points no python-docx)
Tabelas de aulas:      9pt  (size 18 em half-points no python-docx)
Cor primária:          #C00000 (vermelho institucional)
Cor secundária:        #1F3864 (azul escuro)
Fundo de tabelas:      #F2F2F2 (cinza claro)

# Caixas de destaque (obrigatórias nos manuais)
⚠ Atenção (amarela):  fundo #FFF2CC | borda #FFC000 — alertas pedagógicos
🚫 Proibição (vermelha): fundo #C00000 | texto branco — pirataria e plágio

# Tabela do Plano de Aulas (Seção 8)
SEMPRE 3 colunas: Aula | Título | Conteúdo Programático
NUNCA adicionar coluna de bibliografia na tabela
NUNCA adicionar coluna de referências na tabela
10 aulas com 4 tópicos de conteúdo acadêmico cada
```

---

## 🗄️ Regras de Conteúdo Acadêmico

```
# Obrigatório em todo manual do professor:
- 16 seções na ordem exata do template NOVO3
- 3 caixas amarelas obrigatórias no início da Seção 8
- Seção 14 SEMPRE referencia a Lei 9.610/1998
- Seção 14 SEMPRE tem 2 caixas vermelhas (pirataria + plágio)
- Contrato de Prestação de Serviços ao final de cada manual

# EAD — regra inviolável:
Disciplina de 40h = 1 ÚNICA atividade EAD (10h / 1 crédito)
Disciplina de 60h = múltiplas atividades EAD totalizando 30h
NUNCA criar múltiplas atividades EAD para disciplina de 40h

# Avaliação — regra inviolável:
Nota mínima: 7,0
Frequência mínima: 75%
Professor tem liberdade de formato — mas notas DEVEM ser comprováveis documentalmente
Notas presencial e EAD registradas SEPARADAMENTE

# Linguagem:
Curso livre superior de teologia — linguagem acadêmica de nível superior
Termos: exegético, histórico-crítico, teológico, hermenêutico
NUNCA linguagem infantilizada ou simplificada demais para o nível do curso
SEMPRE respeito à diversidade denominacional — neutralidade em temas não consensuais
```

---

## 🔒 Integridade Documental

```
NUNCA modificar campos de dados críticos sem instrução explícita:
  - Contatos da liderança
  - Valores de mensalidade ou honorários
  - CNPJ e endereço do ITEC

SEMPRE sinalizar campos em branco encontrados nos documentos
SEMPRE sinalizar inconsistências entre documentos diferentes
SEMPRE indicar: o que muda, por quê e qual o benefício ao propor melhoria

NUNCA circular documentos com campos críticos em branco:
  - Contratos sem CNPJ, endereço completo, honorários ou dados bancários

SEMPRE manter alinhamento com a missão, visão e valores cristãos do ITEC
SEMPRE usar linguagem respeitosa, ministerial e alinhada aos valores do ITEC
```

---

## 📝 Versionamento e Rastreabilidade

```
# Formato obrigatório ao gerar nova revisão
REV00 → REV01 → REV02 ...  (documentos institucionais)
rev010 → rev011 → rev012 ... (manuais com formato alternativo)

# Ao entregar nova revisão, sempre informar:
- Número da nova versão
- O que foi alterado em relação à versão anterior
- Campos ainda pendentes (em branco ou a confirmar)
- Sugestões de próximos passos

# Rastreabilidade de decisões
Toda decisão relevante de formatação ou conteúdo deve ser explicada
Dúvidas sobre conteúdo disciplinar → encaminhar ao professor responsável
Dúvidas sobre padrão → consultar ITEC_PADRAO_MANUAL_PROFESSOR.md
Dúvidas sobre política institucional → Direção Acadêmica (Pr. Hélio Paiva / Prof. Andrea)
```

---

## 🚫 O Que NUNCA Fazer

```
❌ Criar documento sem consultar o template correspondente
❌ Adicionar coluna de bibliografia na tabela do Plano de Aulas
❌ Criar mais de 1 atividade EAD em disciplina de 40h
❌ Modificar as Seções 11 a 16 individualmente em qualquer manual
❌ Usar fonte diferente de Arial em qualquer parte do documento
❌ Alterar a estrutura de 16 seções sem aprovação da Direção Acadêmica
❌ Omitir as caixas amarelas obrigatórias da Seção 8
❌ Omitir as caixas vermelhas obrigatórias da Seção 14
❌ Omitir a referência à Lei 9.610/1998 na Seção 14
❌ Circular contrato com campos em branco (CNPJ, endereço, honorários)
❌ Tomar decisão de política acadêmica — apenas implementar o que foi definido
❌ Inventar dados de contato, datas ou valores não informados — sempre sinalizar como pendente
❌ Usar linguagem inapropriada para o contexto ministerial e cristão do ITEC
```

---

## ✅ Fluxo de Trabalho Padrão

```
1. Identificar o tipo de documento solicitado
2. Consultar o template correspondente:
   - Manual do Professor → ITEC_PADRAO_MANUAL_PROFESSOR.md
   - Apostila            → skill itec-apostila (SKILL.md)
   - Documento Word      → skill docx (SKILL.md)
   - Planilha            → skill xlsx (SKILL.md)
3. Verificar se existe versão anterior do documento no projeto
4. Identificar seções variáveis (específicas da disciplina) x fixas (idênticas)
5. Gerar o documento respeitando todas as convenções de formatação
6. Sinalizar campos em branco ou pendências encontradas
7. Entregar o arquivo .docx com nome no padrão correto
8. Informar: versão gerada, o que foi feito, pendências e próximos passos
9. Se melhoria identificada: propor com justificativa — não implementar sem aprovação
10. Se decisão de política acadêmica necessária: encaminhar à Direção Acadêmica
```

---

## 🔄 Ciclo de Melhoria Contínua

```
Mensal:          "Que melhorias você sugere para este mês nos documentos do ITEC?"
Semestral:       "Revise todos os planos de curso e liste inconsistências."
Antes de turma:  "Gere a revisão atualizada do Manual do Aluno para a turma de [ano]."
Ao padronizar:   "Crie o manual do professor para a disciplina [CÓDIGO] seguindo o padrão NOVO3."
Ao mudar algo:   "Atualize o [documento] com esta nova informação: [detalhe]."
```

---

## 📌 Referências Rápidas

```
Template manuais:       ITEC_PADRAO_MANUAL_PROFESSOR.md
Instruções de uso:      ITEC_INSTRUCOES_MELHORIA_CONTINUA.md
Documento de referência: MP-ITEC_-_NOVO3_-_Introdução_ao_NT3.docx
Stack completa:         STACK.md
Contexto do produto:    SYSTEM.md
Lei de direitos autorais: Lei 9.610/1998 (Seção 14 de todo manual)

Contatos rápidos:
  Diretor Acadêmico:       Pr. Hélio Paiva  — 81-9.8272.4556
  Vice-Diretora Acadêmica: Prof. Andrea     — 81-9.8956.4978
  Reitor:                  Pr. Eliel        — 81-9.8427.4078
```

---

*CLAUDE.md — ITEC Instituto Teológico Educação Cristã*
*Responsável: Pr. Hélio Paiva — Direção Acadêmica*
*Versão: 1.0 — Maio/2026*
*Qualquer alteração deve ser validada pela Direção Acadêmica*
