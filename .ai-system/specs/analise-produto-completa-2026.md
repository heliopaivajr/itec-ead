# Análise de Produto Completa — ITEC-EAD
**Agente:** 19-product-analyst
**Data:** 2026-05-28
**Versão da plataforma:** Sprint I concluído · Score 9.2/10 · 163 testes
**Solicitante:** Hélio Paiva Jr.
**Escopo:** Análise estratégica total — diagnóstico + roadmap + visão de futuro

---

## Prefácio — O que é o ITEC-EAD

O ITEC não é uma plataforma EAD genérica.
É a casa digital de uma instituição teológica com vocação ministerial.
Seus alunos são membros de igrejas, ministros, pastores em formação.
Seus professores são teólogos e pastores — não acadêmicos corporativos.
A secretaria é uma pessoa real que substituiu planilhas por sistema.

Toda funcionalidade deve ser avaliada nessa lente:
**Isso serve ao ministério? Isso honra quem vai usar?**

---

## PARTE 1 — Diagnóstico Atual

### O que existe hoje (mapeamento honesto)

| Área | Existe | Completo? | O que falta | Impacto atual |
|------|--------|-----------|-------------|---------------|
| **Landing Page** | ✅ | Quase | Blog/Comunidade são stubs | Baixo — externo ao EAD |
| **Reserva de Vaga / Leads** | ✅ | Sim | — | Funcional |
| **Autenticação** | ✅ | Sim | Google OAuth (pausado Free plan) | Baixo |
| **Roles e Permissões** | ✅ | Sim | — | 6 roles funcionando |
| **Matrículas** | ✅ | Parcial | Fluxo pós-matrícula, email boas-vindas | Alto |
| **Ficha do Aluno** | ✅ | Parcial | Foto, endereço completo, histórico de status | Alto |
| **Financeiro** | ✅ | Parcial | PIX/boleto, recibo, notificação automática | Alto |
| **Frequência** | ✅ | Parcial | Lançamento por professor (N+1 fix pendente) | Médio |
| **Notas / Avaliações** | ❌ | — | Não existe | Crítico |
| **Materiais de Aula** | ✅ | Parcial | Upload real, não apenas link | Médio |
| **Painel do Aluno** | ✅ | Parcial | Notas, calendário, histórico completo | Alto |
| **Painel do Professor** | ✅ | Parcial | Notas, materiais, comunicação turma | Médio |
| **Gestão de Turmas** | ✅ | Parcial | Vínculo completo aluno↔turma↔disciplina | Médio |
| **Convalidações** | ✅ | Parcial | Fluxo de aprovação, encapsular service | Baixo |
| **Contratos Professor** | ✅ | Parcial | PDF gerado, assinatura digital ausente | Médio |
| **Equipe ITEC** | ✅ | Sim | — | Funcional |
| **Avisos / Comunicação** | ✅ | Parcial | Notificações push/email, targeting por turma | Alto |
| **Vídeos / EAD online** | ❌ | — | Não existe | Crítico para EAD |
| **Certificados** | ❌ | — | Não existe | Crítico |
| **Documentos do Aluno** | ✅ | Parcial | Declaração de matrícula, histórico escolar | Alto |
| **Pré-requisitos** | ✅ | Sim | Bloqueio implementado | Funcional |
| **Analytics / Relatórios** | ❌ | — | Nenhum relatório exportável | Médio |
| **Calendário Acadêmico** | ❌ | — | Não existe | Alto |
| **Fórum / Comunidade** | ❌ | — | Stub apenas | Pode esperar |
| **App Mobile** | ❌ | — | Não planejado | Pode esperar |

---

### Análise das 10 Dimensões de Completude

#### D1 — Cadastro e Dados do Aluno
**Estado:** Parcial

Existe: nome, CPF, email, telefone, endereço parcial, observações.
Falta: foto do aluno, RG, data de nascimento (em uso?), cidade/UF/CEP separados, nome do cônjuge/responsável, denominação/igreja de origem, ministério atual.

**Pergunta-chave:** A secretaria consegue emitir declaração de matrícula com esses dados?
→ **Não.** Faltam endereço completo validado e data de nascimento visível na ficha.

