# PRD - ITEC Educ Dashboard

**Instituição:** ITEC - Instituto Teológico Educação Cristã  
**Curso:** Graduação Livre de Teologia  
**Duração:** 3 anos (6 módulos)  

---

## 1. Visão Geral do Projeto

**Nome:** ITEC Educ Dashboard  
**Tipo:** Sistema de Gestão Acadêmica + Plataforma EAD  
**Stack Frontend:** Vue.js 3 + Vite + Bootstrap 5  
**Stack Backend:** Supabase (Database/Auth/Storage)  
**Hospedagem:** Vercel (Frontend) + Supabase (Database/Auth)  
**Repositório:** GitHub  

---

## 2. Estrutura do Curso

### Módulos do Curso (6 no total)

| Módulo | Ano | Descrição |
|--------|-----|---------|
| **Módulo 1** | 1º Ano | Fundamentos |
| **Módulo 2** | 1º Ano | Introdução |
| **Módulo 3** | 2º Ano | Intermediário |
| **Módulo 4** | 2º Ano | Avançado |
| **Módulo 5** | 3º Ano | Aplicação |
| **Módulo 6** | 3º Ano | Conclusão |

---

## 3. Funcionalidades do Sistema

### 3.1 Módulos Principais (ITEC)

#### Gestão Acadêmica
- [ ] **Dashboard** - Visão geral (matrículas, frequência, notas, aulas EAD)
- [ ] **Alunos** - Cadastro, lista, detalhes, editar
- [ ] **Professores** - Cadastro, lista, detalhes
- [ ] **Módulos** - 6 módulos do curso
- [ ] **Disciplinas** - Disciplinas por módulo (com pré-requisitos)
- [ ] **Frequência** - Registro de presença dos alunos
- [ ] **Notas/Avaliações** - Lançamento de notas e médias
- [ ] **Calendário** - Datas das avaliações
- [ ] **Certificados** - Emissão de certificados

#### Plataforma EAD (Aulas em Vídeo)
- [ ] **Aulas/Vídeos** - Upload e organização de videoaulas
- [ ] **Materiais** - PDFs, apostilas (pré-requisitos)
- [ ] **Comentários** - Alunos comentam nas aulas
- [ ] **Dúvidas** - Sistema de perguntas e respostas
- [ ] **Progresso** - Acompanhamento de visualização

#### Comunicação
- [ ] **Avisos/Comunicados** - Quadro de avisos
- [ ] **Eventos** - Calendário de eventos

#### Administrativo
- [ ] **Secretaria** - Gestão operacional
- [ ] **Configurações** - Geral, ano letivo, sistema

### 3.2 NÃO Incluídos

- Biblioteca (não há acervo)
- Responsáveis (alunos são adultos)
- Folha de pagamento
- Taxas/Mensalidades
- Controle de licenças (RH)
- Contabilidade

### 3.3 Autenticação e Acesso

- [ ] Login (e-mail/senha)
- [ ] Registro de novos usuários
- [ ] Recuperação de senha
- [ ] Roles do Sistema:

| Role | Descrição | Acesso |
|------|----------|--------|
| **Admin** | Dono do sistema | Completo |
| **Secretaria** | Gestão operacional | Cadastros, relatórios |
| **Professor** | Docente | Frequência, notas, upload aulas |
| **Aluno** | Matriculado | Consultar, assistir aulas, comentar |

---

## 4. Certificados

### 4.1 Certificado de Módulo (Parcial)

Emitido ao final de cada módulo.

**Conteúdo do certificado:**
- Nome do aluno
- Módulo concluído (1-6)
- Lista das disciplinas do módulo com notas
- Carga horária total
- Data de conclusão
- Assinatura digital do director

**Modelo:**
```
CERTIFICADO DE CONCLUSÃO DE MÓDULO

Certificamos que [NOME DO ALUNO]
concluiu o MÓDULO [X] do Curso de Graduação Livre em Teologia,
promovido pelo ITEC - Instituto Teológico Educação Cristã.

Disciplinas cursadas neste módulo:
┌────────────────────────────────────────────┐
│ Disciplina          │ Nota Final         │
├────────────────────────────────────────────┤
│ [Disciplina 1]     │ [XX]            │
│ [Disciplina 2]     │ [XX]            │
│ ...               │ ...             │
├────────────────────────────────────────────┤
│ MÉDIA DO MÓDULO  │ [XX]            │
└────────────────────────────────────────────┘

Carga horária: [XX] horas
Data: [DD/MM/AAAA]
```

### 4.2 Certificado Final de Conclusão

Emitido ao final do Módulo 6 (após aprovação em todos os módulos).

**Conteúdo do certificado:**
- Nome do aluno
- Curso completo
- Lista de TODAS as disciplinas dos 6 módulos com notas
- Carga horária total do curso
- Data de conclusão
- Assinatura digital

