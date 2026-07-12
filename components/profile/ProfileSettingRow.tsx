import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";
import { ChevronRightIcon } from "@/components/profile/ProfileIcons";
import { PROFILE_COLORS } from "@/components/profile/profileColors";
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
  return <View style={styles.separator} />;
}

export function ProfileValueChips({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <AppText style={styles.rowValue}>None selected</AppText>;
  }

  const visible = values.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = values.length - visible.length;

  return (
    <View style={styles.chipRow}>
      {visible.map((value) => (
        <View key={value} style={styles.goalChip}>
          <AppText style={styles.goalChipText}>{value}</AppText>
        </View>
      ))}
      {overflow > 0 ? (
        <View style={styles.goalChip}>
          <AppText style={styles.goalChipText}>{`+${overflow}`}</AppText>
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
  const isSwitch = trailing === "switch";
  const accessibleValue = chips
    ? chips.length > 0
      ? chips.join(", ")
      : "None selected"
    : value ?? (isSwitch ? (switchValue ? "On" : "Off") : undefined);

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
        pressed && (onPress || isSwitch) && styles.profileRowPressed
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]} importantForAccessibility="no">
        {icon}
      </View>

      <View style={styles.rowContent}>
        <AppText style={styles.rowLabel}>{label}</AppText>
        {chips ? (
          <ProfileValueChips values={chips} />
        ) : value ? (
          <AppText style={styles.rowValue} numberOfLines={2}>
            {value}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trailing} pointerEvents={isSwitch ? "box-none" : "none"}>
        {trailing === "chevron" ? <ChevronRightIcon color={PROFILE_COLORS.tertiaryText} /> : null}
        {trailing === "switch" ? (
          <Switch
            accessibilityElementsHidden
            importantForAccessibility="no"
            pointerEvents="none"
            value={switchValue}
            trackColor={{
              false: PROFILE_COLORS.switchInactive,
              true: PROFILE_COLORS.switchActive
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={PROFILE_COLORS.switchInactive}
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
  profileRowPressed: {
    backgroundColor: PROFILE_COLORS.rowPressed
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
    fontWeight: "500",
    color: PROFILE_COLORS.secondaryText
  },
  rowValue: {
    marginTop: 2,
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: -0.15,
    color: PROFILE_COLORS.primaryText
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
    fontWeight: "400",
    color: PROFILE_COLORS.chipText
  },
  trailing: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PROFILE_COLORS.separator,
    marginLeft: 76
  }
});