#### D2 — Fluxo de Matrícula
**Estado:** Parcial

Existe: criação de matrícula pela secretaria, vínculo com aluno.
Falta: e-mail automático de boas-vindas ao aluno após aprovação, checklist de documentos obrigatórios, protocolo de matrícula numerado, status history (quem aprovou, quando).

**Pergunta-chave:** A secretaria consegue executar esse fluxo sem depender do dev?
→ **Sim, com limitações.** O fluxo existe mas não tem confirmação ao aluno.

#### D3 — Acesso e Permissões
**Estado:** Completo

6 roles funcionando corretamente. Menus diferenciados. ProtectedRoute com warmup.
Sem gaps de segurança identificados.

**Pergunta-chave:** Um novo membro da secretaria trabalha sem treinamento extenso?
→ **Sim**, a UX é clara o suficiente.

#### D4 — Estrutura Acadêmica
**Estado:** Parcial — lacuna crítica

Existe: cursos, módulos, disciplinas_v2, pré-requisitos, frequência.
Falta: **NOTAS E AVALIAÇÕES** — isso é a lacuna mais crítica de todo o sistema.
Sem notas, o ITEC não pode reprovar, aprovar nem emitir histórico.
Também falta: calendário de aulas, cronograma por turma, datas de avaliação.

**Pergunta-chave:** A estrutura reflete como o ITEC funciona na prática?
→ **Não plenamente.** Frequência existe, notas não.

#### D5 — Certificados e Documentos
**Estado:** Ausente — lacuna crítica

Nenhum documento digital pode ser gerado hoje.
Falta: certificado de conclusão, declaração de matrícula, histórico escolar,
declaração de frequência, comprovante de matrícula, atestado de vínculo.

**Pergunta-chave:** O ITEC consegue substituir documentos físicos por digitais?
→ **Não.**

#### D6 — Financeiro
**Estado:** Parcial — operacional mas manual

Existe: registro de mensalidades, controle de inadimplentes, registro de pagamento manual, upload de comprovante.
Falta: PIX/boleto integrado, recibo de pagamento em PDF, notificação automática de vencimento, relatório mensal de receita, isenções e bolsas, parcelamento de matrícula.

**Pergunta-chave:** A secretaria identifica inadimplentes sem planilha externa?
→ **Sim** — isso já funciona bem.

#### D7 — Comunicação Interna
**Estado:** Parcial

Existe: avisos gerais (admin→alunos, admin→professores, professor→alunos).
Falta: notificações por email, notificações in-app (badge não lido), targeting por turma específica, canal direto professor↔aluno, comunicação automática (cobrança, nota lançada, falta registrada).

**Pergunta-chave:** Um aviso urgente chega a quem precisa sem depender de WhatsApp?
→ **Não.** O aviso fica no sistema mas o aluno precisa abrir o painel para ver.

#### D8 — Painel do Aluno
**Estado:** Parcial

Existe: MeusCursos com frequência real, materiais, badge de alerta de frequência.
Falta: notas visíveis, histórico de mensalidades próprias, calendário de aulas, próxima aula/avaliação, progresso geral do curso (% concluído), status financeiro resumido.

**Pergunta-chave:** O aluno encontra tudo que precisa sem perguntar à secretaria?
→ **Não.** Notas e calendário são ausências críticas.

#### D9 — Coerência Institucional e Teológica
**Estado:** Bom

A plataforma tem tom sóbrio e institucional. Linguagem adequada.
Oportunidades: nomes de seções poderiam refletir mais o contexto teológico
(ex: "Meus Cursos" → "Minha Jornada Acadêmica"; "Avisos" → "Comunicados").
Funcionalidades únicas para teologia estão totalmente ausentes.

**Pergunta-chave:** Um pastor visitando reconhece que é escola teológica?
→ **Parcialmente.** O conteúdo sim; as features, não.

#### D10 — Operacionalidade sem o Dev
**Estado:** Parcial

