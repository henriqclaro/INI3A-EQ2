import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { router } from 'expo-router';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { OnboardingCard } from '@/src/components/common/OnboardingCard';
import { SettingsSearchBar } from '@/src/components/settings/SettingsSearchBar';
import { filterSettingShortcuts } from '@/src/constants/settingsShortcuts';
import { useOnboarding } from '@/src/contexts/OnboardingContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';
import { SettingShortcutItem, SettingsTopicId, SettingsTopicItem } from '@/src/types/settings';

export interface SettingsSidebarProps {
  topics: SettingsTopicItem[];
  selectedTopicId: SettingsTopicId;
  onSelectTopic: (topicId: SettingsTopicId) => void;
  isCustomerRole?: boolean;
  isBakerRole?: boolean;
  onSelectShortcut?: (shortcut: SettingShortcutItem) => void;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSidebar({
  topics,
  selectedTopicId,
  onSelectTopic,
  isCustomerRole = false,
  isBakerRole = false,
  onSelectShortcut,
  style,
}: SettingsSidebarProps) {
  const { theme, isHighContrast } = useThemeMode();
  const { isCardDismissed } = useOnboarding();
  const styles = useMemo(() => createStyles(theme, isHighContrast), [theme, isHighContrast]);

  const hasVisibleSidebarCards =
    !isCardDismissed('settings_appearance') ||
    (!isCustomerRole && !isCardDismissed('settings_operational')) ||
    !isCardDismissed('settings_edit_profile');

  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    return filterSettingShortcuts({
      query: searchQuery,
      isDesktop: true,
      isCustomerRole,
      isBakerRole,
    });
  }, [searchQuery, isCustomerRole, isBakerRole]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  const handleSelectShortcut = (shortcut: SettingShortcutItem) => {
    onSelectTopic(shortcut.topicId);
    if (onSelectShortcut) {
      onSelectShortcut(shortcut);
    }
    setSearchQuery('');
  };

  return (
    <View style={[styles.sidebar, style]}>
      {/* Embedded Search Box at top of lateral menu */}
      <View style={styles.searchSection}>
        <SettingsSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Buscar opções..."
          isDense={true}
          hasShadow={false}
        />

        {/* Dropdown Menu attached to search box */}
        {hasSearchQuery && (
          <View style={styles.dropdownContainer}>
            {searchResults.length > 0 ? (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.dropdownScroll}
              >
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectShortcut(item)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, tópico ${item.topicTitle}`}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={styles.dropdownIconBox}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>

                      <View style={styles.dropdownTextCol}>
                        <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.dropdownMetaRow}>
                          <View style={styles.dropdownTopicBadge}>
                            <Text style={styles.dropdownTopicBadgeText}>{item.topicTitle}</Text>
                          </View>
                          <Text style={styles.dropdownItemDescription} numberOfLines={1}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.dropdownEmpty}>
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={20}
                  color={theme.colors.placeholder}
                />
                <Text style={styles.dropdownEmptyText}>
                  Nenhuma opção encontrada para &quot;{searchQuery}&quot;
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Docked Scrollable Topics List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.topicsList}
        style={styles.scrollArea}
      >
        {/* Discovery & learning cards inside options container, below search box */}
        {!hasSearchQuery && hasVisibleSidebarCards && (
          <View style={styles.sidebarCardsWrapper}>
            <OnboardingCard
              id="settings_appearance"
              icon="palette-outline"
              title="Aparência Visual"
              description="Personalize cores, alto contraste e tema OLED."
              actionText="Ajustar Tema"
              isCompact={true}
              onPress={() => onSelectTopic('appearance')}
            />
            {!isCustomerRole && (
              <OnboardingCard
                id="settings_operational"
                icon="tune-variant"
                title="Preferências Operacionais"
                description="Defina margens de lucro padrão e custos fixos."
                actionText="Configurar Padrões"
                isCompact={true}
                onPress={() => onSelectTopic('operational')}
              />
            )}
            <OnboardingCard
              id="settings_edit_profile"
              icon="account-edit-outline"
              title="Complete seu Perfil"
              description="Atualize fotos, dados cadastrais e telefone."
              actionText="Editar Perfil"
              isCompact={true}
              onPress={() => router.push('/edit-profile')}
            />
          </View>
        )}

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

const createStyles = (theme: AppTheme, isHighContrast: boolean) =>
  StyleSheet.create({
    sidebar: {
      width: 300,
      height: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      zIndex: 20,
    },
    searchSection: {
      paddingHorizontal: theme.spacing.space3,
      paddingTop: theme.spacing.space3,
      paddingBottom: theme.spacing.space2,
      position: 'relative',
      zIndex: 50,
      borderBottomWidth: isHighContrast ? 1 : 0,
      borderBottomColor: theme.colors.outlineVariant,
    },
    dropdownContainer: {
      position: 'absolute',
      top: '100%',
      left: theme.spacing.space3,
      right: theme.spacing.space3,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.md,
      marginTop: 4,
      maxHeight: 280,
      overflow: 'hidden',
      zIndex: 100,
      ...theme.shadows.modal,
    },
    dropdownScroll: {
      maxHeight: 280,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.space3,
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      gap: 8,
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    dropdownIconBox: {
      width: 30,
      height: 30,
      borderRadius: theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownTextCol: {
      flex: 1,
      gap: 2,
    },
    dropdownItemTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    dropdownMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dropdownTopicBadge: {
      backgroundColor: theme.colors.chips.secondary.background,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.rounded.full,
    },
    dropdownTopicBadgeText: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.chips.secondary.text,
    },
    dropdownItemDescription: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    dropdownEmpty: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dropdownEmptyText: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: 12,
      color: theme.colors.placeholder,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    scrollArea: {
      flex: 1,
    },
    topicsList: {
      paddingHorizontal: theme.spacing.space3,
      paddingVertical: theme.spacing.space3,
      gap: theme.spacing.space2,
    },
    sidebarCardsWrapper: {
      gap: theme.spacing.space2,
      marginBottom: theme.spacing.space2,
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
