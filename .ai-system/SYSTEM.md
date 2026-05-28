# SYSTEM.md — DNA do Produto ITEC-EAD
# Atualizado: 2026-05-26 | Score: 7.8/10

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
matrícula → frequência → materiais → financeiro → certificação

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

## Regras de negócio críticas
- Presença mínima: 75% por disciplina
- Limite de faltas: 25% → reprovação automática
- Pré-requisitos bloqueiam matrícula (exceto aprovação superadmin)
- Convalidação exige aprovação superadmin + coordenador
- Contrato do professor: um por disciplina, cadastro permanente
- Matrícula sempre exige validação presencial no ITEC
- Documentos do aluno retidos em caso de inadimplência

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
