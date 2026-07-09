# IDEAS-BACKLOG.md — ITEC-EAD
# Ideias e Melhorias Futuras
# Última atualização: 2026-06-10

Este documento registra todas as ideias, melhorias e funcionalidades discutidas durante as sessões de desenvolvimento que ainda não foram implementadas ou aprovadas para implementação imediata.

---

## 1. CALENDÁRIO ACADÊMICO

### 1.1 Eventos Recorrentes
**Descrição**: Permitir criação de eventos com repetição (diário, semanal, mensal, anual).  
**Exemplo**: Culto semanal toda quarta às 19h, reunião mensal de professores.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 1.2 Eventos com Intervalo de Datas
**Descrição**: Evento com data_inicio + data_fim (atualmente só permite data única).  
**Exemplo**: Semana de provas (03/09 a 07/09), Retiro espiritual (15/11 a 17/11).  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 1.3 Duplicar Evento Existente
**Descrição**: Botão "Duplicar" para copiar evento existente e editar rapidamente.  
**Benefício**: Agiliza criação de eventos similares (ex: provas de módulos diferentes).  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Planejado  

### 1.4 Seleção Múltipla de Datas
**Descrição**: Permitir selecionar múltiplas datas não consecutivas no calendário.  
**Exemplo**: Feriados municipais esparsos, datas de reposição de aula.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

---

## 2. PAINEL DE CONTROLE DE ACESSO

### 2.0 [SPRINT] Material do professor — tela + escrita restrita à cadeira do contrato
**Descrição**: Fecha a **outra metade do SEC-04** (report-B). Hoje professor só LÊ material (migração 055); a escrita é de admin/superadmin/administracao. Falta o professor **subir material e o manual da SUA cadeira**.
**Solução técnica**: (a) tela no painel do professor para gerir materiais das disciplinas dele; (b) policy de Storage de WRITE (`materiais-disciplina`) restrita à cadeira do **contrato ativo** — cruzar `contratos_professor`/`CONTRATO_ATIVO` (decisão C) com o `disciplinaId` do path (`foldername[1]`), via função SECURITY DEFINER análoga à `aluno_ve_disciplina`.
**Dependências**: contratos de professor cadastrados (ERR-DATA-F2) — mesma trava da migração 037 §2.
**Prioridade**: Média (não bloqueia agosto — admin/secretaria já sobem material)
**Versão alvo**: pós-agosto (sprint próprio, com UI)
**Status**: ✅ CONCLUÍDO (2026-07-08, migração 056 + PR `feat/material-professor`) — tela "Meus Materiais" + `professor_leciona_disciplina` + bucket `contratos-professor`. SEC-04 fechado por completo.
**Origem**: report-B SEC-04; migração 055 fez a parte de `administracao`.

### 2.05 [SPRINT — ALICERCE] Roster do professor: `get_alunos_operacional(disciplina_id)`
**Descrição**: **Não existe** nenhuma função que liste os alunos **matriculados** de uma disciplina com o nome. Cadeia necessária: `matriculas_disciplina` (não tem `aluno_id`) → `matriculas` (`aluno_id`) → `profiles` (nome). Hoje as telas de **Frequência** (`LancarFrequencia`) e **Notas** (`LancarNotas`/`VerTurma`) montam a lista de alunos a partir de **registros de frequência/nota já existentes** — então **turma nova abre VAZIA** (problema do ovo-e-galinha: precisa de registro para ver aluno, precisa ver aluno para criar registro).
**Solução técnica**: função `get_alunos_operacional(disciplina_id)` — SECURITY DEFINER, gateada por `professor_leciona_disciplina` (já existe, 056), retornando SÓ campos operacionais (`id, full_name, email, avatar_url`) dos alunos matriculados. Telas de Frequência/Notas/VerTurma passam a semear o roster por ela (LICAO-026: query separada + merge).
**Por que é o alicerce**: destrava **três** frentes de uma vez — (1) **Meus Alunos** do professor (roster real); (2) **Frequência/Notas usáveis** com dados reais (fim do "abre vazia"); (3) **LGPD-01 fase 1** (professor obtém nomes SEM acesso à PII de `profiles`, permitindo depois remover `professor` de `profiles_select_staff` na fase 2).
**Dependências**: migração (função). Dado: só mostra conteúdo após `matriculas_disciplina` populada (F1 — lançamento retroativo) e contratos de professor (F2).
**Prioridade**: ALTA — pré-requisito das ondas operacionais do professor + remediação LGPD-01.
**Versão alvo**: próxima onda do professor (antes de "Meus Alunos" e do endurecimento LGPD).
**Status**: Registrado — recomendação nº 1 do diagnóstico "Telas operacionais do professor" (2026-07-08).
**Origem**: diagnósticos LGPD-01 + Telas operacionais do professor.

