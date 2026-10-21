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
    icon: 'lock_reset',
    synonyms: ['senha', 'password', 'redefinir', 'trocar', 'acesso', 'segurança', 'login'],
  },
  {
    id: 'delete-account',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Excluir Minha Conta',
    description: 'Ação irreversível de exclusão definitiva e encerramento da conta',
    icon: 'report',
    synonyms: ['excluir', 'deletar', 'apagar', 'cancelar', 'remover conta', 'encerrar'],
  },
  {
    id: 'user-profile',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Perfil e Conta',
    description: 'Visualizar nome, e-mail cadastrado e nível de acesso',
    icon: 'person',
    synonyms: ['perfil', 'usuario', 'email', 'nome', 'cargo', 'dados'],
  },
  {
    id: 'edit-profile',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Editar Perfil',
    description: 'Atualize seu nome, foto, telefone e dados cadastrais',
    icon: 'manage_accounts',
    synonyms: [
      'editar perfil',
      'foto',
      'avatar',
      'telefone',
      'nome',
      'cadastro',
      'dados cadastrais',
    ],
  },
  {
    id: 'deactivate-baker-profile',
    topicId: 'account',
    topicTitle: 'Conta e Segurança',
    title: 'Desativar Perfil de Confeiteiro',
    description: 'Ocultar confeitaria das buscas e tornar perfil comercial privado',
    icon: 'storefront',
    synonyms: [
      'desativar',
      'confeiteiro',
      'perfil comercial',
      'pausar',
      'privado',
      'ocultar',
      'loja',
    ],
    isBakerOnly: true,
  },

  // Aparência
  {
    id: 'follow-system-theme',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Seguir o Sistema',
    description: 'Sincronizar tema claro ou escuro com as configurações do dispositivo',
    icon: 'routine',
    synonyms: ['sistema', 'automático', 'dispositivo', 'so', 'sincronizar'],
  },
  {
    id: 'theme-mode',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Tema Visual (Claro / Escuro)',
    description: 'Alternar entre tema claro artesanal e modo escuro noturno',
    icon: 'palette',
    synonyms: ['tema', 'escuro', 'claro', 'dark', 'light', 'noturno', 'cores'],
  },
  {
    id: 'high-contrast',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Modo Alto Contraste',
    description: 'Bordas e elementos visuais com maior contraste e legibilidade',
    icon: 'contrast',
    synonyms: ['contraste', 'acessibilidade', 'legibilidade', 'visibilidade', 'nitidez'],
  },
  {
    id: 'pure-black-theme',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Preto Puro (OLED)',
    description: 'Economia de bateria com pixels desligados em telas AMOLED',
    icon: 'power_settings_new',
    synonyms: ['oled', 'amoled', 'bateria', 'preto', 'economia'],
  },
  {
    id: 'device-font',
    topicId: 'appearance',
    topicTitle: 'Aparência',
    title: 'Fonte do Dispositivo',
    description: 'Utilizar a fonte padrão do sistema operacional no lugar das fontes customizadas',
    icon: 'font_download',
    synonyms: ['fonte', 'font', 'tipografia', 'sistema', 'dispositivo', 'letras', 'texto'],
    isMobileOnly: true,
  },

  // Acessibilidade e Interação
  {
    id: 'accessibility-overview',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Acessibilidade e Interação',
    description: 'Gestos, retorno tátil, alto contraste e visibilidade de cards de ajuda',
    icon: 'accessible',
    synonyms: ['acessibilidade', 'cards', 'dicas', 'ajuda', 'tátil', 'gestos', 'contraste'],
  },
  {
    id: 'hide-onboarding-cards',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Ocultar Todos os Cards de Ajuda',
    description: 'Remover todos os cards e banners informativos de todas as telas',
    icon: 'visibility_off',
    synonyms: [
      'ocultar cards',
      'remover cards',
      'limpar cards',
      'esconder dicas',
      'desativar avisos',
    ],
  },
  {
    id: 'restore-onboarding-cards',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Restaurar Cards de Dicas',
    description: 'Fazer com que os cards e atalhos de aprendizado voltem a aparecer nas telas',
    icon: 'settings_backup_restore',
    synonyms: [
      'restaurar cards',
      'resetar cards',
      'reexibir dicas',
      'mostrar cards',
      'reiniciar dicas',
    ],
  },
  {
    id: 'swipe-navigation',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Navegação por Gesto',
    description: 'Arrastar horizontalmente para alternar entre as abas principais',
    icon: 'swipe',
    synonyms: ['gesto', 'swipe', 'deslizar', 'arrastar', 'navegar'],
    isMobileOnly: true,
  },
  {
    id: 'haptic-feedback',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Retorno Tátil (Vibração)',
    description: 'Vibrações ao tocar, alternar abas e confirmar ações no app',
    icon: 'mobile_vibrate',
    synonyms: ['vibração', 'vibrar', 'tátil', 'haptic', 'feedback', 'toque'],
    isMobileOnly: true,
  },
  {
    id: 'route-persistence',
    topicId: 'accessibility',
    topicTitle: 'Acessibilidade',
    title: 'Lembrar Última Tela',
    description: 'Restaurar a tela aberta ao fechar e reabrir o aplicativo',
    icon: 'history',
    synonyms: ['rota', 'lembrar', 'persistência', 'salvar tela', 'reabrir'],
  },

  // Preferências Operacionais (Non-Customer Only)
  {
    id: 'price-precision',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Precisão de Preços (Casas Decimais)',
    description: 'Definir exibição com 2, 3 ou 4 casas decimais para insumos fracionados',
    icon: 'numbers',
    synonyms: ['decimais', 'casas decimais', 'centavos', 'precisão', 'arredondamento', 'vírgula'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-overhead',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custos Fixos Padrão (Overhead)',
    description: 'Percentual padrão para rateio de água, luz, gás e despesas da cozinha',
    icon: 'calculate',
    synonyms: ['overhead', 'custo fixo', 'despesas', 'luz', 'gás', 'água', 'aluguel'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-profit-margin',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Margem de Lucro Padrão',
    description: 'Percentual de lucro sugerido automaticamente no cálculo de novas receitas',
    icon: 'trending_up',
    synonyms: ['lucro', 'margem', 'markup', 'ganho', 'porcentagem'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-hourly-labor',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custo de Mão de Obra',
    description: 'Valor padrão da hora de trabalho do confeiteiro para precificação',
    icon: 'manage_accounts',
    synonyms: ['mão de obra', 'salário', 'hora', 'trabalho', 'tempo'],
    isCustomerAllowed: false,
  },
  {
    id: 'default-packaging-cost',
    topicId: 'operational',
    topicTitle: 'Preferências Operacionais',
    title: 'Custo de Embalagem Padrão',
    description: 'Valor monetário sugerido para caixas, laços e embalagens de receitas',
    icon: 'inventory_2',
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
    icon: 'cleaning_services',
    synonyms: ['cache', 'limpar', 'armazenamento', 'memória', 'espaço', 'liberar'],
  },
  {
    id: 'clear-form-drafts',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Rascunhos de Formulários',
    description: 'Gerenciar e excluir rascunhos de receitas e cadastros não salvos',
    icon: 'edit_document',
    synonyms: ['rascunhos', 'draft', 'salvos', 'formulário', 'não salvo'],
  },
  {
    id: 'offline-recipes-downloads',
    topicId: 'storage',
    topicTitle: 'Dados e Armazenamento',
    title: 'Receitas Salvas Offline',
    description: 'Gerenciar receitas baixadas para acesso sem internet',
    icon: 'cloud_download',
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
    description: 'Plataforma, versão do sistema, status da conexão, ID do usuário e da sessão',
    icon: 'devices',
    synonyms: [
      'técnico',
      'id',
      'sessão',
      'conexão',
      'versão',
      'plataforma',
      'sistema',
      'so',
      'android',
      'ios',
    ],
  },
  {
    id: 'help-support',
    topicId: 'about',
    topicTitle: 'Sobre o Aplicativo',
    title: 'Ajuda & Suporte',
    description: 'Canais de atendimento, dúvidas frequentes e contato oficial',
    icon: 'help',
    synonyms: ['ajuda', 'suporte', 'contato', 'email', 'dúvidas', 'atendimento'],
  },
  {
    id: 'terms-privacy',
    topicId: 'about',
    topicTitle: 'Sobre o Aplicativo',
    title: 'Termos de Uso & Privacidade',
    description: 'Diretrizes de proteção de dados, política de privacidade e LGPD',
    icon: 'description',
    synonyms: ['termos', 'privacidade', 'lgpd', 'dados', 'segurança', 'política'],
  },
];

export interface FilterSettingShortcutsOptions {
  query: string;
  isDesktop: boolean;
  isCustomerRole: boolean;
  isBakerRole?: boolean;
}

export function filterSettingShortcuts({
  query,
  isDesktop,
  isCustomerRole,
  isBakerRole = false,
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
    if (item.isBakerOnly && !isBakerRole) {
      return false;
    }

    const hasTitleMatch = matchesSearch(item.title, trimmed);
    const hasTopicMatch = matchesSearch(item.topicTitle, trimmed);
    const hasDescriptionMatch = matchesSearch(item.description, trimmed);
    const hasSynonymMatch = item.synonyms.some((synonym) => matchesSearch(synonym, trimmed));

    return hasTitleMatch || hasTopicMatch || hasDescriptionMatch || hasSynonymMatch;
  });
}
