import { SettingShortcutItem } from '@/src/types/settings';
import { matchesSearch } from '@/src/utils/text';

export const SETTING_SHORTCUTS: SettingShortcutItem[] = [
  // Conta e Segurança
  {
    id: 'change-password',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Alterar Senha',
    description: 'Redefina sua senha de acesso ao aplicativo',
    icon: 'lock-reset',
    synonyms: ['senha', 'password', 'redefinir', 'trocar', 'acesso', 'segurança', 'login'],
  },
  {
    id: 'delete-account',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Excluir Minha Conta',
    description: 'Ação irreversível de exclusão definitiva e encerramento da conta',
    icon: 'alert-octagon-outline',
    synonyms: ['excluir', 'deletar', 'apagar', 'cancelar', 'remover conta', 'encerrar'],
  },
  {
    id: 'user-profile',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Perfil e Conta',
    description: 'Visualizar nome, e-mail cadastrado e nível de acesso',
    icon: 'account-outline',
    synonyms: ['perfil', 'usuario', 'email', 'nome', 'cargo', 'dados'],
  },

  // Aparência
  {
    id: 'follow-system-theme',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Seguir o Sistema',
    description: 'Sincronizar tema claro ou escuro com as configurações do dispositivo',
    icon: 'theme-light-dark',
    synonyms: ['sistema', 'automático', 'dispositivo', 'so', 'sincronizar'],
  },
  {
    id: 'theme-mode',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Tema Visual (Claro / Escuro)',
    description: 'Alternar entre tema claro artesanal e modo escuro noturno',
    icon: 'palette-outline',
    synonyms: ['tema', 'escuro', 'claro', 'dark', 'light', 'noturno', 'cores'],
  },
  {
    id: 'high-contrast',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Modo Alto Contraste',
    description: 'Bordas e elementos visuais com maior contraste e legibilidade',
    icon: 'contrast-box',
    synonyms: ['contraste', 'acessibilidade', 'legibilidade', 'visibilidade', 'nitidez'],
  },
  {
    id: 'pure-black-theme',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Preto Puro (OLED)',
    description: 'Economia de bateria com pixels desligados em telas AMOLED',
    icon: 'power-sleep',
    synonyms: ['oled', 'amoled', 'bateria', 'preto', 'economia'],
  },

  // Gestos e Resposta Tátil (Mobile Only)
  {
    id: 'swipe-navigation',
    topicId: 'interaction',
    topicTitle: 'Gestos e Resposta Tátil',
    title: 'Navegação por Gesto',
    description: 'Arrastar horizontalmente para alternar entre as abas principais',
    icon: 'gesture-swipe-horizontal',
    synonyms: ['gesto', 'swipe', 'deslizar', 'arrastar', 'navegar'],
    isMobileOnly: true,
  },
  {
    id: 'haptic-feedback',
    topicId: 'interaction',
    topicTitle: 'Gestos e Resposta Tátil',
    title: 'Retorno Tátil (Vibração)',
    description: 'Vibrações ao tocar, alternar abas e confirmar ações no app',
    icon: 'vibrate',
    synonyms: ['vibração', 'vibrar', 'tátil', 'haptic', 'feedback', 'toque'],
    isMobileOnly: true,
  },
  {
    id: 'route-persistence',
    topicId: 'interaction',
    topicTitle: 'Gestos e Resposta Tátil',
    title: 'Lembrar Última Tela',
    description: 'Restaurar a tela aberta ao fechar e reabrir o aplicativo',
    icon: 'history',
    synonyms: ['rota', 'lembrar', 'persistência', 'salvar tela', 'reabrir'],
    isMobileOnly: true,
  },

  // Preferências Operacionais (Non-Customer Only)
  {
    id: 'price-precision',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Precisão de Preços (Casas Decimais)',
    description: 'Definir exibição com 2, 3 ou 4 casas decimais para insumos fracionados',
    icon: 'decimal',
    synonyms: ['decimais', 'casas decimais', 'centavos', 'precisão', 'arredondamento', 'vírgula'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-overhead',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custos Fixos Padrão (Overhead)',
    description: 'Percentual padrão para rateio de água, luz, gás e despesas da cozinha',
    icon: 'calculator-variant-outline',
    synonyms: ['overhead', 'custo fixo', 'despesas', 'luz', 'gás', 'água', 'aluguel'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-profit-margin',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Margem de Lucro Padrão',
    description: 'Percentual de lucro sugerido automaticamente no cálculo de novas receitas',
    icon: 'trending-up',
    synonyms: ['lucro', 'margem', 'markup', 'ganho', 'porcentagem'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-hourly-labor',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custo de Mão de Obra',
    description: 'Valor padrão da hora de trabalho do confeiteiro para precificação',
    icon: 'account-clock-outline',
    synonyms: ['mão de obra', 'salário', 'hora', 'trabalho', 'tempo'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-packaging-cost',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custo de Embalagem Padrão',
    description: 'Valor monetário sugerido para caixas, laços e embalagens de receitas',
    icon: 'package-variant-closed',
    synonyms: ['embalagem', 'caixa', 'fita', 'sacola', 'pacote'],
    isCustomerAllowed: false,
  },

  // Dados e Armazenamento
  {
    id: 'clear-app-cache',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Limpar Cache do Aplicativo',
    description: 'Liberar espaço em disco removendo imagens e dados temporários',
    icon: 'broom',
    synonyms: ['cache', 'limpar', 'armazenamento', 'memória', 'espaço', 'liberar'],
  },
  {
    id: 'clear-form-drafts',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Rascunhos de Formulários',
    description: 'Gerenciar e excluir rascunhos de receitas e cadastros não salvos',
    icon: 'file-document-edit-outline',
    synonyms: ['rascunhos', 'draft', 'salvos', 'formulário', 'não salvo'],
  },
  {
    id: 'offline-recipes-downloads',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Receitas Salvas Offline',
    description: 'Gerenciar receitas baixadas para acesso sem internet',
    icon: 'cloud-download-outline',
    synonyms: ['offline', 'download', 'baixar', 'sem internet', 'salvas'],
  },
  {
    id: 'offline-operations-queue',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Fila de Sincronização Offline',
    description: 'Consultar alterações pendentes realizadas enquanto esteve desconectado',
    icon: 'sync',
    synonyms: ['fila', 'sincronizar', 'pendentes', 'sync', 'ações'],
  },

  // Sobre o Aplicativo
  {
    id: 'technical-info',
    topicId: 'about',
    topicTitle: 'Sobre o Aplicativo',
    title: 'Informações Técnicas',
    description: 'Plataforma, status da conexão, ID do usuário e ID da sessão',
    icon: 'cellphone-link',
    synonyms: ['técnico', 'id', 'sessão', 'conexão', 'versão', 'plataforma'],
  },
  {
    id: 'help-support',
    topicId: 'about',
    topicTitle: 'Sobre o Aplicativo',
    title: 'Ajuda & Suporte',
    description: 'Canais de atendimento, dúvidas frequentes e contato oficial',
    icon: 'help-circle-outline',
    synonyms: ['ajuda', 'suporte', 'contato', 'email', 'dúvidas', 'atendimento'],
  },
  {
    id: 'terms-privacy',
    topicId: 'about',
    topicTitle: 'Sobre o Aplicativo',
    title: 'Termos de Uso & Privacidade',
    description: 'Diretrizes de proteção de dados, política de privacidade e LGPD',
    icon: 'file-document-outline',
    synonyms: ['termos', 'privacidade', 'lgpd', 'dados', 'segurança', 'política'],
  },
];

export interface FilterSettingShortcutsOptions {
  query: string;
  isDesktop: boolean;
  isCustomerRole: boolean;
}

export function filterSettingShortcuts({
  query,
  isDesktop,
  isCustomerRole,
}: FilterSettingShortcutsOptions): SettingShortcutItem[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  return SETTING_SHORTCUTS.filter((item) => {
    if (item.isMobileOnly && isDesktop) {
      return false;
    }
    if (item.isDesktopOnly && !isDesktop) {
      return false;
    }
    if (item.isCustomerAllowed === false && isCustomerRole) {
      return false;
    }

    const hasTitleMatch = matchesSearch(item.title, trimmed);
    const hasTopicMatch = matchesSearch(item.topicTitle, trimmed);
    const hasDescriptionMatch = matchesSearch(item.description, trimmed);
    const hasSynonymMatch = item.synonyms.some((synonym) => matchesSearch(synonym, trimmed));

    return hasTitleMatch || hasTopicMatch || hasDescriptionMatch || hasSynonymMatch;
  });
}