### 2.06 [TELA] Meus Alunos do professor — construir do ZERO
**Descrição**: A tela **`MeusAlunos.tsx` NÃO existe** (em `src/pages/dashboard/` só há `Alunos.tsx`, que é a tela ADMIN de alunos, e `FichaAluno.tsx`). A rota `professor/alunos` é `ComingSoonPage`. Precisa ser **construída do zero** — não é reroteamento.
**Solução técnica**: tela que lista os alunos das disciplinas do professor via `get_alunos_operacional` (item 2.05) — com estado-vazio amigável quando não há matrícula na turma. Ponto de entrada: menu lateral (`Dashboard.tsx`) + card do `ProfessorHome`.
**Dependências**: **item 2.05** (`get_alunos_operacional`) é pré-requisito — sem ele, só daria para linkar ao `VerTurma` (que herda o mesmo gap de roster).
**Prioridade**: Média (depende do alicerce 2.05).
**Versão alvo**: onda do professor, após 2.05.
**Status**: Registrado — a "Onda 1 (reroteamento)" foi cancelada em 2026-07-08 porque a premissa ("tela já existe") era falsa; correto é construir com o roster.
**Origem**: diagnóstico Telas operacionais do professor (2026-07-08).

**Nota (menu Frequência):** o item de menu `professor/frequencia` (sem `:disciplinaId`) segue `ComingSoonPage` de propósito — o acesso real a `LancarFrequencia` já funciona pelo **card** do `ProfessorHome` (`professor/frequencia/:disciplinaId`). Uma tela-picker do menu só vale a pena junto do roster (2.05), senão abriria vazia. Decisão do Hélio (2026-07-08): deixar o menu como está por ora.

### 2.1 Gestão Dinâmica de Permissões
**Descrição**: Tela administrativa para superadmin gerenciar quais roles acessam quais módulos/rotas.  
**Solução técnica**: Criar tabela `permissoes_modulos` no banco + interface de configuração.  
**Benefício**: Eliminar hardcoded `allowedRoles` dos componentes `RoleGuard`.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  
**Dependências**: Requer ADR sobre estratégia de permissões granulares.  

---

## 3. FLUXO DE ALUNOS

### 3.1 Convite via Magic Link
**Descrição**: Enviar email de convite para alunos com magic link do Supabase (sem senha inicial).  
**Fluxo**: Admin adiciona email → Supabase envia convite → Aluno clica link → completa perfil.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 5 (Sprint RLS)  
**Dependências**: Resend configurado (Sprint K), Edge Function criar-aluno (Sprint L).  

### 3.2 Tela "Complete seu Perfil"
**Descrição**: Após primeiro login via magic link, aluno preenche dados pessoais obrigatórios.  
**Campos**: Nome completo, CPF, telefone, endereço, foto.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 5 (Sprint RLS)  

### 3.3 Importação de Histórico via Excel
**Descrição**: Ferramenta para importar histórico acadêmico de ~30 alunos que já cursaram módulos anteriores.  
**Formato**: Excel com colunas: nome, CPF, turma, disciplinas cursadas, notas, status.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 6 (após Sprint Financeiro)  
**Dependências**: Alunos já devem estar cadastrados no sistema.  

### 3.4 Coleta de Emails dos Alunos
**Descrição**: Hélio deve coletar emails válidos dos ~50 alunos atuais antes do lançamento.  
**Ação**: Contato via WhatsApp, formulário Google Forms, ou secretaria.  
**Prioridade**: CRÍTICA  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Pendente Hélio  
**Prazo**: Até 30/07/2026  

---

## 4. MONITORAMENTO

### 4.1 Sentry para Captura de Erros
**Descrição**: Integrar Sentry.io para monitorar erros em produção em tempo real.  
**Benefício**: Detectar bugs antes dos usuários reportarem, melhorar estabilidade.  
**Prioridade**: Alta  
**Versão alvo**: V1 (antes do lançamento agosto 2026)  
**Status**: Aprovado — Semana 6 (antes de convidar alunos piloto)  
**Custo**: $0/mês (plano gratuito até 5k eventos/mês)  

---

## 5. PLATAFORMA DE VÍDEO + COMUNIDADE (2027)

### 5.1 Aulas em Vídeo Dentro da Plataforma
**Descrição**: Migração de YouTube não listado para Cloudflare Stream ou Mux.  
**Recursos**: Upload direto, player customizado, rastreamento de progresso.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Planejado  
**Referência**: ADR-004 (estratégia de vídeos EAD)  

