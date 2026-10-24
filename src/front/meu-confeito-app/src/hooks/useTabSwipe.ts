import { useCallback, useEffect, useRef } from 'react';
import { GestureResponderEvent, Keyboard, Platform, useWindowDimensions } from 'react-native';

import { Href, router } from 'expo-router';

import { useSettings } from '../contexts/SettingsContext';

interface UseTabSwipeOptions {
  activeTab: string;
  isCustomerRole: boolean;
}

export function useTabSwipe({ activeTab, isCustomerRole }: UseTabSwipeOptions) {
  const { isSwipeNavigationEnabled, triggerHaptic } = useSettings();
  const { height: windowHeight } = useWindowDimensions();

  const isTransitioningRef = useRef(false);
  const isKeyboardVisibleRef = useRef(false);
  const isSwipeNavigationEnabledRef = useRef(isSwipeNavigationEnabled);
  const startCoordsRef = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });

  const activeTabRef = useRef(activeTab);
  const isCustomerRoleRef = useRef(isCustomerRole);
  const windowHeightRef = useRef(windowHeight);

  useEffect(() => {
    isSwipeNavigationEnabledRef.current = isSwipeNavigationEnabled;
  }, [isSwipeNavigationEnabled]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    isCustomerRoleRef.current = isCustomerRole;
  }, [isCustomerRole]);

  useEffect(() => {
    windowHeightRef.current = windowHeight;
  }, [windowHeight]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardVisibleRef.current = true;
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardVisibleRef.current = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onStartShouldSetResponderCapture = useCallback((evt: GestureResponderEvent) => {
    const touch =
      evt.nativeEvent.touches?.[0] || evt.nativeEvent.changedTouches?.[0] || evt.nativeEvent;

    startCoordsRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    return false;
  }, []);

  const onMoveShouldSetResponderCapture = useCallback((evt: GestureResponderEvent) => {
    if (
      Platform.OS === 'web' ||
      !isSwipeNavigationEnabledRef.current ||
      isKeyboardVisibleRef.current ||
      isTransitioningRef.current
    ) {
      return false;
    }

    const touch =
      evt.nativeEvent.touches?.[0] || evt.nativeEvent.changedTouches?.[0] || evt.nativeEvent;

    if (startCoordsRef.current.time === 0) {
      startCoordsRef.current = {
        x: touch.pageX,
        y: touch.pageY,
        time: Date.now(),
      };
      return false;
    }

    const pageY = touch.pageY;
    const currentHeight = windowHeightRef.current;
    const isAboveTabBar = currentHeight <= 0 || pageY < currentHeight - 80;
    const isBelowHeader = pageY > 64;

    if (!isAboveTabBar || !isBelowHeader) {
      return false;
    }

    const dx = touch.pageX - startCoordsRef.current.x;
    const dy = touch.pageY - startCoordsRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const isHorizontalSwipe = absDx > 20 && absDx > absDy * 2.5 && absDy < 30;

    return isHorizontalSwipe;
  }, []);

  const onResponderRelease = useCallback(
    (evt: GestureResponderEvent) => {
      if (isTransitioningRef.current) {
        startCoordsRef.current = { x: 0, y: 0, time: 0 };
        return;
      }

      const touch =
        evt.nativeEvent.touches?.[0] || evt.nativeEvent.changedTouches?.[0] || evt.nativeEvent;

      const dx = touch.pageX - startCoordsRef.current.x;
      const dt = Math.max(1, Date.now() - startCoordsRef.current.time);
      const vx = dx / dt;

      startCoordsRef.current = { x: 0, y: 0, time: 0 };

      const isSwipeLeft = dx < -45 || (dx < -25 && vx < -0.3);
      const isSwipeRight = dx > 45 || (dx > 25 && vx > 0.3);

      if (!isSwipeLeft && !isSwipeRight) {
        return;
      }

      const tabs = isCustomerRoleRef.current
        ? ['home', 'profile']
        : ['home', 'recipes', 'analytics', 'profile'];

      const currentTab = activeTabRef.current;
      const currentIndex = tabs.indexOf(currentTab);

      if (currentIndex === -1) {
        return;
      }

      const targetIndex = isSwipeLeft ? currentIndex + 1 : currentIndex - 1;

      if (targetIndex >= 0 && targetIndex < tabs.length && targetIndex !== currentIndex) {
        const nextTab = tabs[targetIndex];
        isTransitioningRef.current = true;
        activeTabRef.current = nextTab;

        triggerHaptic('selection');

        router.navigate(`/(tabs)/${nextTab}` as Href);

        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 350);
      }
    },
    [triggerHaptic],
  );

  const onResponderTerminate = useCallback(() => {
    startCoordsRef.current = { x: 0, y: 0, time: 0 };
  }, []);

  return {
    onStartShouldSetResponderCapture,
    onMoveShouldSetResponderCapture,
    onMoveShouldSetResponder: onMoveShouldSetResponderCapture,
    onResponderTerminationRequest: () => false,
    onResponderRelease,
    onResponderTerminate,
  };
}
