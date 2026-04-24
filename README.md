# Meu Confeito
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

* **GitHub CLI:**
  Utilizado para o login com GitHub.
  > https://cli.github.com/
  >
  > ...ou no Terminal do Windows:
  > ```bash
  > winget install -e --id GitHub.cli
  > ```

* **Expo Go**
  Aplicativo para testar o projeto no celular:

  * Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent&hl=pt_BR)
  * iOS: [App Store](https://apps.apple.com/br/app/expo-go/id982107779)

---

## Instalação e Execução

No terminal, execute os passos abaixo na ordem:

### 1. Lembre-se de fazer login no git
* Rode e siga os passos para fazer login com o navegador:
  ```bash
  gh auth login
  ```

* Se não fizer login diretamente, configure com o git: 
  ```bash
  git config --global user.name "Seu Nome do GitHub"
  git config --global user.email "seu.email@unesp.br"
  ```

### 2. Clone o repositório

```bash
git clone https://github.com/AnaClara1506/INI3A-EQ2.git
```

### 3. Acesse o diretório do projeto

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

* Iniciais maiúsculas (**PascalCase**)
  * Ex: `PrimaryButton.tsx`, `LoginScreen.tsx`

### Arquivos Back-end (Expresss)

* Tudo minúsculo, uso de pontos para separar a entidade e a sua camada/responsabilidade
  * Ex: `app.ts`, `user.controller.ts`, `auth.middleware.ts`

### Variáveis e Funções

* Use **camelCase**
  Ex: `loggedUser`, `validateForm()`, `handleSubmit`

### Constantes Globais

* Use **UPPER_SNAKE_CASE**
  Ex: `API_URL`, `PRIMARY_COLOR`, `MAX_ATTEMPTS`

---
## Desenvolvimento do Front

Após o desenvolvimento no código, verifique as mudanças da seguinte maneira:

### 1. Inicie o servidor de desenvolvimento

```bash
npx expo start
```

### 2. Execute no celular

* **Android:**
  Abra o **Expo Go** e escaneie o QR Code exibido no terminal.

* **iOS:**
  Abra o app **Câmera**, escaneie o QR Code e abra no Expo Go.

---

## Desenvolvimento da API

Para gerar a pasta com os models necessários, rode:

```bash
npx prisma generate
```

Para abrir o gerenciador do Banco no navegador, rode:

```bash
npx prisma studio
```
---

## Notas para a Equipe

* Sempre execute antes de começar:

```bash
git pull
```

* Se ocorrerem erros após atualizações:

```bash
npm install
```

---