**Modelo:**
```
CERTIFICADO DE CONCLUSÃO DO CURSO

Certificamos que [NOME DO ALUNO]
concluiu com êxito o Curso de GRADUAÇÃO LIVRE EM TEOLOGIA,
promovido pelo ITEC - Instituto Teológico Educação Cristã,
com carga horária total de [XXX] horas.

Histórico Escolar:
┌──────────────────────────┬────────────┬────────────┐
│ Módulo 1                │ Nota       │ Status    │
├──────────────────────────┼────────────┼────────────┤
│ [Disciplina 1.1]       │ [XX]       │ Aprovado  │
│ [Disciplina 1.2]       │ [XX]       │ Aprovado  │
├──────────────────────────┼────────────┼────────────┤
│ MÉDIA MÓDULO 1         │ [XX]       │ Aprovado  │
├──────────────────────────┼────────────┼────────────┤
│ Módulo 2                │ Nota       │ Status    │
├──────────────────────────┼────────────┼────────────┤
│ ...                     │ ...        │ ...       │
├──────────────────────────┼────────────┼────────────┤
│ MÉDIA GERAL            │ [XX]       │ Aprovado  │
└──────────────────────────┴────────────┴────────────┘

Data: [DD/MM/AAAA]
```

### 4.3 Regras de Certificado

- [ ] Aluno precisa de média ≥ 7.0 em cada disciplina
- [ ] Aluno pode ser aprovado por conselho (média entre 5.0-6.9)
- [ ] Certificado gerado automaticamente após cierre do módulo
- [ ] Certificado digital (PDF) com QR Code para verificação
- [ ] Aluno pode baixar/imprimir certificado

---

## 5. Disciplinas e Pré-requisitos

### 5.1 Sistema de Pré-requisitos

Algumas disciplinas exigem conclusão de outras antes.

**Exemplo de fluxo:**
```
Disciplina A (básica)
    │
    ├──► Disciplina B (pré-req: A)
    │         │
    │         └──► Disciplina C (pré-req: B)
    │
    └──► Disciplina D (sem pré-requisito)
```

### 5.2 Tabela de Disciplinas

Cada disciplina possui:
- Nome
- Módulo (1-6)
- Disciplina pai (pré-requisito) - opcional
- Carga horária
- Professor responsável

**Estrutura no banco:**
```sql
subjects:
  - id
  - name
  - module (1-6)
  - prerequisite_id (fk to subjects) -- nullable
  - workload
  - teacher_id
```

### 5.3 Validação de Matrícula

- [ ] Aluno só pode se matricular em disciplina se pré-requisito foi aprovado
- [ ] Sistema bloqueia matrícula em disciplina pendente
- [ ] Mensagem: "Complete [disciplina pré-requisito] primeiro"

---

## 6. Plano de Execução - Fases

### Fase 1: Preparação do Ambiente
- [ ] 1.1 Limpar projeto (remover scripts de fix)
- [ ] 1.2 Configurar git local
- [ ] 1.3 Criar repo GitHub
- [ ] 1.4 Deploy Vercel (teste)
- [ ] 1.5 Criar projeto Supabase

### Fase 2: Configuração Base
- [ ] 2.1 Configurar Supabase Client
- [ ] 2.2 Criar banco de dados (tabelas)
- [ ] 2.3 Configurar autenticação
- [ ] 2.4 Configurar Storage (vídeos/materials)
- [ ] 2.5 Criar .env

### Fase 3: UI/UX - Customização ITEC
- [ ] 3.1 Traduzir textos para PT-BR
- [ ] 3.2 Substituir logo para ITEC
- [ ] 3.3 Paleta de cores (tema cristão)
- [ ] 3.4 Ajustar menus

### Fase 4: Gestão Acadêmica
- [ ] 4.1 CRUD Alunos
- [ ] 4.2 CRUD Professores
- [ ] 4.3 CRUD Módulos/Disciplinas
- [ ] 4.4 Sistema de Pré-requisitos
- [ ] 4.5 Sistema de Frequência
- [ ] 4.6 Sistema de Notas
- [ ] 4.7 Sistema de Certificados (módulo + final)
- [ ] 4.8 Configurações

### Fase 5: Plataforma EAD
- [ ] 5.1 Upload de vídeos
- [ ] 5.2 Player de vídeo
- [ ] 5.3 Upload de materiais (PDFs)
- [ ] 5.4 Sistema de comentários
- [ ] 5.5 Sistema de dúvidas
- [ ] 5.6 Acompanhamento de progresso

### Fase 6: Polish e Deploy
- [ ] 6.1 Testes gerais
- [ ] 6.2 Correção de bugs
- [ ] 6.3 Deploy produção

### Fase 7: CI/CD
- [ ] 7.1 GitHub Actions
- [ ] 7.2 Deploy automático

---

## 7. Estrutura de Diretórios

```
EDUC/
├── code/
│   ├── src/
│   │   ├── assets/         # Logos ITEC
│   │   ├── components/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── attendance/
│   │   │   ├── marks/
│   │   │   ├── videos/
│   │   │   ├── materials/
│   │   │   ├── doubts/
│   │   │   └── certificates/
│   │   ├── pages/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── attendance/
│   │   │   ├── marks/
│   │   │   ├── videos/
│   │   │   ├── materials/
│   │   │   ├── doubts/
│   │   │   ├── certificates/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── stores/
│   │   ├── router.js
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── documentation/
├── Logo/
└── PRD.md
```