A secretaria consegue operar o dia a dia: matrículas, financeiro, avisos, ficha do aluno.
Mas há dependências do dev: gerar PDFs de documentos, qualquer problema de role, configurar novos professores sem cadastro correto, lançar frequência de aluno que não está na turma.

**Pergunta-chave:** Se Hélio viajasse por 2 semanas, o ITEC funciona normalmente?
→ **Sim para operações básicas. Não para situações fora do fluxo padrão.**

---

## PARTE 2 — Roadmap Completo

### RELEASE 1 — Operação Básica (Agora · Sprint J+K)
*O mínimo para o ITEC operar sem papel e sem WhatsApp*

#### Notas e Avaliações (🔴 CRÍTICO — sem isso o ITEC não funciona academicamente)
- Professor lança notas por disciplina (N1, N2, Recuperação, Média Final)
- Cálculo automático de aprovação/reprovação (média ≥ 7.0 + frequência ≥ 75%)
- Aluno vê suas próprias notas no painel
- Secretaria/admin vê notas consolidadas por turma

#### Documentos Básicos (🔴 CRÍTICO)
- Declaração de matrícula em PDF (gerada pela secretaria)
- Histórico escolar simplificado (disciplinas + notas + frequência)
- Comprovante de matrícula com número de protocolo

#### E-mail Automático Básico (🔴 CRÍTICO)
- Boas-vindas ao aluno após matrícula aprovada
- Aviso de mensalidade vencida (D+1, D+5, D+10)
- Lembrete de aviso da secretaria com link

#### Calendário Acadêmico (🟡 IMPORTANTE)
- Datas de início/fim de semestre por turma
- Datas de avaliação cadastradas pelo admin
- Aluno vê próximas aulas/provas no painel

#### Fix de Performance (🔴 em andamento — relatório de auditoria)
- Fix N+1 em LancarFrequencia e VerTurma
- Encapsular queries de FichaAluno no service
- Adicionar LIMITs em getTurmas e getEquipe

---

### RELEASE 2 — EAD Funcional (3-6 meses · Sprint K+L)
*Aluno aprende online de verdade*

#### Vídeos EAD (YouTube não listado → Cloudflare Stream)
- Campo de URL de vídeo por material/aula
- Player embedado no painel do aluno
- Marcar vídeo como "assistido"
- Progresso de vídeo conta para frequência EAD

#### Certificados Digitais
- Verificação automática de conclusão (frequência + notas + financeiro)
- Geração de PDF com assinatura e QR Code
- Página pública de validação: itecedu.com/verificar/[codigo]
- Download pelo aluno, emissão manual pela secretaria

#### Upload de Materiais Real
- Professor faz upload de PDF/slides diretamente
- Aluno baixa material no painel
- Organizado por disciplina e módulo

#### Financeiro Automatizado
- Geração automática de boleto/PIX (via Asaas ou Pagar.me)
- Aluno paga diretamente pelo painel
- Recibo gerado automaticamente após pagamento confirmado

---

### RELEASE 3 — Comunidade (6-12 meses)
*Alunos e professores conectados dentro da plataforma*

#### Fórum por Disciplina
- Tópicos criados pelo professor
- Respostas dos alunos
- Moderação pelo professor

#### Agenda de Eventos Institucionais
- Cultos, retiros, conferências
- Aluno se inscreve em eventos
- Integração com Google Calendar (exportar .ics)

#### Notificações Inteligentes
- Badge de não lidos no painel
- Push notification (PWA)
- Configuração de preferências pelo aluno

#### Diário Espiritual do Aluno (feature teológica única)
- Espaço privado para anotações pessoais
- Reflexões sobre os conteúdos estudados
- Visível apenas pelo próprio aluno

---

### RELEASE 4 — Escala (1-2 anos)
*Múltiplos cursos, múltiplas unidades, analytics*

#### Multi-curso
- SETEB e Ministerial para Mulheres com estruturas próprias
- Matrículas por curso com regras distintas
- Dashboard consolidado por curso

#### Analytics Institucional
- Taxa de evasão por turma
- Desempenho médio por disciplina
- Alunos em risco de reprovação (alerta automático)
- Relatório mensal exportável (PDF/Excel) para a direção

