<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/LogoDarkHorizontal-MeuConfeito.png">
    <img src="docs/assets/LogoLightHorizontal-MeuConfeito.png">
  </picture>
</div>

<br>

<div align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22.x-6DA55F?style=for-the-badge&logo=node.js" alt="Node.js Badge"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.x-007ACC?style=for-the-badge&logo=typescript" alt="TypeScript Badge"></a><br>
    <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express.js-5.x-lightgrey?style=for-the-badge&logo=express" alt="Express.js Badge"></a>
    <a href="https://www.prisma.io/orm"><img src="https://img.shields.io/badge/Prisma-7.x-6366f1?style=for-the-badge&logo=prisma" alt="Prisma ORM Badge"></a>
    <a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/Postgresql-18.x-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL Badge"></a><br>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_Native-0.86.x-61DAFB?style=for-the-badge&logo=React" alt="React Native Badge"></a>
    <a href="https://expo.dev/go"><img src="https://img.shields.io/badge/Expo-57.x-white?style=for-the-badge&logo=Expo" alt="Expo Badge"></a>
</div>

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter os seguintes itens instalados:

* **Node.js:**
  Necessário para rodar o projeto.
  > https://nodejs.org/ (recomenda-se a versão LTS)
  >
  > ...ou no Terminal do Windows:
  > ```bash
  > winget install -e --id OpenJS.NodeJS.LTS
  > ```

* **Git:**
  Utilizado para versionamento de código.
  > https://git-scm.com/downloads
  >
  > ...ou no Terminal do Windows:
  > ```bash
  > winget install -e --id Git.Git
  > ```

