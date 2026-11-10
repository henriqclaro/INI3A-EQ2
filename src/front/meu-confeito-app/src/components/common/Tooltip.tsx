import { ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  type ViewInstance,
  ViewStyle,
} from 'react-native';

import { Portal } from 'react-native-paper';

import { useThemeMode } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@/src/theme/themes';

export type TooltipPosition = 'left' | 'right' | 'top' | 'bottom';

export interface TooltipProps {
  /** The text displayed inside the tooltip bubble */
  text: string;
  /** Child component that triggers the tooltip on hover or keyboard focus */
  children: ReactNode;
  /** Whether the tooltip is enabled to show (e.g. only when sidebar is collapsed) */
  isEnabled?: boolean;
  /** Preferred placement relative to the trigger element */
  position?: TooltipPosition;
  /** Distance in pixels between anchor and tooltip bubble */
  offset?: number;
  /** Delay before displaying the tooltip on mouse hover in ms */
  showDelay?: number;
  /** Delay before hiding the tooltip on mouse leave in ms */
  hideDelay?: number;
  /** Whether to render a subtle arrow pointing toward the anchor */
  hasArrow?: boolean;
  /** Optional container style for the wrapper trigger view */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional custom style for the tooltip bubble */
  bubbleStyle?: StyleProp<ViewStyle>;
  /** Optional custom style for the tooltip text */
  textStyle?: StyleProp<TextStyle>;
  /** Optional test identifier */
  testID?: string;
}

interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Tooltip({
  text,
  children,
  isEnabled = true,
  position = 'right',
  offset = 10,
  showDelay = 120,
  hideDelay = 100,
  hasArrow = true,
  containerStyle,
  bubbleStyle,
  textStyle,
  testID,
}: TooltipProps) {
  const { theme, isHighContrast } = useThemeMode();
  const tooltipId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const [isLayoutMeasured, setIsLayoutMeasured] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const anchorRef = useRef<ViewInstance | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [opacityAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.96));

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hideTooltipImmediately = useCallback(() => {
    clearTimers();
    setIsVisible(false);
    setIsLayoutMeasured(false);
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.96);
  }, [clearTimers, opacityAnim, scaleAnim]);

  // Synchronously measure on web when available, fallback to async on native
  const measureAnchor = useCallback((): AnchorRect | null => {
    const node = anchorRef.current;
    if (!node) {
      return null;
    }

    const webNode = node as unknown as HTMLElement;
    if (Platform.OS === 'web' && typeof webNode?.getBoundingClientRect === 'function') {
      const rect = webNode.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }

    return null;
  }, []);

  const measureAnchorAsync = useCallback((): Promise<AnchorRect | null> => {
    return new Promise((resolve) => {
      const syncRect = measureAnchor();
      if (syncRect) {
        resolve(syncRect);
        return;
      }

      const node = anchorRef.current;
      if (node && typeof node.measureInWindow === 'function') {
        node.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    });
  }, [measureAnchor]);

  const showTooltip = useCallback(
    (isImmediate = false) => {
      if (!isEnabled || !text) {
        return;
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      const executeShow = async () => {
        const rect = await measureAnchorAsync();
        if (rect) {
          setAnchorRect(rect);
          setIsVisible(true);
        }
      };

      if (isImmediate) {
        if (showTimerRef.current) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        executeShow();
      } else if (!showTimerRef.current) {
        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = null;
          executeShow();
        }, showDelay);
      }
    },
    [isEnabled, text, measureAnchorAsync, showDelay],
  );

  const hideTooltipWithDelay = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (!hideTimerRef.current) {
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        hideTooltipImmediately();
      }, hideDelay);
    }
  }, [hideDelay, hideTooltipImmediately]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Handle escape key, window scroll, and window resize on web (WCAG 2.1 1.4.13)
  useEffect(() => {
    if (!isVisible || Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltipImmediately();
      }
    };

    const handleScrollOrResize = () => {
      hideTooltipImmediately();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, hideTooltipImmediately]);

  // Fade-in & subtle scale animation when layout measurement finishes
  useEffect(() => {
    if (isVisible && isLayoutMeasured) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, isLayoutMeasured, opacityAnim, scaleAnim]);

  const handleTooltipLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTooltipSize({ width, height });
    setIsLayoutMeasured(true);
  }, []);

  // Compute tooltip position with collision detection & boundary clamping
  const computedLayout = useMemo(() => {
    if (!anchorRect) {
      return {
        top: 0,
        left: 0,
        actualPosition: position,
        arrowOffset: 0,
      };
    }

    const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
    const tooltipWidth = tooltipSize.width || 120;
    const tooltipHeight = tooltipSize.height || 32;

    let actualPosition = position;

    // Flip position if it would overflow the viewport boundary
    if (
      position === 'right' &&
      anchorRect.x + anchorRect.width + offset + tooltipWidth > windowWidth - 8
    ) {
      if (anchorRect.x - tooltipWidth - offset >= 8) {
        actualPosition = 'left';
      }
    } else if (position === 'left' && anchorRect.x - tooltipWidth - offset < 8) {
      if (anchorRect.x + anchorRect.width + offset + tooltipWidth <= windowWidth - 8) {
        actualPosition = 'right';
      }
    } else if (position === 'top' && anchorRect.y - tooltipHeight - offset < 8) {
      if (anchorRect.y + anchorRect.height + offset + tooltipHeight <= windowHeight - 8) {
        actualPosition = 'bottom';
      }
    } else if (
      position === 'bottom' &&
      anchorRect.y + anchorRect.height + offset + tooltipHeight > windowHeight - 8
    ) {
      if (anchorRect.y - tooltipHeight - offset >= 8) {
        actualPosition = 'top';
      }
    }

    let top = 0;
    let left = 0;

    switch (actualPosition) {
      case 'right':
        left = anchorRect.x + anchorRect.width + offset;
        top = anchorRect.y + (anchorRect.height - tooltipHeight) / 2;
        break;
      case 'left':
        left = anchorRect.x - tooltipWidth - offset;
        top = anchorRect.y + (anchorRect.height - tooltipHeight) / 2;
        break;
      case 'top':
        left = anchorRect.x + (anchorRect.width - tooltipWidth) / 2;
        top = anchorRect.y - tooltipHeight - offset;
        break;
      case 'bottom':
        left = anchorRect.x + (anchorRect.width - tooltipWidth) / 2;
        top = anchorRect.y + anchorRect.height + offset;
        break;
    }

    const clampedLeft = Math.max(8, Math.min(left, windowWidth - tooltipWidth - 8));
    const clampedTop = Math.max(8, Math.min(top, windowHeight - tooltipHeight - 8));

    // Calculate arrow offset aligned with anchor center
    let arrowOffset = 0;
    if (actualPosition === 'left' || actualPosition === 'right') {
      const anchorCenterY = anchorRect.y + anchorRect.height / 2;
      const rawArrowTop = anchorCenterY - clampedTop - 4;
      arrowOffset = Math.max(8, Math.min(rawArrowTop, tooltipHeight - 16));
    } else {
      const anchorCenterX = anchorRect.x + anchorRect.width / 2;
      const rawArrowLeft = anchorCenterX - clampedLeft - 4;
      arrowOffset = Math.max(8, Math.min(rawArrowLeft, tooltipWidth - 16));
    }

    return {
      top: clampedTop,
      left: clampedLeft,
      actualPosition,
      arrowOffset,
    };
  }, [anchorRect, tooltipSize, position, offset]);

  const styles = useMemo(() => createStyles(theme, isHighContrast), [theme, isHighContrast]);

  const arrowStyle = useMemo(() => {
    const { actualPosition, arrowOffset } = computedLayout;

    switch (actualPosition) {
      case 'right':
        return [styles.arrow, styles.arrowRight, { top: arrowOffset }];
      case 'left':
        return [styles.arrow, styles.arrowLeft, { top: arrowOffset }];
      case 'top':
        return [styles.arrow, styles.arrowTop, { left: arrowOffset }];
      case 'bottom':
        return [styles.arrow, styles.arrowBottom, { left: arrowOffset }];
    }
  }, [computedLayout, styles]);

  // Event handlers for trigger element
  const handlePointerEnter = useCallback(() => {
    showTooltip(false);
  }, [showTooltip]);

  const handlePointerLeave = useCallback(() => {
    hideTooltipWithDelay();
  }, [hideTooltipWithDelay]);

  const handleFocus = useCallback(() => {
    // Keyboard Tab focus shows immediately without delay
    showTooltip(true);
  }, [showTooltip]);

  const handleBlur = useCallback(() => {
    hideTooltipImmediately();
  }, [hideTooltipImmediately]);

  const handlePointerDown = useCallback(() => {
    hideTooltipImmediately();
  }, [hideTooltipImmediately]);

  const dynamicPortalStyle = useMemo(
    () => ({
      top: computedLayout.top,
      left: computedLayout.left,
      opacity: isLayoutMeasured ? opacityAnim : 0,
      transform: [{ scale: scaleAnim }],
    }),
    [computedLayout.top, computedLayout.left, isLayoutMeasured, opacityAnim, scaleAnim],
  );

  const isTooltipActive = isEnabled && isVisible && anchorRect !== null;

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      <View
        ref={anchorRef}
        collapsable={false}
        style={[styles.triggerWrapper, containerStyle]}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </View>

      {isTooltipActive && (
        <Portal>
          <Animated.View
            nativeID={tooltipId}
            testID={testID}
            accessibilityRole="none"
            pointerEvents="none"
            onLayout={handleTooltipLayout}
            style={[styles.portalContainer, dynamicPortalStyle]}
          >
            <View style={[styles.bubble, bubbleStyle]}>
              {hasArrow && <View style={arrowStyle} />}
              <Text style={[styles.text, textStyle]} numberOfLines={1}>
                {text}
              </Text>
            </View>
          </Animated.View>
        </Portal>
      )}
    </>
  );
}

const createStyles = (theme: AppTheme, isHighContrast: boolean) =>
  StyleSheet.create({
    triggerWrapper: {
      alignSelf: 'center',
    },
    portalContainer: {
      position: 'absolute',
      zIndex: 99999,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    bubble: {
      position: 'relative',
      backgroundColor: theme.colors.inverseSurface,
      borderRadius: theme.rounded.default,
      borderWidth: 1,
      borderColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
      paddingVertical: theme.spacing.space1 + 2,
      paddingHorizontal: theme.spacing.space3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.hover,
    },
    text: {
      fontFamily: theme.typography.labelMd.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.inverseOnSurface,
      letterSpacing: 0.3,
    },
    arrow: {
      position: 'absolute',
      width: 8,
      height: 8,
      backgroundColor: theme.colors.inverseSurface,
      transform: [{ rotate: '45deg' }],
    },
    arrowRight: {
      left: -4,
      borderLeftWidth: 1,
      borderBottomWidth: 1,
      borderColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
    },
    arrowLeft: {
      right: -4,
      borderRightWidth: 1,
      borderTopWidth: 1,
      borderColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
    },
    arrowTop: {
      bottom: -4,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
    },
    arrowBottom: {
      top: -4,
      borderLeftWidth: 1,
      borderTopWidth: 1,
      borderColor: isHighContrast ? theme.colors.outline : theme.colors.outlineVariant,
    },
  });