### 5.2 Comunidade por Turma
**Descrição**: Espaço de discussão estilo Discord/Notion para cada turma.  
**Recursos**: Comentários por aula, fórum de dúvidas, discussões assíncronas.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 5.3 Comentários e Discussões por Aula
**Descrição**: Alunos podem comentar em cada aula/vídeo, professores respondem.  
**Benefício**: Engajamento, suporte assíncrono, FAQ orgânico.  
**Prioridade**: Média  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 5.4 Fórum Lateral + Conteúdo Central
**Descrição**: Layout estilo Notion — conteúdo da aula no centro, discussões/comentários na lateral.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

---

## 6. AUTOMAÇÃO E IA (Final 2026)

### 6.1 Automação de Processos
**Descrição**: Automatizar tarefas repetitivas.  
**Exemplos**:
- Geração automática de mensalidades no dia 1 de cada mês
- Envio automático de email de boas-vindas ao novo aluno
- Notificação de cobrança 5 dias antes do vencimento
- Alerta automático para secretaria quando aluno fica inadimplente

**Prioridade**: Média  
**Versão alvo**: V2/V3 (Setembro 2026 - 2027)  
**Status**: Em Discussão  

### 6.2 IA no Sistema
**Descrição**: Integração de inteligência artificial para suporte e insights.  
**Exemplos**:
- Sugestões automáticas de pré-requisitos cumpridos
- Alertas preditivos de risco de reprovação por falta/nota
- Chatbot de suporte para dúvidas comuns
- Análise de sentimento em feedbacks de alunos

**Prioridade**: Baixa  
**Versão alvo**: V3+ (2027/2028)  
**Status**: Em Discussão  

### 6.3 Integração APIs Externas
**Descrição**: Conectar plataforma com serviços externos.  
**Exemplos**:
- API CEP para preenchimento automático de endereço
- API CPF para validação
- API WhatsApp Business para notificações
- API Zoom para agendamento de aulas ao vivo

**Prioridade**: Média  
**Versão alvo**: V2/V3 (2026/2027)  
**Status**: Em Discussão  

---

## 7. EXPANSÃO ACADÊMICA

### 7.1 Pós-Graduação em Teologia
**Descrição**: Novo curso de especialização para graduados.  
**Carga horária**: 360h-420h  
**Prioridade**: Média  
**Versão alvo**: 2026 (após lançamento V1)  
**Status**: Em Discussão  
**Observação**: Requer estrutura acadêmica completa antes.  

### 7.2 MBA em Gestão de Ministérios
**Descrição**: Curso de gestão focado em líderes de igrejas e ministérios.  
**Público-alvo**: Pastores, líderes, gestores de ministérios.  
**Prioridade**: Baixa  
**Versão alvo**: 2027  
**Status**: Em Discussão  

### 7.3 MBA em IA & Tecnologia
**Descrição**: Parceria com ObraIA para MBA em Inteligência Artificial aplicada.  
**Público-alvo**: Profissionais de TI, gestores de tecnologia.  
**Prioridade**: Baixa  
**Versão alvo**: 2028  
**Status**: Ideia Preliminar  
**Observação**: Requer validação de mercado e parceria formal.  

---

## 8. FINANCEIRO

### 8.0 [SEGURANÇA] Bucket `comprovantes-pagamento` — quebrado + risco de PII
**Descrição**: `Financeiro.tsx` faz `supabase.storage.from('comprovantes-pagamento').upload(...)` direto na page (viola services-only), mas o bucket **não existe em nenhuma migração** (sem policies versionadas). A feature provavelmente está quebrada; se o bucket existir criado à mão como **público**, comprovantes de pagamento (PII financeira do aluno) ficam acessíveis sem login.
**Agravantes**: usa `getPublicUrl` (não signed URL) e path **previsível** `comprovantes/{aluno_id}_{mes_referencia}_{nome}` (sem UUID, expõe `aluno_id`).
**O que fazer**: na revisão do módulo financeiro — criar bucket **PRIVADO** + policies (aluno vê o próprio; staff/financeiro tudo) + path com UUID (não expor `aluno_id`) + download por signed URL + mover o upload para um service. Confirmar antes se o bucket existe/é público (query B do diagnóstico de Storage).
**Origem**: achado correlato do report-B (diagnóstico Storage, 2026-07-06) — fora do escopo da migração 055.
**Prioridade**: ALTA (verificar já; correção junto da revisão financeira)
**Versão alvo**: V1 (antes de agosto) — pelo menos a verificação
**Status**: Registrado — pendente revisão do módulo financeiro

### 8.1 Gateway de Pagamento PIX/Boleto
**Descrição**: Integração com Asaas para pagamento online de mensalidades.  
**Recursos**: PIX, boleto, cartão de crédito.  
**Prioridade**: ALTA  
**Versão alvo**: V1 (Agosto 2026)  
**Status**: Aprovado — Sprint O (Financeiro) — Semanas 5-6  
**Dependências**: Conta Asaas criada e validada com Hugo.  

