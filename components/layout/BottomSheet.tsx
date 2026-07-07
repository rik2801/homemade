import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useEffect } from "react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme/spacing";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(height);

  useEffect(() => {
    if (!visible) {
      translateY.value = height;
      return;
    }
    translateY.value = withSpring(0, { damping: 22, stiffness: 210 });
  }, [height, translateY, visible]);

  function closeSheet() {
    translateY.value = withTiming(height, { duration: 180 }, () => runOnJS(onClose)());
  }

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 90 || event.velocityY > 700) {
        translateY.value = withTiming(height, { duration: 170 }, () => runOnJS(onClose)());
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 210 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={closeSheet}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close sheet" style={styles.backdrop} onPress={closeSheet} />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                maxHeight: height * 0.88
              }
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Animated.Text style={[styles.title, { color: colors.text }]}>{title}</Animated.Text>
                {subtitle ? (
                  <Animated.Text style={[styles.subtitle, { color: colors.muted }]}>
                    {subtitle}
                  </Animated.Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={closeSheet}
                style={[styles.closeButton, { backgroundColor: colors.canvas }]}
              >
                <Animated.Text style={[styles.closeLabel, { color: colors.muted }]}>×</Animated.Text>
              </Pressable>
            </View>
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17, 24, 39, 0.32)"
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  handle: {
    alignSelf: "center",
    borderRadius: radius.pill,
    height: 5,
    marginBottom: spacing.md,
    width: 46
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    paddingRight: spacing.sm
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  closeLabel: {
    fontSize: 22,
    lineHeight: 22
  },
  body: {
    gap: spacing.md
  }
});
