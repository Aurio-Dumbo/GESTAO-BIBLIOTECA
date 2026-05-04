# Biblioteca Académica

Sistema de gestão de biblioteca com backend em Fastify/Prisma e frontend estático servido por Nginx.

## Tecnologias

| Camada | Stack |
|---|---|
| Backend | Node.js, Fastify, Prisma ORM, PostgreSQL, JWT, bcrypt |
| Frontend | HTML, CSS, JavaScript vanilla, Nginx |
| Infraestrutura | Docker, Docker Compose |

## Estrutura

```
BIBLIOTECA/
├── backend/          # API REST (Fastify + Prisma)
│   ├── src/
│   │   ├── routes/   # auth, livros, leitores, usuarios, emprestimos
│   │   ├── middleware/
│   │   └── lib/
│   └── prisma/       # Schema e migrações
└── frontend/         # Ficheiros estáticos + Nginx
    └── assets/js/    # api.js, app.js, ui.js, config.js
```

---

## Correr com Docker (recomendado)

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose instalados

### Passos

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd BIBLIOTECA
   ```

2. **Crie o ficheiro de variáveis de ambiente**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edite o `.env` e defina:
   ```env
   DATABASE_URL="postgresql://biblioteca_user:changeme@db:5432/biblioteca"
   DB_PASSWORD=changeme
   JWT_SECRET_KEY=coloque_uma_chave_secreta_longa_aqui
   PORT=3000
   ```

3. **Inicie os serviços**
   ```bash
   docker compose up --build -d
   ```

4. **Aceda à aplicação**
   Abra `http://localhost:3000` no browser.

5. **Credenciais iniciais**
   - Username: `admin`
   - PIN: `000000`

---

## Correr localmente (sem Docker)

### Pré-requisitos
- Node.js 22+
- PostgreSQL instalado e a correr

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com as credenciais locais do PostgreSQL
npx prisma migrate deploy
npm run dev
```

### Frontend

Abra o `frontend/index.html` com o **Live Server** do VS Code.  
O frontend estará disponível em `http://127.0.0.1:5500`.

> O backend tem de estar a correr em `http://localhost:3000`.

---

## Scripts do backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento com hot-reload |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Inicia a versão compilada |
| `npx prisma migrate dev` | Cria e aplica uma nova migração |
| `npx prisma migrate deploy` | Aplica migrações pendentes |
| `npx prisma studio` | Interface visual da base de dados |

---

## Endpoints da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/login` | — | Iniciar sessão |
| GET | `/livros` | — | Listar livros |
| POST | `/livros` | ✓ | Registar livro por ISBN |
| PUT | `/livros/:id` | ✓ | Atualizar livro |
| DELETE | `/livros/:id` | ✓ | Eliminar livro |
| GET | `/leitores` | ✓ | Listar leitores |
| POST | `/leitores` | ✓ | Registar leitor (validação de NIF) |
| GET | `/usuarios` | ✓ Admin | Listar utilizadores |
| POST | `/usuarios` | ✓ Admin | Criar utilizador |
| PUT | `/usuarios/:id` | ✓ Admin | Atualizar utilizador |
| DELETE | `/usuarios/:id` | ✓ Admin | Eliminar utilizador |
| GET | `/emprestimos` | ✓ | Listar empréstimos |
| POST | `/emprestimos` | ✓ | Registar empréstimo |
| PATCH | `/emprestimos/:id/devolver` | ✓ | Registar devolução |

---

## Variáveis de Ambiente

Ficheiro: `backend/.env` (baseado em `backend/.env.example`)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de ligação ao PostgreSQL |
| `PORT` | Porta do servidor (padrão: `3000`) |
| `JWT_SECRET_KEY` | Chave secreta para assinar tokens JWT |
| `DB_PASSWORD` | Password da BD (usado pelo Docker Compose) |