### 8.2 Emissão de Nota Fiscal
**Descrição**: Geração automática de nota fiscal após pagamento confirmado.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Pendente decisão do Hélio  
**Observação**: Verificar obrigatoriedade legal para instituição de ensino.  

### 8.3 Relatório Financeiro Completo
**Descrição**: Dashboard com KPIs financeiros (receita, inadimplência, projeções).  
**Métricas**: Receita mensal, taxa de inadimplência, previsão de recebimentos.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Planejado  

### 8.4 Sistema de Cobrança por Quantidade de Disciplinas
**Descrição**: Implementar tabela oficial de cobrança progressiva baseada na quantidade de disciplinas cursadas (não por disciplina individual).  
**Recursos**:
- Tabela Padrão (matrícula + mensalidade com acréscimo pós-vencimento)
- Tabela Família (desconto automático)
- Vencimento dia 10 (acréscimo automático após vencimento)
- Aprovação de descontos: financeiro (Breno) + superadmin
- Integração com Asaas para emissão automática de boleto/PIX

**Prioridade**: ALTA  
**Versão alvo**: V1 (Agosto 2026)  
**Status**: Aprovado — Sprint Financeiro (Semanas 5-6)  
**Dependências**: Conta Asaas configurada, tabelas de preços no banco.  
**Referência**: `.ai-system/memory/REGRAS-FINANCEIRO.md`  

---

## 9. OUTRAS IDEIAS

### 9.1 App Mobile Nativo
**Descrição**: Aplicativo iOS e Android nativo para alunos.  
**Recursos**: Acesso offline a materiais, notificações push, câmera para upload de docs.  
**Prioridade**: Média  
**Versão alvo**: V2 (Setembro/Outubro 2026)  
**Status**: Aprovado  
**Referência**: Roadmap em `.ai-system/ROADMAP-FUTURO.md`  

### 9.2 Sistema de Certificados Digitais
**Descrição**: Geração automática de certificados por módulo e final.  
**Recursos**: QR Code de verificação, assinatura digital, download PDF.  
**Prioridade**: Alta  
**Versão alvo**: V1/V2 (Agosto-Setembro 2026)  
**Status**: Planejado — Sprint O (Certificados)  
**Referência**: ADR-005  

### 9.3 Portal do Egresso
**Descrição**: Área exclusiva para alunos formados acompanharem carreira ministerial.  
**Recursos**: Oportunidades de ministério, networking, eventos exclusivos.  
**Prioridade**: Baixa  
**Versão alvo**: V3 (2027)  
**Status**: Em Discussão  

### 9.4 Sistema de Bolsas Automático
**Descrição**: Fluxo de solicitação de bolsa pelo aluno + aprovação por comissão.  
**Recursos**: Formulário socioeconômico, análise automática de elegibilidade, aprovação multi-nível.  
**Prioridade**: Média  
**Versão alvo**: V2 (2026)  
**Status**: Em Discussão  

---

## 10. CAMADA ANALÍTICA DE DADOS

### 10.1 Dashboard Analítico Interno com Python + Streamlit
**Descrição**: Ferramenta de análise de dados interna para coordenação acadêmica, separada da plataforma principal.  
**Tecnologias**: Python, Streamlit, pandas, plotly, scikit-learn.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Recursos planejados**:
- Dashboard interativo com métricas avançadas
- Gráficos e visualizações para tomada de decisão
- Análise de tendências históricas
- Exportação de relatórios customizados

**Observações importantes**:
- **NÃO substitui** o sistema React + Supabase (plataforma do aluno/secretaria)
- Streamlit serve apenas para **dashboards internos analíticos**
- Acesso restrito: coordenação acadêmica e direção
- Alinhado com transição de carreira do Hélio para área de dados
- **Valor triplo**: melhoria do projeto + aprendizado prático + portfólio

**Dependências**:
- Lançamento V1 concluído (agosto 2026)
- Dados históricos consolidados no Supabase
- Python 3.11+ instalado no ambiente de produção

### 10.2 ETL de Dados Históricos com pandas
**Descrição**: Pipeline de importação automática de dados históricos dos ~30 alunos que já cursaram módulos anteriores.  
**Formato de entrada**: Planilha Excel (.xlsx) com colunas padronizadas.  
**Processamento**: Validação, limpeza, transformação e carga no Supabase.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Fluxo do ETL**:
1. **Extract**: Leitura de Excel com pandas
2. **Transform**: 
   - Validação de CPF, email, datas
   - Padronização de nomes e códigos
   - Cálculo de médias e status
   - Detecção de inconsistências
3. **Load**: Inserção via `supabase-py` ou SQL direto

