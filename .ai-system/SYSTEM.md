# SYSTEM.md — DNA do Produto ITEC-EAD
# Atualizado: 2026-07-04

> Stack real: **React 18 + TS + Vite + Tailwind + Supabase + Vercel** · local `E:\_HELIOJR\ITEC\itec-ead`. Ver `STACK.md`.

## Identidade
Nome: ITEC-EAD — Plataforma de Ensino a Distância
Instituição: Instituto de Teologia Cristã
Localização: Unidade Janga, Paulista/PE
Site: https://www.itecedu.com

## Missão
Formar teólogos capacitados no conhecimento bíblico, teológico
e ministerial para servirem nas igrejas locais e organizações.

## Produto
Plataforma de gestão acadêmica completa:
matrícula → frequência/notas → materiais → financeiro → histórico consolidado
(certificado = roadmap futuro, ver "Cursos/funcionalidades futuras")

## Curso ativo
Graduação em Teologia — 3 anos — 1850h — 185 créditos
Início próxima turma: Agosto/2026
Turma: 20–30 alunos

## Personas principais
1. Hélio Paiva Jr. — superadmin, diretor acadêmico, dev
2. Secretaria (Camila) — administracao, operacional diário
3. Professores — docentes, lançam frequência, assinam contratos
4. Alunos — consumidores da plataforma

## Equipe ITEC
- Capelania: Bispo Adonias
- Reitor: Pr. Eliel
- Vice-Reitor: Rev. Alan
- Diretor Acadêmico: Pr. Helio Paiva Jr.
- Vice-Diretora Acadêmica: Prof. Andrea
- Diretor Financeiro: Rev. Breno
- Jurídico: Adv. Hugo
- Secretaria: Camila

## Regras de negócio críticas (modelo real)
- **Matrícula com funil de status** (`pendente · pre_matricula · aguardando_documentos/pagamento/aprovacao · ativa · trancada · concluida · inativa · evadida · suspensa · cancelada`). O status **`ativa` ⇄ acesso do aluno** andam sempre juntos, por qualquer tela (aprovar libera; sair de `ativa` para status revogador remove acesso; `concluida` mantém acesso do egresso). Ver LICAO-039.
- **Estrutura acadêmica:** `disciplinas_v2` (código do Manual) + módulos + **pré/co-requisitos** (`prerequisitos_v2`) que bloqueiam a matrícula na disciplina (exceção via `excecoes_prerequisito`/superadmin).
- **Aprovação na disciplina:** nota **≥ 7,0 E** frequência **≥ 75%**. Frequência < 75% → reprovação por falta. (`notas_aluno` = parciais; `matriculas_disciplina.nota` = final.)
- **Convalidação:** tabela **canônica `convalidacoes`** (documentos + fluxo `pendente→aprovado/rejeitado`, aprovação coordenador/superadmin). As colunas `convalidacao_*` foram removidas (migração 052).
- **Histórico consolidado + lançamento retroativo:** a secretaria lança aluno×cadeira de 2025 (nota/faltas/frequência/situação/professor/observação) em `matriculas_disciplina`; o histórico **prefere os valores consolidados** e cai para as parciais quando ausentes.
- **Materiais por disciplina** (`materiais`) com upload/aprovação; progresso do aluno em `progresso_aluno`.
- **Vínculo do professor:** contrato **não-encerrado** já habilita o professor a trabalhar (ver alunos, lançar nota/falta); a **assinatura física é formalidade paralela** (baixa/imprime/assina/entrega) e **não bloqueia** o uso (decisão C — R3.3a).
- Matrícula exige **validação presencial** no ITEC.
- Documentos do aluno retidos em caso de inadimplência.
- **Certificado = roadmap futuro** (não implementado; sem modelo de "pontos"/LMS).

## Cursos futuros (só LP agora)
- SETEB — Educação Teológica Básica
- Ministerial para Mulheres
- Pós-graduação (longo prazo)

## Estado atual da plataforma (Sprint D concluído)

### Implementado
- Banco completo: 19 tabelas com RLS, seed real (40 disciplinas)
- 14 services com tipagem explícita
- Painel do aluno: MeusCursos com frequência e materiais reais
- Painel do professor: lançar frequência, ver turma, preencher contrato
- Painel da secretaria: nova matrícula, financeiro, convalidações

### Próximas funcionalidades
- Testes dos 6 services Sprint D
- Geração de PDF do contrato
- Aprovação de convalidações pelo admin
- E-mail automático (cobrança, alertas)
- Financeiro automatizado (PIX/boleto)
