import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomemadeLogo } from "@/components/brand/HomemadeLogo";
import { layout } from "@/theme/spacing";
import { useAppTheme } from "@/hooks/useAppTheme";

export function BrandHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + layout.headerPaddingTop,
          backgroundColor: colors.background
        }
      ]}
    >
      <HomemadeLogo align="center" height={36} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingBottom: layout.headerPaddingBottom,
    paddingHorizontal: layout.screenPadding
  }
});