**Benefícios**:
- Automação da importação (evita erros manuais)
- Validação de dados antes da inserção
- Log de erros e inconsistências
- Reutilizável para futuras migrações

### 10.3 Análise de Evasão, Retenção e Desempenho
**Descrição**: Relatórios analíticos avançados para identificar padrões e tendências.  
**Métricas**:
- Taxa de evasão por módulo/semestre
- Taxa de retenção (alunos que continuam até o final)
- Desempenho médio por turma/disciplina
- Comparativo entre turmas
- Identificação de disciplinas mais difíceis

**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Visualizações**:
- Gráficos de linha: evolução temporal de métricas
- Heatmaps: desempenho por disciplina × turma
- Funil de conversão: matrícula → conclusão
- Tabelas pivot interativas

### 10.4 IA Preditiva — Alerta de Risco de Reprovação
**Descrição**: Modelo de machine learning para prever risco de reprovação antes da avaliação final.  
**Tecnologias**: scikit-learn, XGBoost, ou modelos simples (Regressão Logística).  
**Prioridade**: Baixa  
**Versão alvo**: V3+ (2027)  
**Status**: Ideia Preliminar  

**Features do modelo**:
- Frequência acumulada até o momento
- Nota N1 (primeira avaliação)
- Histórico de notas em disciplinas anteriores
- Tempo médio de entrega de atividades EAD
- Engajamento na plataforma (acessos, materiais baixados)

**Output**:
- Score de risco: 0-100%
- Classificação: Baixo | Médio | Alto risco
- Ação recomendada: monitoria, reforço, conversa com coordenação

**Benefícios**:
- Intervenção precoce para evitar reprovações
- Melhoria da taxa de aprovação
- Suporte personalizado ao aluno

**Observação**: Requer volume mínimo de dados históricos (~100 alunos) para treinar o modelo com precisão aceitável.

### 10.5 Gráficos Avançados para Coordenação Acadêmica
**Descrição**: Visualizações interativas com Plotly/Streamlit para análise exploratória.  
**Prioridade**: Média  
**Versão alvo**: V3 (Pós-agosto 2026)  
**Status**: Em Discussão  

**Tipos de gráficos**:
- **Distribuição de notas**: histograma + boxplot
- **Frequência × Nota**: scatter plot com linha de tendência
- **Taxa de aprovação por professor**: comparativo
- **Evolução temporal**: linha do tempo de métricas-chave
- **Correlação entre variáveis**: matriz de correlação + heatmap

**Interatividade**:
- Filtros: turma, módulo, disciplina, período
- Drill-down: clicar em barra → ver detalhes
- Exportação: PNG, PDF, CSV

---

## 11. CENTRAL DE AJUDA & SUPORTE

### 11.1 [MÓDULO] Central de Ajuda & Suporte ITEC (todas as personas)
**Descrição**: Uma área acessível no dashboard de **cada persona** (aluno, professor, secretaria, coordenação) reunindo ajuda, documentação e canais de contato do ITEC.
**Recursos previstos**:
- **Manual**: ler online + baixar (aluno baixa o manual do aluno; professor o manual da cadeira/institucional). Reusa os buckets `manuais-aluno` / `materiais-disciplina` já existentes.
- **FAQ / Dúvidas frequentes**: perguntas e respostas já prontas, organizadas por tema.
- **"Pergunte ao ITEC"**: canal para novas dúvidas, com direcionamento (secretaria, coordenador ou reitor conforme o assunto).
- **Agendar atendimento**: marcar horário com coordenador (Prof. Andrea) ou reitor (Pr. Eliel).
- **Contato direto**: link de WhatsApp institucional.
- Conteúdo organizado/curado pelo ITEC (texto institucional a definir).
**Escopo a dimensionar em diagnóstico próprio quando chegar a vez** — envolve: modelo de dados de FAQ, roteamento de dúvidas, possível integração de agenda e link WhatsApp.
**Prioridade**: Média — **DEPOIS do Financeiro** (não é para agora; registro para não perder).
**Versão alvo**: pós-Financeiro (a definir).
**Status**: Registrado — aguarda diagnóstico próprio.
**Origem**: pedido do Hélio (2026-07-09).

---

## REGRA CRÍTICA — Camada Analítica

**APENAS avaliar após lançamento de agosto 2026.**

Razões:
1. **Foco**: Prioridade total no lançamento V1 (agosto)
2. **Dados**: Precisa de volume mínimo para análises significativas
3. **Stack**: Adicionar Python/Streamlit agora aumenta complexidade desnecessariamente
4. **Risco**: Desvio de foco em fase crítica do projeto

