import { ReactNode, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeMode } from '../contexts/ThemeContext';
import { AppTheme } from '../theme/themes';

export interface FloatingActionItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'neutral';
  accessibilityLabel?: string;
}

interface FloatingButtonProps {
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'neutral';
  actions?: FloatingActionItem[];
  isOpen?: boolean;
  onToggleOpen?: (isOpen: boolean) => void;
  accessibilityLabel?: string;
}

export const FloatingButton = ({
  onPress,
  children,
  containerStyle,
  style,
  variant = 'primary',
  actions,
  isOpen,
  onToggleOpen,
  accessibilityLabel,
}: FloatingButtonProps) => {
  const { theme } = useThemeMode();
  const [isInternalOpen, setIsInternalOpen] = useState(false);

  const hasActions = Boolean(actions && actions.length > 0);
  const isExpanded = isOpen !== undefined ? isOpen : isInternalOpen;

  const setExpanded = (nextState: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(nextState);
    } else {
      setIsInternalOpen(nextState);
    }
  };

  const handleMainPress = (event: GestureResponderEvent) => {
    if (hasActions) {
      setExpanded(!isExpanded);
    } else if (onPress) {
      onPress(event);
    }
  };

  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  const getActionColors = (actionVariant?: 'primary' | 'secondary' | 'neutral') => {
    switch (actionVariant) {
      case 'secondary':
        return {
          bg: theme.colors.surfaceContainerLowest,
          icon: theme.colors.primary,
          border: theme.colors.outlineVariant,
        };
      case 'neutral':
        return {
          bg: theme.colors.surfaceContainerLowest,
          icon: theme.colors.espressoDark,
          border: theme.colors.outlineVariant,
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.primary,
          icon: theme.colors.onPrimary,
          border: theme.colors.primary,
        };
    }
  };

  return (
    <View style={[styles.btnContainer, containerStyle]}>
      {hasActions && isExpanded && (
        <View style={styles.actionsWrapper}>
          {actions!.map((action) => {
            const actionColors = getActionColors(action.variant);

            return (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                onPress={() => {
                  setExpanded(false);
                  action.onPress();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel || action.label}
              >
                <View style={styles.actionLabelPill}>
                  <Text style={styles.actionLabelText}>{action.label}</Text>
                </View>
                <View
                  style={[
                    styles.actionMiniFab,
                    {
                      backgroundColor: actionColors.bg,
                      borderColor: actionColors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={action.icon} size={22} color={actionColors.icon} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handleMainPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || (isExpanded ? 'Fechar menu de ações' : 'Ações de receita')
        }
      >
        {hasActions ? (
          isExpanded ? (
            <MaterialCommunityIcons
              name="close"
              size={26}
              color={variant === 'secondary' ? theme.colors.primary : theme.colors.onPrimary}
            />
          ) : (
            children || (
              <MaterialCommunityIcons
                name="cake-variant-outline"
                size={26}
                color={variant === 'secondary' ? theme.colors.primary : theme.colors.onPrimary}
              />
            )
          )
        ) : (
          children
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme, variant?: 'primary' | 'secondary' | 'neutral') => {
  const isSecondary = variant === 'secondary';
  const isNeutral = variant === 'neutral';

  const buttonBg = isSecondary
    ? theme.colors.secondaryContainer
    : isNeutral
      ? theme.colors.surfaceContainerLowest
      : theme.colors.primary;

  const buttonBorder = isSecondary
    ? theme.colors.secondaryContainer
    : isNeutral
      ? theme.colors.outlineVariant
      : theme.colors.primary;

  return StyleSheet.create({
    btnContainer: {
      position: 'absolute',
      alignItems: 'flex-end',
      zIndex: 50,
    },
    actionsWrapper: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: theme.spacing.space3,
      marginBottom: theme.spacing.space3,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
    },
    actionLabelPill: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.rounded.full,
      paddingVertical: theme.spacing.space2,
      paddingHorizontal: theme.spacing.space4,
      ...Platform.select({
        android: {
          elevation: 3,
        },
        default: {
          shadowColor: theme.colors.espressoDark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
      }),
    },
    actionLabelText: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.espressoDark,
    },
    actionMiniFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        default: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        },
      }),
    },
    button: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: buttonBg,
      borderWidth: 1,
      borderColor: buttonBorder,
      borderRadius: 28,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        default: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        },
      }),
    },
  });
};