#### Portal do Egresso
- Cadastro de alunos formados
- Depoimentos na landing page
- Rede de conexão entre egressos e igrejas

#### IA de Suporte Acadêmico
- Chatbot que responde dúvidas sobre o regulamento
- Sugere materiais complementares por disciplina
- Alerta personalizado de risco de reprovação

---

### RELEASE 5 — Liderança no Mercado (2-5 anos)
*A maior plataforma de teologia do Brasil*

#### App Mobile (React Native)
- Painel do aluno completo no celular
- Assistir aulas offline (download de vídeo)
- Notificações push nativas

#### Devocional Diário Integrado
- Versículo do dia contextualizado à disciplina em curso
- Reflexão curta (300 palavras) gerada com IA + revisada por teólogo
- Compartilhável nas redes sociais

#### Linha do Tempo Bíblica Interativa
- Ferramenta visual de estudo: eventos, personagens, livros
- Integrada às disciplinas de AT, NT e História da Igreja
- Filtrável por período, personagem, livro bíblico

#### Biblioteca Teológica Digital
- Livros e apostilas em formato leitura
- Anotações pessoais no texto
- Busca semântica por tema teológico

#### Certificação por Denominação
- Parceria com denominações (Assembleia, Batista, Presbiteriana)
- Reconhecimento formal do ITEC por essas denominações
- Diploma com endosso denominacional

#### Integração com Plataformas de Sermões
- Link com Pregue.me, SermonAudio ou similar
- Aluno acessa sermões complementares por tema
- Professor indica sermões como material de pesquisa

---

## PARTE 3 — Ideias Inovadoras para Teologia

Funcionalidades que plataformas EAD genéricas (Moodle, Hotmart, Udemy) não têm
e que fazem sentido profundo para uma escola teológica:

### 🕊️ Funcionalidades de Identidade Teológica

**1. Devocional Integrado ao Currículo**
Cada disciplina tem um versículo âncora. Todo dia letivo, o aluno recebe uma reflexão de 200 palavras conectando o versículo ao conteúdo que está estudando. Não é conteúdo extra — é formação espiritual integrada à formação acadêmica.

**2. Diário Espiritual do Aluno**
Espaço privado no painel. O aluno registra insights, orações, revelações durante o curso. No final do semestre, recebe um PDF compilado do que anotou — um "diário de formação" que vai além do histórico escolar.

**3. Comunidade de Oração**
Antes de cada aula EAD, um banner com pedido de oração do colega (voluntário, anônimo se preferir). Cria senso de comunidade que plataformas genéricas perdem.

**4. Perfil Ministerial do Aluno**
Além dos dados acadêmicos: Igreja de origem, ministério atual (coral, louvor, ensino, evangelismo), data de conversão, denominação. O ITEC sabe com quem está formando — não apenas CPF e notas.

### 📖 Ferramentas de Estudo Teológico

**5. Linha do Tempo Bíblica Interativa**
Componente visual: seleciona uma disciplina → vê os eventos históricos relevantes em ordem cronológica. Estudando Paulo? A linha do tempo mostra Pentecostes → conversão de Paulo → viagens → prisão → Roma. Interativo, clicável, com mapas.

**6. Mapa das Viagens de Paulo**
Para disciplinas de NT: mapa interativo com as 3 viagens missionárias. Cidades clicáveis mostram o que aconteceu lá (Filipos → prisão; Éfeso → confronto com Ártemis; Atenas → discurso no Areópago). Substitui slides estáticos por experiência imersiva.

**7. Árvore Genealógica Bíblica**
Para disciplinas de AT e Hermenêutica. Famílias patriarcais visuais: Abraão → Isaque → Jacó → 12 tribos. Reis de Israel e Judá. Linha messiânica. Filtros por livro bíblico.

**8. Player de Áudio da Bíblia**
Integração com API de áudio da Bíblia (Bible.is/Faith Comes By Hearing). Aluno estuda um texto → ouve a perícope narrada. Para disciplinas de homilética: análise do texto ouvido, não apenas lido.

### 🏛️ Funcionalidades Institucionais Únicas

