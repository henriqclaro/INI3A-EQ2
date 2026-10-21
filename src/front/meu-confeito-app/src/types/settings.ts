import { MaterialSymbolName } from './materialSymbols';

export type SettingsTopicId =
  | 'account'
  | 'appearance'
  | 'interaction'
  | 'accessibility'
  | 'operational'
  | 'storage'
  | 'about';

export interface SettingsTopicItem {
  id: SettingsTopicId;
  title: string;
  description: string;
  icon: MaterialSymbolName;
  isDestructive?: boolean;
  isVisible?: boolean;
}

export interface SettingShortcutItem {
  id: string;
  topicId: SettingsTopicId;
  topicTitle: string;
  title: string;
  description: string;
  icon: MaterialSymbolName;
  synonyms: string[];
  isDesktopOnly?: boolean;
  isMobileOnly?: boolean;
  isCustomerAllowed?: boolean;
  isBakerOnly?: boolean;
}
