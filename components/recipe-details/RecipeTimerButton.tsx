import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { RECIPE_DETAILS_COLORS } from "./recipeDetailsColors";
import { recipeDetailsStyles as shared } from "./recipeDetails.styles";

type RecipeTimerButtonProps = {
  cookTime: string;
  recipeTitle: string;
};

type TimerPhase = "idle" | "running" | "paused" | "finished";

function parseCookTimeToSeconds(cookTime: string): number {
  const normalized = cookTime.trim().toLowerCase();
  const hourMatch = normalized.match(/(\d+)\s*h/);
  const minMatch = normalized.match(/(\d+)\s*m/);
  const bareMatch = normalized.match(/^(\d+)$/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minMatch ? Number(minMatch[1]) : bareMatch ? Number(bareMatch[1]) : 0;
  const total = hours * 3600 + minutes * 60;
  return total > 0 ? total : 25 * 60;
}

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function TimerIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 2h6" strokeLinecap="round" />
    </Svg>
  );
}

function PauseIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={color}>
      <Rect x={6} y={5} width={4} height={14} rx={1} />
      <Rect x={14} y={5} width={4} height={14} rx={1} />
    </Svg>
  );
}

function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill={color}>
      <Path d="M8 5v14l11-7z" />
    </Svg>
  );
}

function ResetIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2}>
      <Path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <Path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RecipeTimerButton({ cookTime, recipeTitle }: RecipeTimerButtonProps) {
  const durationSeconds = parseCookTimeToSeconds(cookTime);
  const endAtRef = useRef<number | null>(null);
  const remainingMsRef = useRef(durationSeconds * 1000);
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);

  useEffect(() => {
    endAtRef.current = null;
    remainingMsRef.current = durationSeconds * 1000;
    setPhase("idle");
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds, recipeTitle]);

  useEffect(() => {
    if (phase !== "running" || endAtRef.current === null) return;

    const tick = () => {
      const leftMs = Math.max(0, endAtRef.current! - Date.now());
      remainingMsRef.current = leftMs;
      setRemainingSeconds(Math.ceil(leftMs / 1000));
      if (leftMs <= 0) {
        endAtRef.current = null;
        setPhase("finished");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase]);

  async function handleStart() {
    await Haptics.selectionAsync();
    remainingMsRef.current = durationSeconds * 1000;
    endAtRef.current = Date.now() + durationSeconds * 1000;
    setRemainingSeconds(durationSeconds);
    setPhase("running");
  }

  async function handlePauseToggle() {
    await Haptics.selectionAsync();
    if (phase === "running") {
      const leftMs = Math.max(0, (endAtRef.current ?? Date.now()) - Date.now());
      remainingMsRef.current = leftMs;
      endAtRef.current = null;
      setRemainingSeconds(Math.ceil(leftMs / 1000));
      setPhase("paused");
      return;
    }

    if (phase === "paused") {
      endAtRef.current = Date.now() + remainingMsRef.current;
      setPhase("running");
    }
  }

  async function handleReset() {
    await Haptics.selectionAsync();
    endAtRef.current = null;
    remainingMsRef.current = durationSeconds * 1000;
    setRemainingSeconds(durationSeconds);
    setPhase("idle");
  }

  async function handleRestart() {
    await Haptics.selectionAsync();
    remainingMsRef.current = durationSeconds * 1000;
    endAtRef.current = Date.now() + durationSeconds * 1000;
    setRemainingSeconds(durationSeconds);
    setPhase("running");
  }

  if (phase === "idle") {
    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${cookTime} cooking timer`}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
        >
          <TimerIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
          <AppText style={styles.startLabel}>Start timer</AppText>
        </Pressable>
      </View>
    );
  }

  const isPaused = phase === "paused";
  const isFinished = phase === "finished";

  return (
    <View style={styles.wrap}>
      <View style={styles.activeRow}>
        <View style={[shared.outlineButton, styles.button, styles.timeChip]}>
          <TimerIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
          <AppText
            accessibilityRole="text"
            accessibilityLabel={
              isFinished
                ? "Timer finished"
                : `Cooking timer ${formatRemaining(remainingSeconds)}`
            }
            style={[shared.outlineButtonLabel, styles.label]}
          >
            {isFinished ? "0:00" : formatRemaining(remainingSeconds)}
          </AppText>
        </View>

        {isFinished ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restart timer"
            onPress={handleRestart}
            style={({ pressed }) => [
              styles.controlButton,
              {
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
          >
            <PlayIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPaused ? "Resume timer" : "Pause timer"}
            onPress={handlePauseToggle}
            style={({ pressed }) => [
              styles.controlButton,
              {
                opacity: pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
          >
            {isPaused ? (
              <PlayIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
            ) : (
              <PauseIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
            )}
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
          onPress={handleReset}
          style={({ pressed }) => [
            styles.controlButton,
            {
              opacity: pressed ? 0.72 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
        >
          <ResetIcon color={RECIPE_DETAILS_COLORS.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    marginTop: 14,
    maxWidth: "100%"
  },
  activeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  startButton: {
    alignItems: "center",
    backgroundColor: RECIPE_DETAILS_COLORS.accent,
    borderRadius: 20,
    elevation: 2,
    flexDirection: "row",
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 16,
    shadowColor: RECIPE_DETAILS_COLORS.shadowWarm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  startLabel: {
    color: RECIPE_DETAILS_COLORS.textPrimary,
    fontFamily: shared.outlineButtonLabel.fontFamily,
    fontSize: 13,
    fontWeight: "700"
  },
  button: {
    minHeight: 34,
    paddingHorizontal: 12
  },
  timeChip: {
    backgroundColor: RECIPE_DETAILS_COLORS.accentSoft
  },
  label: {
    fontSize: 12,
    fontVariant: ["tabular-nums"]
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: RECIPE_DETAILS_COLORS.background,
    borderColor: RECIPE_DETAILS_COLORS.accentBorder,
    borderRadius: 17,
    borderWidth: 1.5,
    height: 34,
    justifyContent: "center",
    width: 34
  }
});
