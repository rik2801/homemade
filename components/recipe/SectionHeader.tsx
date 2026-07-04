import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/primitives/AppText";

type SectionHeaderProps = {
  title: string;
  detail: string;
};

export function SectionHeader({ title, detail }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" muted style={styles.detail}>
        {detail}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  detail: {
    textAlign: "right"
  }
});