* **Expo Go**
  Aplicativo para testar o projeto no celular:

  * Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent&pcampaignid=web_share)
  * iOS: [App Store](https://apps.apple.com/br/app/expo-go/id982107779)
  * Geral: Abrir pelo navegador

---

## Instalação e Execução

No terminal, execute os passos abaixo na ordem:

### 1. Faça login no git
* Configure as variáveis no terminal:
  ```bash
  git config --global user.name "Seu Nome do GitHub"
  git config --global user.email "seu.email@unesp.br"
  ```

  > Se quiser, pode tentar fazer login com o [GitHub CLI](https://cli.github.com/):
  > ```bash
  > gh auth login
  > ```

### 2. Clone o repositório

```bash
git clone https://github.com/henriqclaro/INI3A-EQ2.git
```

### 3. Acesse o diretório do projeto

No terminal do Windows:

* Front:
  ```bash
  cd .\INI3A-EQ2\src\front\meu-confeito-app\
  ```
* API:
  ```bash
  cd .\INI3A-EQ2\src\api\meu-confeito-api\
  ```

### 4. Instale as dependências

```bash
npm install
```

### 5. Configure as variáveis de ambiente (`.env`)

* Copie o arquivo `.env.example` e configure as variáveis.
* *Não se esqueça de apagar o* `.example` *no final do arquivo.*
* ***Nunca** apague o* `.env.example` *, ele sobe pro GitHub (diferentemente do* `.env` *)*

## Ambiente de Desenvolvimento (VS Code)

Para manter a consistência do código e melhorar a produtividade da equipe, instale as seguintes extensões:

### Extensões Gerais

* ⚠️ **ESLint** (`dbaeumer.vscode-eslint`) *(Obrigatório)*
  Identifica e reporta padrões incorretos no código.

* ⚠️ **Prettier - Code formatter** (`esbenp.prettier-vscode`) *(Obrigatório)*
  Formata o código automaticamente.

* ⚠️ **JavaScript and TypeScript Nightly** (`ms-vscode.vscode-typescript-next`) *(Obrigatório)*
  Suporte atualizado para JavaScript e TypeScript.

* ✅ **Error Lens** (`usernamehw.errorlens`)
  Exibe erros diretamente na linha do código.

* ✅ **Path Intellisense** (`christian-kohler.path-intellisense`)
  Autocompletar para nomes de arquivos.

### Extensões Front-end
  
* ⚠️ **React Native Tools** (`msjsdiag.vscode-react-native`) *(Obrigatório)*
  Suporte completo para desenvolvimento React Native.

* ⚠️ **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`) *(Obrigatório)*
  Atalhos para criação rápida de componentes.

* ✅ **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
  Renomeia automaticamente tags pareadas (HTML/JSX).

* ✅ **Color Highlight** (`naumovs.color-highlight`)
  Destaca cores diretamente no código.

### Extensões Back-end

* ⚠️ **Express Snippets** (`ExpressSnippets.vscode-express-snippets`) *(Obrigatório)*
  Atalhos práticos de código para o Express.

* ⚠️ **Prisma** (`Prisma.prisma`) *(Obrigatório)*
  Suporte oficial de sintaxe e formatação para o ORM Prisma.
  
* ✅ **DotENV** (`mikestead.dotenv`)
  Suporte de sintaxe para arquivos de ambiente .env.

* ✅ **npm Intellisense** (`christian-kohler.npm-intellisense`)
  Autocompletar para importação de módulos npm.

---

## Padrões e Convenções

Para manter a base de código organizada, legível e consistente entre toda a equipe:

### Idioma do código

* Tente ao máximo utilizar **inglês** para nomes de arquivos, variáveis, funções e componentes.
* Evite misturar idiomas no código.

---

### Pastas

* Use **kebab-case** (minúsculas com hífen)
  Ex: `components`, `screens`, `utils`, `controllers`, `routes`

### Arquivos Front-end (Componentes e Telas)

* Componentes com iniciais maiúsculas (**PascalCase**)
  * Ex: `PrimaryButton.tsx`, `CustomTabBar.tsx`
  
* Rotas (telas) com tudo em minúsculo, separado por hífen (**kebab-case**)
  * Ex: `index.tsx`, `user-profile.tsx`

### Arquivos Back-end (Expresss)

* Tudo minúsculo, uso de pontos para separar a entidade e a sua camada/responsabilidade
  * Ex: `app.ts`, `user.controller.ts`, `auth.middleware.ts`

### Variáveis e Funções

* Use **camelCase**
  * Ex: `loggedUser`, `validateForm()`, `handleSubmit`

### Constantes Globais

* Use **UPPER_SNAKE_CASE**
  * Ex: `API_URL`, `PRIMARY_COLOR`, `MAX_ATTEMPTS`

---
## Desenvolvimento do Front

Árvore da aplicação, com pastas e arquivos mais importantes:

```
└── meu-confeito-app
    ├── .env              --Variáveis importantes e sensíveis (não sobe pro GitHub)
    ├── .env.example      --Exemplo do .env para copiar (sobe pro GitHub)
    ├── node_modules/     --Dependências (não sobe pro GitHub, gerar com o npm)
    ├── app/              --Onde ficam todas as telas do aplicativo, arquivos .tsx
    │   └── (tabs)/       --Telas principais, que aparecem em abas inferiores
    ├── assets/           --Arquivos de imagem e recursos visuais estáticos da aplicação
    └── src/
        ├── components/   --Componentes customizados e tematizados
        ├── config/       --Configurações de ambiente da aplicação
        ├── contexts/     --Compartilhamento de dados globais da aplicação, como o login
        ├── hooks/        --Ponte entre Telas e Serviços, isolam lógicas repetitivas
        ├── services/     --Funções que processam as Requisições diretamente, chamadas por hooks
        ├── theme/        --Definições de estilos e cores dos temas da aplicação
        ├── types/        --Tipagens e Interfaces para Requisições
        └── utils/        --Funções úteis, como o armazenamento de credenciais
```

### 1. Configure o `.env` com a URL base da API pública

A API está hospedada nos servidores do colégio, a URL base foi compartilhada nos nossos grupos

### 2. Inicie o servidor de desenvolvimento

```bash
npx expo start
```

### 3. Teste a aplicação

* **Celulares Android:**
  Abra o **Expo Go** e escaneie o QR Code exibido no terminal.

* **Geral:**
  Abra no navegador por meio da URL local no terminal.
  * OBS: use o **Inspecionar** para simular as dimensões de um celular se necessário.

---

## Desenvolvimento da API (apenas se for hospedar localmente)

Árvore da API, com pastas e arquivos mais importantes:

```
└── meu-confeito-api/
    ├── .env              --Variáveis importantes e sensíveis (não sobe pro GitHub)
    ├── .env.example      --Exemplo do .env para copiar (sobe pro GitHub)
    ├── node_modules/     --Dependências (não sobe pro GitHub, gerar com o npm)
    ├── prisma/           --ORM: Schema do Banco e migrations
    └── src/
        ├── config/       --Configurações do ambiente da API
        ├── controllers/  --Receptores de Requisições, mandam dados pro Service
        ├── docs/         --Arquivos para geração da documentação com o Swagger
        ├── generated/    --Models e Prisma (não sobe pro GitHub, gerar com o Prisma)
        ├── middlewares/  --Interceptadores de Rotas, para verificação e tratamento
        ├── responses/    --Classess de Respostas, para padronização
        ├── routes/       --Gerenciamento de Rotas, chamam o Controller
            └── index.ts  --Index de Rotas, todas as Rotas da API
        ├── services/     --Parte lógica da API, processam dados com o Banco
        ├── types/        --Tipagens e Interfaces da API
            └── dtos/     --Tipagem de Requisições e Respostas
        ├── utils/        --Funções úteis, para complementar (ex: conversão monetária)
        └── validation/   --Schemas para validação de Requisições com o Zod
```

### 1. Gere a pasta com os models necessários (`generated/`):

```bash
npx prisma generate
```

### 2. Sincronize com o Banco de Dados:

Configuradas as variáveis de ambiente, rode:

```bash
npx prisma db push
```

### 3. Inicie o servidor da API localmente:

```bash
npm run dev
```

#### Para abrir o gerenciador do Banco no navegador, rode:
```bash
npx prisma studio
```

---

## Notas para a Equipe

* Sempre execute **antes de começar** e **antes de fazer um commit**:

```bash
git pull
```

* Se ocorrerem erros após atualizações:

```bash
npm install
```

---