**9. Certificação Denominacional**
Além do diploma do ITEC, o aluno pode solicitar reconhecimento formal pela sua denominação. O sistema gera um documento específico no formato que a denominação aceita. ITEC vira ponte entre formação e reconhecimento eclesial.

**10. Portal do Egresso Ministerial**
Alunos formados entram num diretório (com consentimento): nome, ministério, cidade, especialidade (Teologia Sistemática, Missões, Aconselhamento Pastoral). Igrejas que precisam de líderes consultam o portal. O ITEC vira referência de formação ministerial no Nordeste.

**11. Sermões como Conteúdo Acadêmico**
Professor indica 3 sermões relevantes por disciplina (links do YouTube, Spotify ou texto). O aluno "assiste" como material complementar e registra reflexão. Homilética prática integrada ao currículo teórico.

**12. Registro de Ministério**
Ao longo do curso, o aluno registra onde está servindo: pregações realizadas, visitas pastorais, projetos de missão. Não é avaliado — é formativo. No final, tem um portfólio ministerial além do diploma.

---

## PARTE 4 — Priorização MoSCoW

### 🔴 Must Have (essencial para lançar/operar)

| Feature | Justificativa |
|---------|---------------|
| Sistema de notas e avaliações | Sem notas, o ITEC não pode reprovar nem emitir histórico |
| Declaração de matrícula PDF | Alunos pedem isso semanalmente |
| E-mail automático pós-matrícula | Processo de onboarding quebrado sem isso |
| Fix N+1 (LancarFrequencia, VerTurma) | Lentidão grave ao abrir página do professor |
| Histórico escolar básico | Necessário para certificação |
| Vídeos EAD (YouTube embed) | Core do EAD — sem isso o "presencial+EAD" não funciona |
| Certificado de conclusão | Produto final do curso — razão de existência da plataforma |

### 🟠 Should Have (importante, há workaround temporário)

| Feature | Justificativa |
|---------|---------------|
| Calendário acadêmico | Aluno precisa saber quando são as aulas e provas |
| Notificação por e-mail de avisos | Hoje o aluno não sabe que existe aviso novo |
| Upload de materiais pelo professor | Hoje o professor envia link, não arquivo |
| Recibo de pagamento PDF | Aluno pede comprovante — hoje não existe |
| Perfil ministerial do aluno | Diferencia o ITEC de plataformas genéricas |
| Diário espiritual | Formação integral — além do acadêmico |

### 🟡 Could Have (diferencial real, pode esperar)

| Feature | Justificativa |
|---------|---------------|
| PIX/boleto integrado | Hoje funciona no manual — não é bloqueante |
| Fórum por disciplina | Comunicação existe via avisos |
| Devocional integrado | Potencialmente viral — marca o ITEC |
| Linha do tempo bíblica | Feature exclusiva, sem concorrente no Brasil |
| Analytics de evasão | Útil após 3 turmas ativas |
| Portal do egresso | Necessário apenas após as primeiras formações |

### 🟢 Won't Have agora (futuro, após escala)

| Feature | Justificativa |
|---------|---------------|
| App mobile | PWA suficiente por enquanto |
| IA de suporte acadêmico | Infraestrutura insuficiente para escala |
| Integração denominacional | Requer parcerias formais — processo longo |
| Biblioteca teológica digital | Direitos autorais complexos |
| Mapa de Paulo interativo | Alto esforço, baixo impacto imediato |
| Árvore genealógica bíblica | Alto esforço, baixo impacto imediato |

---

## PARTE 5 — User Stories das Top 10 Features

---

### US-01 — Sistema de Notas e Avaliações

**COMO** professor do ITEC
**QUERO** lançar notas por disciplina (N1, N2, Recuperação, Média Final)
**PARA** que a secretaria e o aluno acompanhem o desempenho e o sistema calcule aprovação automaticamente