---

## 8. Tecnologias

### Frontend
- Vue.js 3 (Composition API)
- Vite
- Bootstrap 5
- ApexCharts
- Vue Router

### Backend (BaaS)
- Supabase
- PostgreSQL
- Authentication
- Row Level Security (RLS)
- Storage (vídeos/materials)

### DevOps
- GitHub
- Vercel
- GitHub Actions

---

## 9. Variáveis de Ambiente

```env
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_chave
VITE_SUPABASE_STORAGE_URL=sua_url_storage
```

---

## 10. Banco de Dados - Tabelas

### Autenticação
- **users** (Supabase Auth)

### Gestão Acadêmica
- **students** - Alunos
- **teachers** - Professores
- **modules** - Módulos (1-6)
- **subjects** - Disciplinas
  - `prerequisite_id` - Pré-requisito (fk, nullable)
- **student_enrollments** - Matrículas por módulo
- **attendance** - Frequência
- **marks** - Notas
- **exams** - Avaliações
- **certificates** - Certificados emitidos
  - `type` - 'modulo' ou 'final'
  - `module_number` - Se for de módulo (1-6)

### Plataforma EAD
- **videos** - Vídeos das aulas
- **video_progress** - Progresso do aluno
- **materials** - PDFs, apostilas
- **comments** - Comentários
- **doubts** - Dúvidas
- **doubt_answers** - Respostas

### Comunicação
- **notices** - Avisos
- **events** - Eventos

### Configurações
- **settings** - Configurações gerais

---

## 11. Roles e Permissões (RLS)

| Role | Dash | Alunos | Profs | Freq | Notas | Vídeos | Materiais | Comentar | Dúvidas | Cert | Config |
|------|------|-------|-------|------|------|-------|---------|---------|---------|--------|------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Secretaria | ✅ | ✅ | ✅ | ✅ | Read | Read | Read | ✅ | ✅ | ✅ | ✅ |
| Professor | ✅ | Read | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Read | - |
| Aluno | ✅ | - | - | Read | Read | ✅ | ✅ | ✅ | ✅ | Read | - |

---

## 12. Fluxo Completo do Aluno

```
MATRÍCULA                          CONCLUSÃO
     │                                  │
     ├─► Escolher módulo               │
     │       (verificar prereqs)        │
     │                                  │
     │     ┌───────┴───────┐           │
     │     │              │           │
     │  ┌──┴──┐      ┌──┴──┐       │
     │  │ Disc │      │ Vídeo│       │
     │  │ A   │      │ aula │       │
     │  └──┬──┘      └──┬──┘       │
     │     │            │           │
     │  ┌──┴──┐        │           │
     │  │ Nota │◄──────┘           │
     │  │ 7+  │                     │
     │  └──┬──┘                     │
     │     │                        │
     │  ┌──┴──────────────────┐     │
     │  │ Fim do módulo     │     │
     │  │ Aprovado em     │     │
     │  │ todas disciplinas│     │
     │  └──┬──────────────────┘     │
     │     │                        │
     │  ┌──┴──┐                    │
     │  │Cert.│ ◄────► Certificado │
     │  │Módulo│    de Módulo     │
     │  └──┬──┘                    │
     │     │                        │
     │  ┌──┴─────────────────┐     │
     │  │ Módulo 6 concluído │     │
     │  └──┬─────────────────���     │
     │     │                        │
     │  ┌──┴──┐                    │
     │  │Cert.│ ◄────► Certificado │
     │  │Final│    Final do Curso  │
     │  └─────┘                    │
```

---

## 13. Cronograma

| Fase | Atividade | Dias |
|------|---------|------|
| 1 | Preparação | 1 |
| 2 | Config Base | 1 |
| 3 | UI/UX | 2 |
| 4 | Gestão Acadêmica | 5 |
| 5 | Plataforma EAD | 4 |
| 6 | Polish | 2 |
| 7 | CI/CD | 1 |

**Total: ~16 dias úteis**

---

## 14. Próximos Passos

1. Limpar scripts fix-*.cjs
2. Git init e primeiro commit
3. Criar repo GitHub
4. Deploy Vercel (teste)
5. Criar projeto Supabase

---

## 15. Observações Técnicas

### Supabase Storage
- Bucket `videos`: 500MB máx, MP4
- Bucket `materials`: PDFs, apostilas

### Certificados
- Gerados como PDF
- QR Code para verificação online
- Assinatura digital do sistema

### Pré-requisitos
- Validação na matrícula
- Disciplina pode ter 0 ou 1 pré-requisito
- Múltiplos pré-requisitos = futura melhoria

---

*Criado em: 25/04/2026*  
*Atualizado em: 25/04/2026*  
*ITEC - Instituto Teológico Educação Cristã*