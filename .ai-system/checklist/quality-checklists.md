# Checklists de Qualidade
## Kit de Agentes Portátil v2.0
**Mantido por:** agente-Osábio

---

## Checklist 1 — Qualidade do Agente

Use para avaliar se um agente está bem estruturado antes de ativá-lo em produção.

```
IDENTIDADE
□ O agente tem um nome claro?
□ O agente tem uma missão definida em uma frase?
□ O papel do agente é diferente de todos os outros agentes?
□ O agente sabe o que NÃO deve fazer?

FUNÇÃO
□ O agente tem uma lista clara de responsabilidades?
□ O agente tem uma lista clara de limitações?
□ O agente sabe quando acionar outro agente?
□ O agente sabe quando parar e pedir aprovação humana?

SEGURANÇA
□ O agente tem checklist de segurança para o seu domínio?
□ O agente não pode alterar código crítico sem aprovação?
□ O agente verifica permissões antes de executar tarefas sensíveis?
□ O agente menciona explicitamente o que NUNCA deve fazer?

DOCUMENTAÇÃO
□ O agente tem documentação mínima?
□ O agente tem exemplos de entrada e saída?
□ O agente tem formato padronizado de entrega?
□ O agente tem critério de conclusão definido?

INTEGRAÇÃO
□ O agente sabe quem o aciona?
□ O agente sabe a quem encaminhar tarefas fora do seu escopo?
□ O agente não tem conflito de responsabilidade com outro agente?
□ O agente usa a mesma terminologia do projeto?

MATURIDADE
□ O agente tem nível de maturidade avaliado?
□ O agente registra erros quando os comete?
□ O agente aprende com lições registradas?
```

**Score:** ___/24 ítens marcados  
**Nível recomendado com base no score:**
- 0–8: Nível 1 (Básico)
- 9–14: Nível 2 (Organizado)
- 15–18: Nível 3 (Confiável)
- 19–22: Nível 4 (Sênior)
- 23–24: Nível 5 (Especialista Maduro)

---

## Checklist 2 — Qualidade do Prompt / SKILL.md

Use para avaliar se o prompt de um agente está bem escrito.

```
ESTRUTURA
□ O prompt tem seção clara de identidade (quem sou, o que faço)?
□ O prompt tem seção de responsabilidades (o que faço)?
□ O prompt tem seção de limitações (o que NÃO faço)?
□ O prompt tem seção de regras absolutas?
□ O prompt tem formato de entrega definido?

CLAREZA
□ O prompt usa linguagem direta, sem ambiguidade?
□ O prompt evita termos vagos como "quando necessário" sem critério?
□ O prompt especifica quando acionar outro agente?
□ O prompt especifica quando pedir aprovação humana?
□ O prompt tem exemplos concretos de uso?

SEGURANÇA
□ O prompt lista explicitamente o que nunca deve ser feito?
□ O prompt tem proteção contra atuação fora do escopo?
□ O prompt impede decisão de regra de negócio pelo agente técnico?
□ O prompt impede alteração de código crítico sem aprovação?

QUALIDADE
□ O prompt não é genérico demais (poderia ser de qualquer agente)?
□ O prompt tem contexto específico do projeto (não genérico demais)?
□ O prompt tem terminologia consistente com o projeto?
□ O prompt é reversível (posso melhorar incrementalmente)?
```

**Score:** ___/18 ítens marcados  
**Avaliação:**
- 0–6: Prompt fraco — reescrita necessária
- 7–12: Prompt médio — melhorias pontuais recomendadas
- 13–16: Prompt bom — pequenos ajustes
- 17–18: Prompt excelente — apenas monitorar

---

## Checklist 3 — Qualidade da Skill

Use para avaliar se uma skill está completa e segura.

```
ESTRUTURA
□ A skill tem nome descritivo?
□ A skill tem descrição clara de quando usar (frontmatter)?
□ A skill tem seção de regras absolutas?
□ A skill tem formato de saída padronizado?

ESCOPO
□ A skill cobre apenas uma área de responsabilidade?
□ A skill não duplica outra skill existente?
□ A skill tem critério claro de quando termina?
□ A skill especifica o que está fora do seu escopo?

SEGURANÇA
□ A skill tem checklist de validação antes de entregar?
□ A skill não permite alteração de código crítico?
□ A skill menciona quando parar e consultar outro agente?

DOCUMENTAÇÃO
□ A skill tem pelo menos um exemplo de entrada?
□ A skill tem pelo menos um exemplo de saída esperada?
□ A skill tem referência a documentos de contexto necessários?
```

**Score:** ___/14 ítens marcados  
**Avaliação:**
- 0–5: Skill incompleta — criar do zero com estrutura adequada
- 6–10: Skill básica — melhorias necessárias
- 11–13: Skill boa — pequenos ajustes
- 14: Skill completa — apenas monitorar uso

---

## Checklist 4 — Segurança na Evolução dos Agentes

Use o agente-Osabio para verificar ANTES de aplicar qualquer melhoria.

```
ANTES DE ALTERAR QUALQUER ARQUIVO DE AGENTE
□ A alteração é pequena e incremental (não reescrita total)?
□ O motivo da alteração está documentado?
□ O risco foi avaliado (baixo / médio / alto / crítico)?
□ A alteração é reversível?
□ Nenhum agente em produção depende exclusivamente desse arquivo agora?

SE A MELHORIA ENVOLVE REGRA DE NEGÓCIO
□ O Agente 19 (Analista de Produto) foi consultado?
□ A regra de negócio faz sentido para o domínio do projeto?
□ A equipe operacional consegue operar com essa mudança?

SE A MELHORIA ENVOLVE SEGURANÇA OU CÓDIGO CRÍTICO
□ O responsável aprovou explicitamente?
□ Existe proposta documentada com diff antes/depois?
□ Existe plano de rollback?

APÓS APLICAR A MELHORIA
□ A melhoria foi registrada no agent-maturity-map.md (Histórico de promoções)?
□ O agent-maturity-map.md foi atualizado?
□ Existe critério de validação para confirmar que funcionou?
□ A lição foi registrada em lessons-learned.md?
```

---

## Checklist 5 — Validação de Produto (uso pelo Agente 19)

Use para verificar se uma nova funcionalidade faz sentido para o domínio do projeto antes de implementar.

```
COERÊNCIA INSTITUCIONAL
□ A funcionalidade faz sentido para o domínio do projeto?
□ A linguagem da funcionalidade é adequada ao contexto do domínio?
□ A funcionalidade serve alguma das jornadas de persona definidas no PRD?
□ Existe alguma necessidade real documentada para isso?

NECESSIDADE REAL
□ Alguém pediu isso ou é apenas uma suposição?
□ Sem essa funcionalidade, algo importante falha?
□ Existe um workaround que já funciona?
□ Isso é essencial agora ou pode esperar?

IMPACTO
□ Quantos usuários serão beneficiados?
□ A equipe operacional consegue usar sem treinamento?
□ O usuário final entende sem explicação?
□ Isso reduz trabalho manual ou apenas adiciona complexidade?

RISCOS
□ Isso pode confundir usuários com o que já existe?
□ Isso duplica alguma funcionalidade existente?
□ Isso pode gerar dados inconsistentes?
□ Isso tem impacto em LGPD (dados pessoais)?
```

---

*Kit de Agentes Portátil v2.0 — mantido pelo agente-Osábio*
