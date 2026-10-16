import { useMemo } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { SettingsTopicId, SettingsTopicItem } from '@/src/types/settings';

export interface SettingsSidebarProps {
  topics: SettingsTopicItem[];
  selectedTopicId: SettingsTopicId;
  onSelectTopic: (topicId: SettingsTopicId) => void;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSidebar({
  topics,
  selectedTopicId,
  onSelectTopic,
  style,
}: SettingsSidebarProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.sidebar, style]}>
      {/* Docked Scrollable Topics List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.topicsList}
        style={styles.scrollArea}
      >
        {topics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;

          return (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.navItem,
                isSelected && styles.navItemActive,
                topic.isDestructive && isSelected && styles.navItemDestructiveActive,
              ]}
              onPress={() => onSelectTopic(topic.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={topic.title}
            >
              {isSelected && (
                <View
                  style={[
                    styles.activeIndicator,
                    topic.isDestructive && styles.activeIndicatorDestructive,
                  ]}
                />
              )}

              <View style={styles.iconSlot}>
                <MaterialCommunityIcons
                  name={topic.icon}
                  size={20}
                  color={
                    topic.isDestructive
                      ? isSelected
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant
                      : isSelected
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                  }
                />
              </View>

              <Text
                style={[
                  styles.navLabel,
                  isSelected && styles.navLabelActive,
                  topic.isDestructive && isSelected && styles.navLabelDestructiveActive,
                ]}
                numberOfLines={1}
              >
                {topic.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    sidebar: {
      width: 300,
      height: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
    },
    scrollArea: {
      flex: 1,
    },
    topicsList: {
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: theme.spacing.space3,
      gap: theme.spacing.space2,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50,
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: theme.spacing.space2,
      borderRadius: theme.rounded.md,
      gap: theme.spacing.space3,
      position: 'relative',
    },
    navItemActive: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    navItemDestructiveActive: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.errorContainer,
    },
    activeIndicator: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: 3.5,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.primary,
    },
    activeIndicatorDestructive: {
      backgroundColor: theme.colors.error,
    },
    iconSlot: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    navLabelActive: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontWeight: '700',
      color: theme.colors.espressoDark,
    },
    navLabelDestructiveActive: {
      color: theme.colors.error,
    },
  });
