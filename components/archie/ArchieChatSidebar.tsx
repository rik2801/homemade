import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { MAX_SESSIONS } from "@/lib/archieSessionStorage";
import { useAppStore } from "@/store/useAppStore";
import type { ArchieChatSession } from "@/types/recipe";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

const PANEL_WIDTH = 300;

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

function relativeTime(timestamp: number): string {
  const deltaMs = Date.now() - timestamp;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sessionPreview(session: ArchieChatSession): string {
  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index];
    if (message.text) return message.text;
    if (message.structuredResponse?.summary) return message.structuredResponse.summary;
  }
  return "No messages yet";
}

export function ArchieChatSidebar() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const visible = useAppStore((state) => state.archieSidebarOpen);
  const sessions = useAppStore((state) => state.archieSessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const closeArchieSidebar = useAppStore((state) => state.closeArchieSidebar);
  const switchSession = useAppStore((state) => state.switchSession);
  const deleteSession = useAppStore((state) => state.deleteSession);

  const translateX = useSharedValue(-PANEL_WIDTH);

  useEffect(() => {
    if (!visible) {
      translateX.value = -PANEL_WIDTH;
      return;
    }
    translateX.value = withSpring(0, { damping: 24, stiffness: 240 });
  }, [translateX, visible]);

  function closePanel() {
    translateX.value = withTiming(-PANEL_WIDTH, { duration: 160 }, () =>
      runOnJS(closeArchieSidebar)()
    );
  }

  async function handleSelect(sessionId: string) {
    await Haptics.selectionAsync();
    switchSession(sessionId);
  }

  async function handleDelete(sessionId: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteSession(sessionId);
  }

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const ordered = [...sessions].sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={closePanel}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close chat list"
          style={styles.backdrop}
          onPress={closePanel}
        />
        <Animated.View
          style={[
            styles.panel,
            panelStyle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingTop: insets.top + spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              maxHeight: height
            }
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.headerTitle}>Chats</AppText>
            <AppText style={[styles.headerCount, { color: colors.faint }]}>
              {sessions.length}/{MAX_SESSIONS}
            </AppText>
          </View>
          <AppText muted style={styles.headerHint}>
            Chats are kept for 24 hours, up to {MAX_SESSIONS} at a time.
          </AppText>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {ordered.length === 0 ? (
              <AppText muted style={styles.empty}>
                No chats yet. Start one from the composer below.
              </AppText>
            ) : (
              ordered.map((session) => {
                const isActive = session.id === activeSessionId;
                const isSwap = session.kind === "recipe_swap";

                return (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    onPress={() => handleSelect(session.id)}
                    style={[
                      styles.row,
                      {
                        borderColor: isActive ? colors.brandBorder : colors.border,
                        backgroundColor: isActive ? colors.brandSoft : colors.canvas
                      }
                    ]}
                  >
                    <View style={styles.rowBody}>
                      <View style={styles.rowTitleLine}>
                        <AppText numberOfLines={1} style={styles.rowTitle}>
                          {session.title}
                        </AppText>
                      </View>
                      <AppText numberOfLines={1} muted style={styles.rowPreview}>
                        {sessionPreview(session)}
                      </AppText>
                      <View style={styles.rowMeta}>
                        <View
                          style={[
                            styles.kindBadge,
                            {
                              backgroundColor: isSwap ? colors.brandSoft : colors.surface,
                              borderColor: isSwap ? colors.brandBorder : colors.borderLight
                            }
                          ]}
                        >
                          <AppText
                            style={[
                              styles.kindText,
                              { color: isSwap ? colors.brandOnBrand : colors.muted }
                            ]}
                          >
                            {isSwap ? "Recipe swap" : "General"}
                          </AppText>
                        </View>
                        <AppText style={[styles.rowTime, { color: colors.faint }]}>
                          {relativeTime(session.lastAccessedAt)}
                        </AppText>
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete chat ${session.title}`}
                      hitSlop={8}
                      onPress={() => handleDelete(session.id)}
                      style={styles.deleteBtn}
                    >
                      <TrashIcon color={colors.faint} />
                    </Pressable>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row"
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17, 24, 39, 0.42)"
  },
  panel: {
    borderRightWidth: 1,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    height: "100%",
    paddingHorizontal: spacing.md,
    width: PANEL_WIDTH
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  headerTitle: {
    fontFamily,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3
  },
  headerCount: {
    fontFamily,
    fontSize: 13,
    fontWeight: "600"
  },
  headerHint: {
    fontFamily,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg
  },
  empty: {
    fontFamily,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: spacing.md
  },
  row: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  rowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  rowTitleLine: {
    flexDirection: "row"
  },
  rowTitle: {
    flex: 1,
    fontFamily,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1
  },
  rowPreview: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16
  },
  rowMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2
  },
  kindBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  kindText: {
    fontFamily,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  rowTime: {
    fontFamily,
    fontSize: 11
  },
  deleteBtn: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  }
});