**CRITÉRIOS DE ACEITE:**
- [ ] Professor lança N1 e N2 por aluno por disciplina
- [ ] Sistema calcula Média Final automaticamente ((N1+N2)/2)
- [ ] Média ≥ 7.0 e frequência ≥ 75% → status "aprovado"
- [ ] Média < 7.0 → status "recuperação" (professor lança nota de recuperação)
- [ ] Frequência < 75% → reprovado por falta, mesmo com nota aprovada
- [ ] Aluno vê suas notas no painel (só as próprias)
- [ ] Secretaria/admin vê todas as notas por turma
- [ ] Notas só podem ser alteradas pelo professor que lançou ou pelo superadmin

**ESFORÇO:** G
**PRIORIDADE:** Alta

---

### US-02 — Declaração de Matrícula em PDF

**COMO** Camila (secretaria)
**QUERO** gerar uma declaração de matrícula em PDF para qualquer aluno ativo
**PARA** que o aluno possa comprovar seu vínculo com o ITEC sem depender de documento físico

**CRITÉRIOS DE ACEITE:**
- [ ] Botão "Gerar Declaração" na ficha do aluno
- [ ] PDF gerado em < 3 segundos com: logo ITEC, nome completo, CPF, curso, turma, status, data de matrícula, data de emissão, assinatura da Direção
- [ ] Numeração sequencial única por declaração
- [ ] PDF baixado diretamente pelo navegador
- [ ] Secretaria pode gerar para qualquer aluno ativo
- [ ] Aluno pode gerar a própria declaração no painel (somente leitura)

**ESFORÇO:** M
**PRIORIDADE:** Alta

---

### US-03 — E-mail Automático de Boas-Vindas

**COMO** aluno recém-matriculado
**QUERO** receber um e-mail de boas-vindas após minha matrícula ser aprovada
**PARA** saber que estou oficialmente matriculado e ter as instruções de acesso

**CRITÉRIOS DE ACEITE:**
- [ ] E-mail enviado automaticamente quando matrícula muda de "pendente" para "ativa"
- [ ] Conteúdo: boas-vindas personalizado com nome, dados da turma, link de acesso ao painel, contato da secretaria
- [ ] Template com identidade visual do ITEC (logo, cores)
- [ ] E-mail enviado em até 5 minutos após aprovação
- [ ] Secretaria pode reenviar manualmente se necessário
- [ ] Log de e-mails enviados visível para a secretaria

**ESFORÇO:** M
**PRIORIDADE:** Alta

---

### US-04 — Vídeos EAD Embedados no Painel

**COMO** aluno
**QUERO** assistir às aulas em vídeo diretamente no painel do ITEC
**PARA** não precisar sair da plataforma para estudar o conteúdo EAD

**CRITÉRIOS DE ACEITE:**
- [ ] Professor/admin vincula URL de vídeo (YouTube não listado) a um material
- [ ] No painel do aluno, o vídeo aparece embedado (iframe responsivo)
- [ ] Aluno marca o vídeo como "assistido" (1 clique)
- [ ] Progresso de vídeos assistidos visível no painel
- [ ] Vídeos marcados como "assistidos" contam para progresso EAD da disciplina
- [ ] Se URL inválida, exibe mensagem de erro amigável

**ESFORÇO:** M
**PRIORIDADE:** Alta

---

### US-05 — Certificado de Conclusão com QR Code

**COMO** aluno que concluiu o curso
**QUERO** baixar meu certificado digital com QR Code de validação
**PARA** comprovar minha formação em qualquer contexto ministerial ou eclesial

**CRITÉRIOS DE ACEITE:**
- [ ] Sistema verifica automaticamente: frequência ≥ 75% em todas as disciplinas, média ≥ 7.0 em todas as disciplinas, sem pendências financeiras
- [ ] Certificado gerado em PDF: nome completo, CPF, curso, carga horária (1850h), data de conclusão, assinaturas (Reitor e Diretor Acadêmico), número de registro único
- [ ] QR Code aponta para: itecedu.com/verificar/[codigo]
- [ ] Página pública de verificação mostra: nome, curso, data, "Certificado válido ✅"
- [ ] Registro único criado no banco com número sequencial
- [ ] Secretaria pode emitir manualmente e bloquear emissão (inadimplência)
- [ ] Aluno pode baixar somente quando sistema confirma conclusão

