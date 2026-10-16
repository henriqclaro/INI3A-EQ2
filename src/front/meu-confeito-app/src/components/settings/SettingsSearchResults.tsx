import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { SettingShortcutItem } from '@/src/types/settings';

export interface SettingsSearchResultsProps {
  results: SettingShortcutItem[];
  searchQuery: string;
  onSelectShortcut: (shortcut: SettingShortcutItem) => void;
  onClearSearch: () => void;
}

export function SettingsSearchResults({
  results,
  searchQuery,
  onSelectShortcut,
  onClearSearch,
}: SettingsSearchResultsProps) {
  const { theme } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasResults = results.length > 0;

  if (!hasResults) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={36}
            color={theme.colors.onSurfaceVariant}
          />
        </View>

        <Text style={styles.emptyTitle}>Nenhuma configuração encontrada</Text>

        <Text style={styles.emptyDescription}>
          Não encontramos opções correspondentes a &quot;{searchQuery}&quot;. Tente buscar por
          outros termos como &quot;senha&quot;, &quot;tema&quot;, &quot;cache&quot; ou
          &quot;lucro&quot;.
        </Text>

        <TouchableOpacity
          style={styles.clearSearchBtn}
          onPress={onClearSearch}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <MaterialCommunityIcons name="close" size={16} color={theme.colors.primary} />
          <Text style={styles.clearSearchBtnText}>Limpar busca</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.resultsCountText}>
          {results.length} {results.length === 1 ? 'atalho encontrado' : 'atalhos encontrados'}
        </Text>
      </View>

      <View style={styles.listCard}>
        {results.map((shortcut, index) => {
          const isFirst = index === 0;
          const isLast = index === results.length - 1;
          const hasDivider = !isLast;

          return (
            <View key={shortcut.id} style={styles.itemWrapper}>
              <TouchableOpacity
                style={[styles.itemButton, isFirst && styles.firstItem, isLast && styles.lastItem]}
                onPress={() => onSelectShortcut(shortcut)}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={`${shortcut.title}, tópico ${shortcut.topicTitle}`}
                accessibilityHint={shortcut.description}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={shortcut.icon}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {shortcut.title}
                    </Text>
                    <View style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{shortcut.topicTitle}</Text>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {shortcut.description}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.placeholder}
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              {hasDivider && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: theme.spacing.space2,
    },
    headerRow: {
      paddingHorizontal: theme.spacing.space1,
      marginBottom: 2,
    },
    resultsCountText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    listCard: {
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
      minHeight: 68,
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
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 3,
      marginRight: theme.spacing.space2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    title: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      lineHeight: 20,
    },
    topicBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 7,
      paddingVertical: 1.5,
      borderRadius: theme.rounded.full,
    },
    topicBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
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
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: 42 + 16 + 12,
    },
    emptyContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.lg,
      padding: theme.spacing.space6,
      alignItems: 'center',
      gap: theme.spacing.space3,
      ...theme.shadows.soft,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    emptyTitle: {
      fontFamily: theme.typography.headlineMd.fontFamily,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.espressoDark,
      textAlign: 'center',
    },
    emptyDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 360,
    },
    clearSearchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing.space4,
      paddingVertical: theme.spacing.space2,
      borderRadius: theme.rounded.full,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginTop: theme.spacing.space1,
      minHeight: 44,
    },
    clearSearchBtnText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
