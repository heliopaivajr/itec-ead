# Plataforma ITEC EAD

![ITEC Logo](https://via.placeholder.com/150x50.png?text=ITEC+EAD) <!-- Atualizar o caminho real da logo -->

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

> Desenvolvido com carinho para o **ITEC - Instituto de Teologia Cristã**.
