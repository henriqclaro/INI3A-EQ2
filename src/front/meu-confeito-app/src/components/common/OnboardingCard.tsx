import { useMemo } from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useOnboarding } from '@/src/contexts/OnboardingContext';
import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export interface OnboardingCardProps {
  id: string;
  title: string;
  description: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionText?: string;
  onPress?: () => void;
  onDismiss?: () => void;
  isHero?: boolean;
  isCompact?: boolean;
  isDismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OnboardingCard({
  id,
  title,
  description,
  icon,
  actionText,
  onPress,
  onDismiss,
  isHero = false,
  isCompact = false,
  isDismissible = true,
  style,
  testID,
}: OnboardingCardProps) {
  const { theme } = useThemeMode();
  const { isCardDismissed, dismissCard } = useOnboarding();

  const styles = useMemo(() => createStyles(theme, isHero, isCompact), [theme, isHero, isCompact]);

  // If the card was previously dismissed by the user, do not render
  if (isCardDismissed(id)) {
    return null;
  }

  const handleCardPress = async () => {
    // Dismiss automatically upon interaction
    await dismissCard(id);
    if (onPress) {
      onPress();
    }
  };

  const handleDismissPress = async (e: GestureResponderEvent) => {
    e.stopPropagation?.();
    await dismissCard(id);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      {/* Main card content touchable - NOT wrapping the close button to prevent nested buttons on Web */}
      <TouchableOpacity
        style={styles.contentTouchable}
        onPress={handleCardPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
        accessibilityHint={
          actionText ? `Toque para ${actionText}` : 'Toque para abrir e dispensar esta dica'
        }
      >
        <View style={styles.mainRow}>
          {icon ? (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={icon}
                size={isHero ? 26 : isCompact ? 16 : 20}
                color={theme.colors.primary}
              />
            </View>
          ) : null}

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={isHero ? 2 : isCompact ? 2 : 1}>
              {title}
            </Text>
            <Text style={styles.description} numberOfLines={isHero ? 4 : isCompact ? 3 : 3}>
              {description}
            </Text>
          </View>
        </View>

        {actionText ? (
          <View style={styles.footerRow}>
            <Text style={styles.actionText}>{actionText}</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={isCompact ? 13 : 16}
              color={theme.colors.primary}
            />
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Sibling close button: avoids nested button HTML validation errors on Web */}
      {isDismissible ? (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismissPress}
          hitSlop={
            isCompact
              ? { top: 6, bottom: 6, left: 6, right: 6 }
              : { top: 8, bottom: 8, left: 8, right: 8 }
          }
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Dispensar card de dica"
          accessibilityHint="Fecha este card permanentemente"
        >
          <MaterialCommunityIcons
            name="close"
            size={isCompact ? 15 : 18}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme, isHero: boolean, isCompact: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: isHero ? theme.rounded.xl : isCompact ? theme.rounded.md : theme.rounded.lg,
      position: 'relative',
      overflow: 'hidden',
      ...theme.shadows.soft,
    },
    contentTouchable: {
      width: '100%',
      padding: isHero ? theme.spacing.space5 : isCompact ? 10 : theme.spacing.space4,
      paddingRight: isCompact ? 36 : isHero ? 48 : 44, // Leave room for top-right close button
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: isHero ? 48 : isCompact ? 28 : 38,
      height: isHero ? 48 : isCompact ? 28 : 38,
      borderRadius: isHero
        ? theme.rounded.lg
        : isCompact
          ? theme.rounded.sm
          : theme.rounded.default,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isCompact ? 8 : theme.spacing.space3,
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
      gap: isCompact ? 2 : 3,
      justifyContent: 'center',
    },
    title: {
      fontFamily: isHero
        ? theme.typography.headlineMd.fontFamily
        : theme.typography.bodyMd.fontFamily,
      fontSize: isHero ? 18 : isCompact ? 13 : 15,
      fontWeight: '700',
      color: theme.colors.espressoDark,
      letterSpacing: isHero ? 0.3 : 0,
      lineHeight: isHero ? 24 : isCompact ? 17 : 20,
    },
    description: {
      fontFamily: theme.typography.bodySm.fontFamily,
      fontSize: isHero ? 13 : isCompact ? 11.5 : 12.5,
      lineHeight: isHero ? 19 : isCompact ? 15 : 17,
      color: theme.colors.onSurfaceVariant,
    },
    closeButton: {
      position: 'absolute',
      top: isCompact ? 4 : 2,
      right: isCompact ? 4 : 2,
      width: isCompact ? 32 : 44,
      height: isCompact ? 32 : 44,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isCompact ? 4 : 6,
      marginTop: isCompact ? 6 : theme.spacing.space3,
      paddingTop: isCompact ? 4 : theme.spacing.space2,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    actionText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: isHero ? 13 : isCompact ? 11 : 12,
      fontWeight: '700',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: isCompact ? 0.3 : 0.5,
    },
  });
