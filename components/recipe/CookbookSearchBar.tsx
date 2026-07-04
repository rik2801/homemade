import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "@/components/primitives/AppText";
import { useAppTheme } from "@/hooks/useAppTheme";
import { fontFamily } from "@/theme/typography";
import { layout, radius, spacing } from "@/theme/spacing";

export type CookbookSortMode = "chef-recommended" | "a-z" | "z-a";

const SORT_OPTIONS: { id: CookbookSortMode; label: string }[] = [
  { id: "chef-recommended", label: "Chef's recommended" },
  { id: "a-z", label: "A to Z" },
  { id: "z-a", label: "Z to A" }
];

type CookbookSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  sortMode: CookbookSortMode;
  onSortChange: (mode: CookbookSortMode) => void;
};

export function CookbookSearchBar({ value, onChangeText, sortMode, onSortChange }: CookbookSearchBarProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const sortButtonRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const [menuRight, setMenuRight] = useState<number>(layout.screenPadding);

  function openMenu() {
    sortButtonRef.current?.measureInWindow((x, y, buttonWidth, buttonHeight) => {
      setMenuTop(y + buttonHeight + 6);
      setMenuRight(windowWidth - (x + buttonWidth));
      setMenuOpen(true);
    });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleSelect(mode: CookbookSortMode) {
    await Haptics.selectionAsync();
    onSortChange(mode);
    closeMenu();
  }

  return (
    <>
      <View style={styles.row}>
        <View style={[styles.searchBar, { backgroundColor: colors.canvas }]}>
          <TextInput
            accessibilityLabel="Search recipes"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={onChangeText}
            placeholder="Search recipes"
            placeholderTextColor={colors.faint}
            returnKeyType="search"
            style={[styles.input, { color: colors.text }]}
            value={value}
          />
          <View style={[styles.searchIconWrap, { backgroundColor: colors.surface }]}>
            <SearchIcon color={colors.text} />
          </View>
        </View>
        <View ref={sortButtonRef} collapsable={false}>
          <Pressable
            accessibilityLabel="Sort recipes"
            accessibilityRole="button"
            accessibilityState={{ expanded: menuOpen }}
            hitSlop={6}
            onPress={menuOpen ? closeMenu : openMenu}
            style={[
              styles.sortBtn,
              { backgroundColor: colors.canvas },
              menuOpen ? { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 } : null
            ]}
          >
            <SortIcon color={colors.text} />
          </Pressable>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable accessibilityLabel="Close sort menu" style={styles.dismissLayer} onPress={closeMenu} />
        <View
          pointerEvents="box-none"
          style={[styles.menu, { top: menuTop, right: menuRight, backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {SORT_OPTIONS.map((option, index) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: sortMode === option.id }}
              onPress={() => handleSelect(option.id)}
              style={[
                styles.menuItem,
                index < SORT_OPTIONS.length - 1 ? { borderBottomColor: colors.borderLight, borderBottomWidth: 1 } : null,
                sortMode === option.id ? { backgroundColor: colors.brandSoft } : null
              ]}
            >
              <AppText
                style={[
                  styles.menuItemText,
                  { color: sortMode === option.id ? colors.brandOnBrand : colors.text },
                  sortMode === option.id ? styles.menuItemTextSelected : null
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </Svg>
  );
}

function SortIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  searchBar: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingLeft: spacing.lg,
    paddingRight: 4
  },
  input: {
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 12
  },
  searchIconWrap: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  sortBtn: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  dismissLayer: {
    ...StyleSheet.absoluteFill
  },
  menu: {
    borderRadius: radius.md,
    borderWidth: 1,
    elevation: 8,
    minWidth: 196,
    overflow: "hidden",
    position: "absolute",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16
  },
  menuItem: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 12
  },
  menuItemText: {
    fontFamily,
    fontSize: 14,
    lineHeight: 18
  },
  menuItemTextSelected: {
    fontWeight: "600"
  }
});
