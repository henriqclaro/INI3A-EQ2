import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type SettingsTopicId =
  | 'account'
  | 'appearance'
  | 'interaction'
  | 'operational'
  | 'storage'
  | 'about';

export interface SettingsTopicItem {
  id: SettingsTopicId;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isDestructive?: boolean;
  isVisible?: boolean;
}

export interface SettingShortcutItem {
  id: string;
  topicId: SettingsTopicId;
  topicTitle: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  synonyms: string[];
  isDesktopOnly?: boolean;
  isMobileOnly?: boolean;
  isCustomerAllowed?: boolean;
  isBakerOnly?: boolean;
}
