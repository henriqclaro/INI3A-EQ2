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
