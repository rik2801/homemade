import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { ChevronRightIcon } from "@/components/profile/ProfileIcons";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";

const MAX_VISIBLE_CHIPS = 3;

export type ProfileSettingRowProps = {
  icon: ReactNode;
  iconBackgroundColor: string;
  label: string;
  value?: string;
  chips?: string[];
  onPress?: () => void;
  trailing?: "chevron" | "switch" | "none";
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function ProfileSeparator() {
  const { colors, isDark } = useAppTheme();
  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: isDark ? colors.border : PROFILE_COLORS.separator }
      ]}
    />
  );
}

export function ProfileValueChips({ values }: { values: string[] }) {
  const { colors, isDark } = useAppTheme();

  if (values.length === 0) {
    return (
      <AppText style={[styles.rowValue, { color: isDark ? colors.text : PROFILE_COLORS.primaryText }]}>
        None selected
      </AppText>
    );
  }

  const visible = values.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = values.length - visible.length;

  return (
    <View style={styles.chipRow}>
      {visible.map((value) => (
        <View
          key={value}
          style={[
            styles.goalChip,
            isDark
              ? { backgroundColor: "#3D3418", borderColor: colors.brand }
              : null
          ]}
        >
          <AppText
            style={[
              styles.goalChipText,
              { color: isDark ? "#FFFFFF" : PROFILE_COLORS.chipText }
            ]}
          >
            {value}
          </AppText>
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.goalChip,
            isDark
              ? { backgroundColor: "#3D3418", borderColor: colors.brand }
              : null
          ]}
        >
          <AppText
            style={[
              styles.goalChipText,
              { color: isDark ? "#FFFFFF" : PROFILE_COLORS.chipText }
            ]}
          >
            {`+${overflow}`}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export function ProfileSettingRow({
  icon,
  iconBackgroundColor,
  label,
  value,
  chips,
  onPress,
  trailing = "chevron",
  switchValue = false,
  onSwitchChange,
  disabled,
  accessibilityHint
}: ProfileSettingRowProps) {
  const { colors, isDark } = useAppTheme();
  const isSwitch = trailing === "switch";
  const accessibleValue = chips
    ? chips.length > 0
      ? chips.join(", ")
      : "None selected"
    : value ?? (isSwitch ? (switchValue ? "On" : "Off") : undefined);
  const labelColor = isDark ? colors.muted : PROFILE_COLORS.secondaryText;
  const valueColor = isDark ? colors.text : PROFILE_COLORS.primaryText;
  const chevronColor = isDark ? colors.faint : PROFILE_COLORS.tertiaryText;

  return (
    <Pressable
      accessibilityRole={isSwitch ? "switch" : onPress ? "button" : undefined}
      accessibilityLabel={accessibleValue ? `${label}, ${accessibleValue}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={isSwitch ? { checked: switchValue, disabled } : { disabled }}
      disabled={(!onPress && !isSwitch) || disabled}
      onPress={
        isSwitch
          ? () => onSwitchChange?.(!switchValue)
          : onPress
      }
      style={({ pressed }) => [
        styles.profileRow,
        pressed && (onPress || isSwitch)
          ? { backgroundColor: isDark ? colors.canvas : PROFILE_COLORS.rowPressed }
          : null
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]} importantForAccessibility="no">
        {icon}
      </View>

      <View style={styles.rowContent}>
        <AppText style={[styles.rowLabel, { color: labelColor }]}>{label}</AppText>
        {chips ? (
          <ProfileValueChips values={chips} />
        ) : value ? (
          <AppText style={[styles.rowValue, { color: valueColor }]} numberOfLines={2}>
            {value}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trailing} pointerEvents={isSwitch ? "box-none" : "none"}>
        {trailing === "chevron" ? <ChevronRightIcon color={chevronColor} /> : null}
        {trailing === "switch" ? (
          <Switch
            accessibilityElementsHidden
            importantForAccessibility="no"
            pointerEvents="none"
            value={switchValue}
            trackColor={{
              false: isDark ? colors.border : PROFILE_COLORS.switchInactive,
              true: PROFILE_COLORS.switchActive
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? colors.border : PROFILE_COLORS.switchInactive}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14
  },
  rowLabel: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "500"
  },
  rowValue: {
    marginTop: 2,
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: -0.15
  },
  chipRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  goalChip: {
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: PROFILE_COLORS.chipBorder,
    backgroundColor: PROFILE_COLORS.chipBackground,
    justifyContent: "center"
  },
  goalChipText: {
    fontFamily,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "400"
  },
  trailing: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76
  }
});
