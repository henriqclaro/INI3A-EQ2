<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/LogoDarkHorizontal-MeuConfeito.png">
    <img src="docs/assets/LogoLightHorizontal-MeuConfeito.png" alt="Meu Confeito Logo" width="420">
  </picture>

  <p><strong>Gestão prática, fichas técnicas automatizadas e precificação inteligente para confeitaria artesanal.</strong></p>

  <p>
    <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" /></a>
    <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-57-000000?style=flat-square&logo=expo&logoColor=white" alt="Expo" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://www.prisma.io/orm"><img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  </p>
</div>

---

## 📌 Visão Geral & Proposta de Solução

O **Meu Confeito** é uma solução digital multiplataforma desenvolvida para sanar os principais desafios operacionais e financeiros vivenciados por confeiteiras e pequenos ateliês autônomos.

Na confeitaria artesanal, é comum que a precificação seja calculada de forma empírica (como a imprecisa "regra do x3") e as anotações fiquem dispersas em cadernos ou planilhas difíceis de manter. O projeto substitui esses gargalos por uma aplicação centralizada, ágil e acessível diretamente no smartphone — com foco prioritário em **dispositivos Android** (o ambiente mais utilizado pelo público-alvo) e suporte complementar para **navegadores Desktop**.

A plataforma garante controle de ponta a ponta: do cálculo de custo por grama de insumo à divulgação de pontos físicos de venda sem cobrança de taxas ou mensalidades.

---

## 📱 Principais Funcionalidades

### 🍰 Fichas Técnicas & Precificação Inteligente

- **Cálculo de custo real por ingrediente:** conversão automatizada entre unidades de medida (g, kg, ml, xícaras e unidades) e cálculo proporcional exato.
- **Custos indiretos e operacionais:** inclusão rateada de gás, energia, desgaste de utensílios e embalagens.
- **Margem de lucro real:** simulação dinâmica do preço sugerido de venda e lucro líquido por lote ou porção individual.

### 📦 Controle de Estoque & Produção

- Registro e rastreio de insumos com controle de quantidade mínima e custos de aquisição.
- Baixa automática no estoque ao registrar ordens de produção ou preparos de lotes.
- Histórico de movimentações (compras, perdas e ajustes manuais).

### 📈 Radar de Tendências (User-Driven)

- Identificação de receitas, sabores e formatos em alta orientada pelo próprio comportamento dos usuários (volume de receitas salvas, favoritadas e preparadas na plataforma).
- Inspiração sem dependência de algoritmos de redes sociais externas.

### 📍 Pontos Físicos & Vitrine Local (PostGIS)

- Mapeamento geolocalizado de ateliês e pontos de venda físicos.
- Divulgação direta de canais de contato (WhatsApp e Instagram) para negociação e retirada local, sem taxas de intermediação.

### 📊 Relatórios & Visão Financeira

- Painel visual com balanço de custos, faturamento bruto, lucro líquido e produtos de maior rentabilidade.

---

## 🛠️ Tecnologias Utilizadas

| Camada                     | Tecnologia                                             | Finalidade                                                                                 |
| :------------------------- | :----------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Mobile & Web**           | **React Native** + **Expo (SDK 57)**                   | Aplicação móvel focada em Android com suporte a Web/Desktop                                |
| **Navegação & UI**         | **Expo Router**, **React Native Paper**, **FlashList** | Roteamento baseado em arquivos, componentes Material Design e listas de alta performance   |
| **Linguagem (Full-stack)** | **TypeScript**                                         | Tipagem estática fim a fim para confiabilidade em cálculos matemáticos e regras de negócio |
| **Backend API**            | **Node.js** + **Express.js 5**                         | API RESTful modular para sincronização em tempo real                                       |
| **ORM & Validação**        | **Prisma 7** + **Zod**                                 | Mapeamento objeto-relacional tipado e validação estrita de esquemas e requisições          |
| **Banco de Dados**         | **PostgreSQL** + **PostGIS**                           | Banco relacional com extensão geoespacial para localização de pontos de venda              |
| **Landing Page**           | **HTML5**, **CSS3**, **JavaScript**                    | Página institucional de apresentação com simulador interativo de ficha técnica             |

---

## 📂 Estrutura do Repositório

```text
.
├── docs/                       # Documentação técnica, especificações de design e assets
├── src/
│   ├── api/meu-confeito-api/   # API RESTful em Node.js, Express, Prisma e PostgreSQL
│   ├── front/meu-confeito-app/ # Aplicativo mobile/web em React Native com Expo
│   └── site/                   # Landing page institucional com simulador interativo
├── DEVELOPER.md                # Guia completo de desenvolvimento, padrões e configuração da API
└── README.md                   # Apresentação geral do projeto
```

---

## 🚀 Como Executar o Aplicativo

Para experimentar e testar a solução na prática, o foco principal é a execução da aplicação cliente (**Meu Confeito App**), que consome os serviços da API.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada: 22.x)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) instalado em seu dispositivo móvel ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) ou [iOS](https://apps.apple.com/br/app/expo-go/id982107779))

### Passo a Passo

1. **Clonar o repositório:**

   ```bash
   git clone https://github.com/henriqclaro/INI3A-EQ2.git
   cd INI3A-EQ2
   ```

2. **Acessar a pasta do aplicativo:**

   ```bash
   cd src/front/meu-confeito-app
   ```

3. **Instalar as dependências:**

   ```bash
   npm install
   ```

4. **Configurar o ambiente (`.env`):**
   Copie o arquivo de exemplo e aponte para a URL da API disponibilizada para o projeto (ou local):

   ```bash
   cp .env.example .env
   ```

   Abra o `.env` e preencha a variável `EXPO_PUBLIC_API_URL` com a URL base da API.

5. **Iniciar o servidor de desenvolvimento Expo:**

   ```bash
   npx expo start
   ```

6. **Visualizar a aplicação:**
   - **No Celular (Android recomendado):** Abra o app **Expo Go**, escaneie o QR Code exibido no terminal e teste com a experiência tátil e layout nativo.
   - **No Navegador (Web / Desktop):** Pressione a tecla `w` no terminal para abrir a aplicação em uma aba do navegador.

---

## ⚙️ Execução da API e Ambiente de Desenvolvimento

> A configuração do backend (**meu-confeito-api**) requer serviços específicos, incluindo instância do **PostgreSQL** com a extensão geoespacial **PostGIS**, execução de migrações via **Prisma ORM**, geração de clientes e variáveis sensíveis de autenticação.
>
> Para manter este README objetivo e evitar inconsistências, **todas as instruções detalhadas de configuração, variáveis de ambiente, inicialização e hospedagem local da API estão centralizadas no [DEVELOPER.md](DEVELOPER.md)**.

Consulte o [DEVELOPER.md](DEVELOPER.md) para:

- 🛠️ Instruções passo a passo de configuração e execução da API e do banco de dados.
- 📐 Padrões de código, convenções de nomenclatura e arquitetura do projeto.
- 💻 Configurações recomendadas de ambiente e extensões para o VS Code.
- 🔀 Fluxo de trabalho com Git e boas práticas da equipe.
