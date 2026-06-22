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

---

## COMO USAR ESTE BACKLOG

1. **Novas ideias**: Adicionar no final da categoria correspondente
2. **Aprovação**: Mover de "Em Discussão" → "Aprovado" após decisão do Hélio
3. **Implementação**: Quando implementada, mover para `CHANGELOG.md` e remover daqui
4. **Arquivamento**: Ideias rejeitadas → mover para seção "IDEIAS ARQUIVADAS" no final

---

## IDEIAS ARQUIVADAS

(Nenhuma ideia arquivada ainda)
