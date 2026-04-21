# Plataforma ITEC EAD

![ITEC Logo](./public/logo_itec.png)

O **Instituto Teológico de Educação Cristã (ITEC)** é uma plataforma educacional moderna que oferece formação teológica qualificada através de ensino híbrido (presencial e EAD). Este repositório guarda o código-fonte da nova plataforma 100% digital do instituto.

## 🚀 Status do Projeto

Atualmente, estamos finalizando as "Sprints 1 e 2" focadas no layout base, usabilidade (cores e temas) e na arquitetura segura de Banco de Dados.

### O que já foi implementado:
- ✅ **Layout Base e Tematização:** Implementação de sistema claro/escuro com design de alta conversão.
- ✅ **Grade Curricular:** Páginas voltadas para visitantes explorarem os cursos (Teologia Livre, SETEB e Ministerial para Mulheres) e baixarem grades curriculares por PDFs gerados nativamente no navegador.
- ✅ **Captação de Leads:** Modal forçado inteligente antes do descarregamento da grade curricular para prospectar novos alunos.
- ✅ **Autenticação Real (Supabase):**
  - Integração do `@supabase/supabase-js`
  - Telas de **Login com Abas** separando Aluno, Professor e Admin.
  - Tela de Cadastro aberta para alunos novatos (`/cadastro`).
  - Fluxo seguro de **Esqueci a Senha** (`/esqueci-senha`).
- ✅ **Gestão de Perfil & Roles:** Uso intensivo de *Triggers* no PostgreSQL e *Row Level Security (RLS)* para definir permissões de administrador, instrutor ou estudante protegendo o acesso ao painel do Dashboard.

---

## 🛠️ Tecnologias Utilizadas (Tech Stack)

