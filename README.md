<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/LogoDarkHorizontal-MeuConfeito.png">
    <img src="docs/assets/LogoLightHorizontal-MeuConfeito.png" alt="Meu Confeito Logo" width="420">
  </picture>

  <p><strong>Gestão prática, fichas técnicas automatizadas e precificação inteligente para confeitaria artesanal.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-57-000000?style=flat-square&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
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

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Mobile & Web** | **React Native** + **Expo (SDK 57)** | Aplicação móvel focada em Android com suporte a Web/Desktop |
| **Navegação & UI** | **Expo Router**, **React Native Paper**, **FlashList** | Roteamento baseado em arquivos, componentes Material Design e listas de alta performance |
| **Linguagem (Full-stack)** | **TypeScript** | Tipagem estática fim a fim para confiabilidade em cálculos matemáticos e regras de negócio |
| **Backend API** | **Node.js** + **Express.js 5** | API RESTful modular para sincronização em tempo real |
| **ORM & Validação** | **Prisma 7** + **Zod** | Mapeamento objeto-relacional tipado e validação estrita de esquemas e requisições |
| **Banco de Dados** | **PostgreSQL** + **PostGIS** | Banco relacional com extensão geoespacial para localização de pontos de venda |
| **Landing Page** | **HTML5**, **CSS3**, **JavaScript** | Página institucional de apresentação com simulador interativo de ficha técnica |

---

## 📂 Estrutura do Repositório

```text
.
├── docs/                       # Documentação técnica, especificações de design e assets
├── src/
│   ├── api/meu-confeito-api/   # API RESTful em Node.js, Express, Prisma e PostgreSQL
│   ├── front/meu-confeito-app/ # Aplicativo mobile/web em React Native com Expo
│   └── site/                   # Landing page institucional com simulador interativo
├── DEVELOPER.md                # Diretrizes detalhadas para desenvolvedores e padrões de código
└── README.md                   # Apresentação geral do projeto
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada: 22.x)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) instalado em seu smartphone (Android ou iOS)

### 1. Clonar o repositório
```bash
git clone https://github.com/henriqclaro/INI3A-EQ2.git
cd INI3A-EQ2
```

### 2. Executar a API (Backend)
```bash
cd src/api/meu-confeito-api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar o servidor em modo de desenvolvimento
npm run dev
```
> A API estará rodando por padrão em `http://localhost:3000`. A documentação interativa das rotas pode ser acessada em `/docs` (Swagger).

### 3. Executar a Aplicação Mobile (Frontend)
Em um novo terminal:
```bash
cd src/front/meu-confeito-app

# Instalar dependências
npm install

# Configurar variáveis de ambiente apontando para a API
cp .env.example .env

# Iniciar o servidor de desenvolvimento Expo
npx expo start
```
- **Android / iOS:** Abra o aplicativo **Expo Go** no smartphone e escaneie o QR Code exibido no terminal.
- **Web / Desktop:** Pressione `w` no terminal para abrir a interface no navegador.

---

## 📖 Documentação Adicional

Para padrões de nomenclatura, guia de contribuição e convenções de arquitetura da equipe, consulte o arquivo [DEVELOPER.md](DEVELOPER.md).