**ESFORÇO:** G
**PRIORIDADE:** Alta

---

### US-06 — Calendário Acadêmico no Painel

**COMO** aluno
**QUERO** ver as datas das aulas, avaliações e eventos do ITEC no meu painel
**PARA** me organizar e não perder nenhuma atividade importante

**CRITÉRIOS DE ACEITE:**
- [ ] Admin/secretaria cadastra eventos no calendário: aulas, avaliações, feriados, retiros, cultos institucionais
- [ ] Calendário mensal visível no painel do aluno
- [ ] Eventos diferenciados por tipo (aula, avaliação, evento institucional)
- [ ] Próximos 3 eventos aparecem no dashboard inicial
- [ ] Aluno pode exportar para Google Calendar (.ics)
- [ ] Professor vê calendário filtrado pelas suas turmas

**ESFORÇO:** M
**PRIORIDADE:** Média

---

### US-07 — Perfil Ministerial do Aluno

**COMO** Hélio (diretor)
**QUERO** que o cadastro do aluno inclua dados do ministério e vida eclesial
**PARA** que o ITEC conheça verdadeiramente quem está formando e possa acompanhar o impacto da formação

**CRITÉRIOS DE ACEITE:**
- [ ] Campos adicionais na ficha: Igreja de origem, cidade da igreja, denominação, ministério atual (lista múltipla: pregação, música, louvor, ensino, evangelismo, pastoral, missões, outro)
- [ ] Data de conversão (opcional)
- [ ] Cargo na igreja atual (membro, diácono, presbítero, pastor, bispo, outro)
- [ ] Campo de testemunho/vocação (texto livre, 500 chars)
- [ ] Dados visíveis na ficha do aluno pela secretaria e admin
- [ ] Aluno preenche no próprio painel (Perfil)
- [ ] Campos NÃO obrigatórios — o aluno pode completar aos poucos

**ESFORÇO:** P
**PRIORIDADE:** Média

---

### US-08 — Diário Espiritual do Aluno

**COMO** aluno em formação
**QUERO** um espaço privado para registrar reflexões, orações e insights durante o curso
**PARA** documentar minha jornada de formação espiritual além do histórico acadêmico

**CRITÉRIOS DE ACEITE:**
- [ ] Aba "Diário" no painel do aluno (privada — nem admin vê)
- [ ] Editor simples: data (automática), título, texto livre
- [ ] Pesquisa por palavra-chave nas entradas
- [ ] No final de cada semestre: opção de exportar as entradas em PDF ("Meu Diário de Formação — [Semestre]")
- [ ] Entradas visíveis somente pelo próprio aluno (RLS restritivo)
- [ ] Sem limite de entradas

**ESFORÇO:** M
**PRIORIDADE:** Média

---

### US-09 — Devocional Diário Integrado ao Currículo

**COMO** aluno matriculado em uma disciplina
**QUERO** receber uma reflexão devocional diária conectada ao conteúdo que estou estudando
**PARA** integrar formação teológica acadêmica e formação espiritual no dia a dia

**CRITÉRIOS DE ACEITE:**
- [ ] Admin cadastra 10 devocionais por disciplina (um para cada aula/semana)
- [ ] Devocional aparece no painel do aluno no dia correspondente à aula
- [ ] Cada devocional: versículo âncora, título, texto de 200-300 palavras, pergunta de reflexão
- [ ] Aluno pode marcar como "lido" e adicionar uma linha de reflexão pessoal (vai para o diário)
- [ ] Devocionais não são avaliados — são formativos
- [ ] Notificação opcional por e-mail: "Seu devocional de hoje está disponível"

**ESFORÇO:** M
**PRIORIDADE:** Média (alta diferenciação)

---

### US-10 — Portal do Egresso Ministerial

**COMO** aluno formado pelo ITEC
**QUERO** fazer parte de um diretório de egressos
**PARA** que igrejas e ministérios encontrem líderes formados pelo ITEC e que eu mantenha vínculo com a instituição

