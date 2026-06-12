# Memory — Memória Viva do Projeto
# Kit de Agentes Portátil v2.0

> Esta pasta é a **memória de longo prazo** do projeto. Diferente do
> código (que diz *como* o sistema funciona hoje) e do CLAUDE.md (a *lei*),
> a memory guarda **o que o projeto aprendeu** e **como os agentes
> evoluem**. Ela nasce com lições universais já embutidas e cresce a cada
> sprint.
>
> O **Osábio** (meta-agente) é o guardião desta pasta: ele lê, atualiza e
> consolida estes arquivos ao final de cada sprint.

---

## Arquivos

### 📘 `lessons-learned.md` — Lições que viram regra
Lições destiladas de experiência real, em formato acionável
(ID, contexto, regra, como aplicar). Começa com as lições **universais**
do kit (LICAO-001 a 009) e cresce conforme o projeto ensina.

- **Quando adicionar:** sempre que algo custar caro para descobrir e a
  conclusão valer para o futuro.
- **Regra de ouro:** uma lição que vira regra obrigatória deve refletir
  nas **REG** do `CLAUDE.md`.

### 📕 `known-errors.md` — Erros já cometidos e como evitar
Catálogo de **padrões de erro** (ID, sintoma, causa raiz, prevenção),
agrupados por categoria (ERR-RLS, ERR-INFRA, ERR-LOGIC, …). Serve para
reconhecer o sintoma cedo e aplicar a prevenção conhecida.

- **Quando adicionar:** quando um erro for diagnosticado e a causa raiz
  identificada — registre o padrão para não repetir.
- **Diferença para lessons-learned:** aqui é o *erro* e seu antídoto; lá é
  a *lição* generalizada e a regra resultante. Os dois se referenciam.

### 📗 `agent-maturity-map.md` — Evolução dos agentes
Tabela do nível de maturidade (1–5) de cada agente do projeto. Todo agente
começa em **nível 1** e sobe com evidência de entregas confiáveis.

- **Quando atualizar:** ao final de cada sprint, registrando promoções no
  histórico com a justificativa (sprint + evidência).

---

## Como o Osábio mantém a memory viva

Ao final de **cada sprint**, o Osábio executa este ciclo:

```
1. REVISAR    → Lê o que aconteceu no sprint (commits, specs, bugs, decisões)
2. DESTILAR   → Toda dor nova vira candidata a lição ou padrão de erro
3. REGISTRAR  → Adiciona a lição em lessons-learned.md
                e/ou o padrão em known-errors.md
4. PROMOVER   → Atualiza agent-maturity-map.md com base no desempenho real
                dos agentes no sprint (com evidência)
5. PROPAGAR   → Se uma lição virou regra obrigatória, garante que ela
                aparece nas REG do CLAUDE.md
6. PODAR      → Remove o que ficou obsoleto ou foi superado
```

### Princípios

- **Concisão:** cada lição/erro é curto e acionável. Memory não é diário.
- **Sem duplicação:** antes de adicionar, verifique se já existe; atualize
  o existente em vez de criar duplicata.
- **Anonimato quando reutilizável:** casos concretos podem ser citados de
  forma anônima ("em um projeto real, …") para preservar a generalidade.
- **Evidência para promover:** nível de agente só sobe com um resultado
  concreto que justifique — nunca por impressão.
- **Verdade vem do banco/código:** estado do sistema é afirmado por
  verificação real, nunca por inferência (ver LICAO-005).

---

## Numeração

- **Lições:** `LICAO-NNN` (sequencial, nunca reutilizar número removido)
- **Erros:** `ERR-<CATEGORIA>-NNN` (ex: `ERR-RLS-002`)

Ao remover um item, **não** renumere os demais — a estabilidade dos IDs
permite referenciá-los de qualquer lugar (specs, ADRs, commits).

---

*Memory do Kit de Agentes Portátil v2.0 — a memória que o projeto carrega
de um sprint para o outro.*