**Aprovação condicional**:
- ✅ Hélio pode estudar Python/pandas/Streamlit paralelamente (aprendizado pessoal)
- ✅ Pode criar protótipos locais com dados fictícios
- ❌ NÃO adicionar ao projeto oficial antes de agosto
- ❌ NÃO integrar com ambiente de produção antes de agosto

---

## LEGENDA DE PRIORIDADE

- **CRÍTICA**: Bloqueia lançamento agosto 2026
- **ALTA**: Necessária antes de escala (100+ alunos)
- **MÉDIA**: Melhoria significativa, não urgente
- **BAIXA**: Nice-to-have, pode aguardar V3+

## LEGENDA DE STATUS

- **Aprovado**: Hélio aprovou implementação
- **Planejado**: Incluído em roadmap oficial
- **Em Discussão**: Aguardando decisão do Hélio
- **Ideia Preliminar**: Necessita validação técnica/negócio
- **Pendente Hélio**: Aguardando ação/resposta do Hélio

---

## MATERIAIS DA DISCIPLINA

### Materiais — upgrade Opção B: signed URL via Edge Function (bucket 100% fechado)
**Descrição**: Hoje (R0.5.4, migração 049) o bucket `materiais-disciplina` é privado e o SELECT em `storage.objects` é liberado a qualquer `authenticated` (a granularidade de acesso por matrícula/disciplina fica na tabela `materiais_disciplina` via `aluno_ve_disciplina()`, não no objeto). A **Opção B** fecha o bucket por completo: o download passa por uma **Edge Function** que valida o acesso do usuário (aluno matriculado no curso da disciplina / staff / professor da cadeira) e devolve uma **signed URL** temporária. Assim nenhum `authenticated` lê o objeto direto.
**Benefício**: acesso ao arquivo físico fica alinhado 1:1 com a regra de negócio (não só ao registro), eliminando o vetor de "authenticated lê qualquer objeto do bucket".
**Dependências**: Edge Function (Supabase) + `createSignedUrl`; reusar a cadeia `matriculas.turma_id → turmas.curso_id → modulos.curso_id → disciplinas_v2` (ver `aluno_ve_disciplina`) e `contratos_professor` para professor da cadeira.
**Prioridade**: Média
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