**CRITÉRIOS DE ACEITE:**
- [ ] Após emissão do certificado, aluno é convidado a criar perfil no portal
- [ ] Perfil público (com consentimento): nome, foto, ministério atual, cidade, especialidade, ano de formação
- [ ] Busca pública: por cidade, denominação, especialidade
- [ ] Página: itecedu.com/egressos
- [ ] Aluno pode atualizar seu perfil a qualquer momento
- [ ] Admin modera perfis (aprovar/ocultar)
- [ ] Estatística pública: "X pastores e líderes formados pelo ITEC"

**ESFORÇO:** G
**PRIORIDADE:** Baixa (necessário após primeiras formações)

---

## PARTE 6 — Recomendação Final

### O próximo sprint que gera MAIS valor para o ITEC

**Sprint J: Notas + Documentos + E-mail**

**Por quê este sprint?**

O ITEC está prestes a encerrar o primeiro semestre da TEO-2025-1.
Sem o sistema de notas, a secretaria vai lançar em planilha e importar manualmente — ou não vai registrar. Isso cria débito operacional que vai crescer por todo o curso.

Declarações de matrícula são pedidas semanalmente por alunos (bancos, igrejas, documentação pessoal). Hoje isso é resolvido com documento Word manual pelo Hélio.

E-mail de boas-vindas é o primeiro toque digital do aluno com a plataforma. Um aluno aprovado que não recebe confirmação automática vai ligar para a Camila — gerando trabalho desnecessário.

Esses três itens têm o maior ROI de tempo economizado por semana para a operação real.

---

### As 3 features desta semana

#### 🥇 #1 — Sistema de Notas (Sprint J)
**Semana 1-2**
Criar tabela `avaliacoes` + `notas_aluno` (migrations 022-023),
`notas.service.ts`, página `LancarNotas.tsx` no painel do professor,
visualização no painel do aluno, consolidado por turma para o admin.
**Impacto:** O ITEC pode aprovar e reprovar — o curso existe academicamente.

#### 🥈 #2 — Declaração de Matrícula PDF
**Semana 2**
Usar `@react-pdf/renderer` (já instalado, padrão do `ContratoForm.tsx`),
botão na `FichaAluno.tsx`, numeração sequencial, template ITEC.
**Impacto:** Camila para de pedir para o Hélio fazer documentos Word.

#### 🥉 #3 — E-mail Automático (Resend ou Supabase Edge Function)
**Semana 3**
Trigger na mudança de status da matrícula → e-mail de boas-vindas.
Template simples, logo ITEC, dados da turma, link de acesso.
**Impacto:** Aluno sabe que está matriculado. Confiança na instituição.

---

### Horizonte de 90 dias (após Sprint J)

| Sprint | Feature Principal | Impacto |
|--------|------------------|---------|
| J | Notas + Declaração + E-mail | Operação acadêmica real |
| K | Vídeos EAD + Upload materiais | Aluno estuda online de verdade |
| L | Certificados + Histórico escolar | Produto final entregue |
| M | Calendário + Perfil ministerial | Diferenciação teológica começa |

---

### Pergunta para o Hélio (antes de implementar)

1. **Modelo de avaliações:** O ITEC usa N1 + N2 com recuperação? Ou tem outro formato (ex: trabalhos + prova)? A fórmula (N1+N2)/2 é a correta?
2. **Quem cadastra devocionais?** É o próprio professor por disciplina, ou o Hélio centraliza?
3. **Assinatura no certificado:** Vai ser assinatura escaneada em PNG, ou quer explorar assinatura digital (ICP-Brasil é complexo e caro)?
4. **Provedor de e-mail:** Já tem Resend, SendGrid ou similar? Ou quer usar as Edge Functions do Supabase?
5. **PIX financeiro:** Tem CNPJ cadastrado para receber PIX via API? Isso define qual gateway usar.
6. **Portal do egresso:** Quando saem os primeiros formandos? Isso define urgência real da feature.

---

*Análise gerada pelo Agente 19 — Analista de Produto/Negócio ITEC*
*Data: 2026-05-28 · ITEC-EAD · Hélio Paiva Jr.*
*Para plano de execução → acionar Agente 20*
