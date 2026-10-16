import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { SettingsTopicId, SettingsTopicItem } from '@/src/types/settings';

export interface SettingsTopicListProps {
  topics: SettingsTopicItem[];
  selectedTopicId?: SettingsTopicId | null;
  onSelectTopic: (topicId: SettingsTopicId) => void;
}

export function SettingsTopicList({ topics, onSelectTopic }: SettingsTopicListProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {topics.map((topic, index) => {
        const isFirst = index === 0;
        const isLast = index === topics.length - 1;
        const isAboutTopic = topic.id === 'about';
        const hasDivider = !isLast;

        return (
          <View key={topic.id} style={styles.itemWrapper}>
            <TouchableOpacity
              style={[
                styles.itemButton,
                isFirst && styles.firstItem,
                isLast && styles.lastItem,
                topic.isDestructive && styles.destructiveItem,
                isAboutTopic && styles.aboutItemButton,
              ]}
              onPress={() => onSelectTopic(topic.id)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel={topic.title}
              accessibilityHint={topic.description}
            >
              <View
                style={[
                  styles.iconContainer,
                  topic.isDestructive && styles.destructiveIconContainer,
                ]}
              >
                <MaterialCommunityIcons
                  name={topic.icon}
                  size={22}
                  color={topic.isDestructive ? theme.colors.error : theme.colors.primary}
                />
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[styles.title, topic.isDestructive && styles.destructiveTitle]}
                  numberOfLines={1}
                >
                  {topic.title}
                </Text>
                <Text
                  style={[styles.description, isAboutTopic && styles.aboutDescription]}
                  numberOfLines={2}
                >
                  {topic.description}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={topic.isDestructive ? theme.colors.error : theme.colors.placeholder}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>

            {hasDivider && <View style={styles.divider} />}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      width: '100%',
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    itemWrapper: {
      width: '100%',
    },
    itemButton: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 64,
      paddingVertical: theme.spacing.space3,
      paddingHorizontal: theme.spacing.space4,
      width: '100%',
    },
    firstItem: {
      borderTopLeftRadius: theme.rounded.lg,
      borderTopRightRadius: theme.rounded.lg,
    },
    lastItem: {
      borderBottomLeftRadius: theme.rounded.lg,
      borderBottomRightRadius: theme.rounded.lg,
    },
    destructiveItem: {
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.space3,
    },
    destructiveIconContainer: {
      backgroundColor: theme.colors.errorContainer,
      borderColor: theme.colors.errorContainer,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 2,
      marginRight: theme.spacing.space2,
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 20,
    },
    destructiveTitle: {
      color: theme.colors.error,
    },
    description: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 17,
    },
    chevronIcon: {
      marginLeft: theme.spacing.space1,
    },
    aboutItemButton: {
      minHeight: 80,
    },
    aboutDescription: {
      minHeight: 34,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: 42 + 16 + 12, // Inset divider aligned with text content
    },
  });