### Consolidar barra de progresso do aluno com `materiais_disciplina`
**Descrição**: Hoje coexistem dois conceitos de "materiais": o **novo** `materiais_disciplina` (R0.5.4/PR #16 — aprovação, bucket privado, signed URL) e o **antigo** `materiais` + `progresso_aluno` (`material.service.ts`), que ainda alimenta a barra "Materiais XX% · N arquivos" no card do aluno (`useMeusCursos`). Unificar: migrar o rastreamento de progresso para `materiais_disciplina` (visualização/download) e aposentar a tabela `materiais` legada.
**Benefício**: fonte única de materiais; elimina duplicidade de modelo.
**Prioridade**: Média
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

### Script: migrar `disciplinas_v2.manual_url` legados → `materiais_disciplina`
**Descrição**: A coluna `disciplinas_v2.manual_url` (preenchida pelo fluxo antigo `uploadManualDisciplina`, já removido) não é mais exibida. Script opcional para varrer cadeiras com `manual_url` não-nulo e criar um registro em `materiais_disciplina` (origem `link` ou re-upload), depois limpar a coluna. Provável impacto nulo (a função antiga não tinha UI), mas garante que nada fique órfão.
**Prioridade**: Baixa
**Versão alvo**: V2 (pós-agosto 2026)
**Status**: Planejado

---

## LANÇAMENTO RETROATIVO (R2)

### 🔴 BLOQUEADOR — migração 053: `recuperacao` no CHECK de `matriculas_disciplina.status`
**Descrição**: O R2.2 passou a gravar `status='recuperacao'` (nota 5–6.9 e freq≥75) no lançamento retroativo, mas o **CHECK do banco** (migração 010) **não inclui `recuperacao`** (`cursando·aprovado·reprovado·reprovado_falta·convalidado·trancado`). Enquanto a migração 053 (`ALTER … ADD` ao CHECK) não rodar, lançar uma cadeira em recuperação **falha em runtime (23514)**. O código TS já está pronto.
**Ação**: criar migração 053 adicionando `recuperacao` ao CHECK (e avaliar incluir nos demais lugares que exibem status).
**Prioridade**: Alta (bloqueia o caminho de recuperação do R2.2)
**Versão alvo**: V1 — antes de usar lançamento em produção
**Status**: Pendente (migração a criar)

### G4 — Histórico Acadêmico deve preferir a frequência consolidada ✅ FEITO (R2.3, PR #20)
**Descrição**: `getHistoricoAluno` agora PREFERE os valores consolidados de `matriculas_disciplina` (nota/status/frequencia_percentual) quando existem; fallback p/ parciais. Vale para FichaAluno (staff) e a nova tela "Meu Histórico" (aluno).
**Status**: ✅ Concluído.

### MeusCursos (módulo atual) deve preferir matriculas_disciplina consolidado
**Descrição**: A tela `MeusCursos` (módulo corrente do aluno) ainda mostra freq/notas das **parciais** (`getResumoFrequenciaBatch` + `getNotasBatchByAluno`), não do consolidado. **Avaliar se `MeusCursos` deve preferir `matriculas_disciplina` consolidado quando as turmas 2026 começarem a lançar** — para o aluno ver o mesmo dado em "Meus Cursos" e "Meu Histórico". (Hoje só "Meu Histórico" usa o consolidado; G4.)
**Prioridade**: Média
**Versão alvo**: quando turmas 2026 iniciarem lançamentos
**Status**: Planejado

### Múltiplas matrículas por aluno no lançamento
**Descrição**: A tool de Lançamento Retroativo usa hoje a **matrícula ativa** (ou a primeira com turma). Quando houver 2º curso (ex.: Pós-graduação), o aluno terá mais de uma matrícula — revisitar a seleção (dropdown de matrícula) para lançar na correta.
**Prioridade**: Baixa
**Versão alvo**: quando existir 2º curso
**Status**: Planejado

### Refinamento de segurança (11): `notas_aluno` por contrato do professor
**Descrição**: As policies de `notas_aluno` (023/031) hoje permitem que **qualquer professor veja e lance nota de qualquer cadeira** (SELECT libera staff inteiro; INSERT/UPDATE exige só `lancado_por = self`, sem amarrar à disciplina lecionada). Restringir professor às **suas cadeiras** via `contratos_professor` (`status IN ('assinado','impresso')`) quando **F2 (contratos populados)** for resolvido. **Mesmo tema da migração 037 §2 adiada** (restrição professor em frequencia/materiais/matriculas_disciplina/etc.). Diagnosticado no R3.0; RLS de `notas_aluno` em si já está completa e funcionando (ver known-errors F3 ✅).
**Prioridade**: Média (segurança — pós-agosto, depende de contratos)
**Versão alvo**: quando F2 (contratos cadastrados) for resolvido
**Status**: Planejado

### Evoluir `KpiCard` para navegação SPA (`<Link>` em vez de `<a href>`)
**Descrição**: O `KpiCard` (`src/components/dashboard/KpiCard.tsx`) usa `<a href>` quando recebe `href` → **recarrega a página inteira** em vez de navegação React Router. Afeta os KPIs do AdminView e os novos KPIs do AlunoView (R3.1). Trocar por `<Link to>` para navegação SPA sem reload. Identificado no R3.1.
**Prioridade**: Baixa (UX — não bloqueante)
**Versão alvo**: R3.x ou refino de UI
**Status**: Planejado

### Paginar detector F1 do Painel de Pendências (R3.2)
**Descrição**: `getPendenciasSecretaria` monta o set de matrículas com lançamento via fetch global de `matriculas_disciplina` (`limit 2000`). No volume atual (~31 matrículas) é ok; se crescer muito, paginar/otimizar (ex.: agregação por `matricula_id` no banco, ou consultar só as matrículas ativas em questão). Identificado no R3.2 Leva 1.
**Prioridade**: Baixa (só relevante em escala)
**Versão alvo**: quando volume de lançamentos crescer
**Status**: Planejado

### Deep-link com hash para a aba Financeiro da FichaAluno (R3.2)
**Descrição**: Os cards de **Taxas** e **Documentos** do Painel de Pendências linkam para a FichaAluno (`/dashboard/aluno/:id`), mas caem no topo da ficha. Adicionar âncora/hash (ex.: `#financeiro`, `#documentos`) + scroll para a seção correspondente ao abrir. Identificado no R3.2 Leva 1.
**Prioridade**: Baixa (UX — navegação mais direta)
**Versão alvo**: R3.x ou refino de UI
**Status**: Planejado

### Auditoria completa de transições de status de matrícula (R3.2 Leva 2a)
**Descrição**: Hoje a mudança de status de matrícula não deixa trilha (quem/quando/de→para) — só o stamp `validado_por`/`validado_em` na aprovação (1 evento). Para auditoria real, criar **tabela de histórico de transições** (`matricula_status_log`: matricula_id, de, para, por, em, observacao) e gravar em `aprovarMatricula`/`mudarStatusMatricula`. **Exige migração.** Identificado no R3.2 Leva 2a.
**Prioridade**: Média (governança/segurança — pós-agosto)
**Versão alvo**: quando houver janela para migração de auditoria
**Status**: Planejado

### Auditoria de encerramento de contrato de professor (R3.3a)
**Descrição**: `contratos_professor` não tem `encerrado_em`/`encerrado_por` (só `solicitacoes_disciplina` tem). Ao encerrar um vínculo (status `encerrado`), não fica quem/quando. Adicionar colunas `encerrado_em`/`encerrado_por` + gravar em `updateStatusContrato`/handler de encerrar. **Exige migração.** Identificado no R3.3a.
**Prioridade**: Baixa (governança — pós-agosto)
**Versão alvo**: junto da janela de auditoria
**Status**: Planejado

### Reavaliar RLS professor-por-contrato (migração 037 §2) — agora há contratos
**Descrição**: A restrição RLS que limita o professor às **suas** cadeiras (notas_aluno/frequencia/materiais/matriculas_disciplina/etc.) via `contratos_professor` estava adiada por F2 (0 contratos). Com R3.3a destravando a criação de vínculos (`CONTRATO_ATIVO`), reavaliar aplicar a restrição — usando `status <> 'encerrado'` (não só `assinado`/`impresso`, conforme decisão C). **Exige migração** (policies). Pós-agosto, após popular contratos reais. Ver known-errors F3 (✅) e nota da 037 §2.
**Prioridade**: Média (segurança — pós-agosto)
**Versão alvo**: quando contratos reais estiverem cadastrados
**Status**: Planejado

### Avaliações pendentes por avaliação (definição "a") — ProfessorView (R3.3b)
**Descrição**: O KPI "Notas pendentes" do ProfessorView usa a definição **(b)** — alunos sem nota final em `matriculas_disciplina` (`nota IS NULL`/`cursando`). Quando a **criação de avaliações** (`avaliacoes`: N1/N2/rec/trabalho/extra) estiver em uso, avaliar trocar/complementar pela definição **(a)**: por avaliação definida, comparar `notas_aluno` lançadas vs nº de alunos matriculados → "avaliações com notas faltando". Mais preciso, porém multi-query e só útil com avaliações criadas. Identificado no R3.3b.
**Prioridade**: Baixa (só relevante quando avaliações forem usadas)
**Versão alvo**: quando a criação de avaliações estiver em uso
**Status**: Planejado

### Ficha 360 — nome da disciplina ITEC de destino na convalidação (R3.4)
**Descrição**: A seção Convalidações da FichaAluno exibe `disciplina_origem` (origem), pois `getConvalidacoesByAluno` faz `select('*')` sem join. Para mostrar também a **disciplina ITEC de destino** (`disciplinas_v2` via `convalidacoes.disciplina_id`), fazer merge por query separada (LICAO-026) — em `getConvalidacoesByAluno` ou no loader da ficha. Polish opcional. Identificado no R3.4.
**Prioridade**: Baixa (UX — refino)
**Versão alvo**: refino de ficha
**Status**: Planejado

### BLOCO AUDITORIA + QA — pós-R3.4 (gate: só após R3.4 mergeado)
**Descrição**: Com o Núcleo Acadêmico completo (R0→R4), travar mudanças e auditar antes de novas features. Ordem obrigatória:
1. **MODO AUDITORIA** — Agente 14 (protocolo 9 etapas) + 15-debt + 11-security + 17-lgpd → relatório em `.ai-system/audit/[data]/report.md`. **Não modificar código** até aprovação do Hélio.
2. **QA** — Agente 10-test: cobrir regras de domínio (funil de status/acesso [LICAO-039], nota≥7 E freq≥75%, pré-requisitos, convalidação, lançamento retroativo, vínculo de professor [decisão C]); resolver/documentar as **9 falhas pré-existentes** (8 ProtectedRoute + 1 academico `verificarPrerequisitos`).
3. **Caça a bugs** — varredura por persona (aluno/professor/secretaria/coordenação) nas rotas profundas.
4. **Sprint de AUTH dedicado** — bug ERR-AUTH-002 (falso logout / cold start): aplicar a lição do commit `2d79368` (testar deep routes localmente ANTES de deploy); revisar `archive/v2.0-docs`. Não tocar em auth fora deste sprint.
**Prioridade**: Alta (qualidade pré-lançamento)
**Versão alvo**: imediatamente após R3.4
**Status**: Planejado (gate: R3.4 mergeado) — detalhe também no Tracker §7 do PLANO-MESTRE-v2_1

---

## COMO USAR ESTE BACKLOG

1. **Novas ideias**: Adicionar no final da categoria correspondente
2. **Aprovação**: Mover de "Em Discussão" → "Aprovado" após decisão do Hélio
3. **Implementação**: Quando implementada, mover para `CHANGELOG.md` e remover daqui
4. **Arquivamento**: Ideias rejeitadas → mover para seção "IDEIAS ARQUIVADAS" no final

---

## IDEIAS ARQUIVADAS

(Nenhuma ideia arquivada ainda)
