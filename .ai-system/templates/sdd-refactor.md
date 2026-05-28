# TEMPLATE SDD — Refactoring
# Use quando o código precisa ser reorganizado sem mudar comportamento

---

## 🔧 Identificação

```
Título:   [ex: "Extrair lógica de cálculo de BDI para Value Object"]
Data:     [YYYY-MM-DD]
Agente:   [ex: 05-backend-engineer + 01-architect para validar]
Motivação:[ex: Função de 80 linhas no controller que mistura regra de negócio com HTTP]
```

---

## 📍 O Que Está Ruim Hoje

```
Arquivo:  [caminho do arquivo]
Problema: [descrição precisa — ex: "Lógica de cálculo de BDI está no route handler
           de /api/orcamentos. Se mudar a regra de BDI, tenho que mexer no controller."]
Impacto:  [ex: "Impossível testar a lógica de BDI sem subir o servidor HTTP"]
```

---

## 🎯 Como Deve Ficar

```
[Descreva a estrutura alvo — ex:
"A lógica de cálculo de BDI deve ser extraída para um Value Object
em src/domain/orcamento/value-objects/BDI.ts, com testes unitários.
O controller deve apenas chamar o use case, que usa o VO."]
```

---

## 🚫 O Que NÃO Muda

```
[ ] Comportamento externo da API (mesmos endpoints, mesmos resultados)
[ ] Schema do banco de dados
[ ] Contratos com serviços externos
[ ] [outros comportamentos que devem permanecer idênticos]
```

---

## ✅ Critérios de Aceite

```
[ ] Comportamento idêntico antes e depois (testes provam isso)
[ ] Código novo está na camada correta
[ ] Testes unitários cobrem a lógica extraída
[ ] Sem código morto deixado para trás
[ ] Commit com mensagem: refactor(scope): descrição
```

---
*Sistema de Agentes IA para SaaS — Hélio Paiva Jr. — ObraIA 2025*