Este projeto foi construído sobre uma arquitetura moderna para garantir performance e escalabilidade:

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI (Componentes Radix)
- **Autenticação & Backend-as-a-Service:** [Supabase](https://supabase.com/)
- **Roteamento:** React Router DOM
- **Validações:** Zod + React Hook Form

---

## 💻 Como Rodar este Projeto Localmente

Para iniciar o desenvolvimento em sua máquina, siga os passos estritos abaixo para habilitar o banco de dados e as funções nativas.

### 1. Pré-Requisitos
Você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (Versão LTS >= 18)
- Um projeto limpo já criado no [Supabase](https://supabase.com)

### 2. Passo a Passo

```bash
# Clone este repositório
git clone <url-do-repositorio>

# Acesse a pasta do projeto
cd itec-ead

# Instale todas as dependências
npm install
```

#### 2.1 Configuração do Supabase (Apenas primeira vez)
Para o painel de Login funcionar, você deve popular as variáveis de ambiente seguindo o nosso modelo.

1. Renomeie o (ou crie um novo) arquivo `.env` na raiz da pasta `itec-ead`:
```env
VITE_SUPABASE_URL="Sua URL do Projeto Supabase"
VITE_SUPABASE_ANON_KEY="Sua Publishable / Anon Key do Supabase"
```

2. Execute o **Script de Banco de Dados**:
Abra o arquivo `supabase_setup.sql` que se encontra na raiz do projeto e **rode este comando dentro do SQL Editor do seu Supabase Dashboard**. Isso irá criar a tabela `profiles`, as políticas de segurança RLS, e as triggers responsáveis pelos cadastros.

#### 2.2 Rodando o Servidor de Desenvolvimento
Com o `.env` configurado, basta subir o front-end:

```bash
npm run dev
```
O servidor ficará disponível em `http://localhost:8080/` (ou em porta designada pelo Vite).

---

## 🔐 Controle de Permissões (Roles)

Nosso sistema se divide em 3 papéis principais por motivos de segurança.

- **Admin:** Necessita ser configurado manualmente no editor de tabelas do Supabase. Possui visualização sobre professores, cursos e dados empresariais gerais.
- **Professor:** Poderá ser atrelado manualmente via dashboard ou painel web. Responsável pelos materiais de aula.
- **Aluno:** Nível base. Uma conta que se cadastrar através da aba pública `/cadastro` do nosso site sempre receberá esse papel padrão.

---

---

## 📋 Roadmap de Sprints

### Sprint 1–2 ✅ (Concluídas)
- Layout base, tematização, autenticação, roles, leads, perfil

---

### Sprint 3 — Área Interna: Dashboard por Role

O coração da plataforma é a **área interna pós-login**, dividida em três experiências distintas por papel.

#### 🎓 Painel do Aluno
| Rota | Página | Status |
|---|---|---|
| `/dashboard` | Visão geral: cursos em andamento, eventos, avisos | 🟡 Parcial |
| `/dashboard/cursos` | Meus Cursos — progresso, módulos, materiais | 🟡 Parcial |
| `/dashboard/ao-vivo` | Transmissões ao vivo (aulas em tempo real) | 🔴 Pendente |
| `/dashboard/comunidade` | Fóruns, grupos de estudo, chat | 🔴 Pendente |
| `/dashboard/eventos` | Calendário acadêmico e compromissos | 🔴 Pendente |
| `/dashboard/documentos` | Certificados, histórico escolar, comprovantes | 🔴 Pendente |
| `/dashboard/pagamentos` | Mensalidades, boletos, histórico financeiro | 🔴 Pendente |
| `/dashboard/suporte` | Central de ajuda, tickets de suporte | 🔴 Pendente |
| `/dashboard/perfil` | Foto, bio, dados pessoais, senha | ✅ Feito |

#### 👨‍🏫 Painel do Professor
| Rota | Página | Status |
|---|---|---|
| `/dashboard` | Visão geral: turmas, próximas aulas, avaliações | 🟡 Parcial |
| `/dashboard/turmas` | Minhas Turmas — lista de alunos, frequência | 🔴 Pendente |
| `/dashboard/materiais` | Upload e gestão de apostilas, slides, vídeos | 🔴 Pendente |
| `/dashboard/avaliacoes` | Criar provas, trabalhos, lançar notas | 🔴 Pendente |
| `/dashboard/agenda` | Calendário de aulas e compromissos | 🔴 Pendente |
| `/dashboard/notificacoes` | Enviar avisos para turmas | 🔴 Pendente |
| `/dashboard/perfil` | Dados pessoais, especialização, bio | ✅ Feito |

#### 🛡️ Painel do Admin
| Rota | Página | Status |
|---|---|---|
| `/dashboard` | KPIs: total alunos, professores, receita, leads | 🟡 Parcial |
| `/dashboard/usuarios` | Gerenciar alunos, professores, admins + roles | ✅ Feito |
| `/dashboard/leads` | Leads capturados, exportar CSV | ✅ Feito |
| `/dashboard/matriculas` | Aprovar/reprovar matrículas, status por aluno | 🔴 Pendente |
| `/dashboard/cursos-admin` | CRUD de cursos, módulos e conteúdo | 🔴 Pendente |
| `/dashboard/notificacoes` | Comunicados para toda a plataforma | 🔴 Pendente |
| `/dashboard/documentos` | Emissão de certificados, históricos | 🔴 Pendente |
| `/dashboard/financeiro` | Receitas, despesas, mensalidades, relatórios | 🔴 Pendente |
| `/dashboard/perfil` | Configurações gerais da plataforma | ✅ Feito |

---

### Sprint 4 — Módulos Acadêmicos Avançados

Inspirados no template EduDash (EDUC), os seguintes módulos serão construídos nativamente para o ITEC:

#### Gestão Acadêmica
- **Frequência** — Controle de presença por aula/módulo (aluno e professor)
- **Notas e Resultados** — Lançamento e visualização de notas por disciplina
- **Horários** — Grade de horários semanal (aluno e professor)
- **Calendário Acadêmico** — Eventos, feriados, datas de provas

#### Comunicação
- **Mural de Avisos** — Avisos institucionais visíveis por role
- **Mensagens Internas** — Troca de mensagens entre usuário e admin/professor
- **Notificações Push** — Alertas de novas aulas, notas, avisos

#### Financeiro (Admin)
- **Mensalidades** — Controle de pagamentos por aluno
- **Descontos/Bolsas** — Tipos e percentuais de desconto
- **Relatório Financeiro** — Receitas x Despesas por período

#### Certificados
- **Emissão** — Gerar certificado em PDF para alunos concluintes
- **Histórico** — Listar todos os certificados emitidos

---

### Sprint 5 — Qualidade e Produção
- Testes automatizados (Vitest + Testing Library)
- PWA (manifesto + service worker)
- Notificações por email (Supabase Edge Functions + Resend)
- Otimizações de performance (code splitting, lazy loading)

---

## 🗄️ Estrutura de Banco de Dados (Supabase PostgreSQL)

### Tabelas Atuais
| Tabela | Descrição |
|---|---|
| `profiles` | Dados de perfil do usuário (role, nome, phone, bio) |
| `leads_cursos` | Leads capturados antes do download da grade |
| `matriculas` | Matrículas dos alunos nos cursos |

### Tabelas Planejadas (Sprints 3–5)
| Tabela | Descrição |
|---|---|
| `cursos` | Catálogo de cursos com módulos e informações |
| `modulos` | Módulos/disciplinas de cada curso |
| `aulas` | Aulas dentro de cada módulo |
| `progresso_aluno` | Progresso por aluno/módulo |
| `frequencia` | Registros de presença por aula |
| `notas` | Notas lançadas por professor/disciplina |
| `materiais` | Arquivos de apostilas, slides, vídeos |
| `avisos` | Mural de avisos por role/turma |
| `mensagens` | Mensagens internas entre usuários |
| `certificados` | Certificados emitidos com hash de validação |
| `pagamentos` | Mensalidades e status de pagamento |
| `descontos` | Tipos e percentuais de desconto por aluno |

---

> Desenvolvido com carinho para o **ITEC - Instituto de Teologia Cristã**.
