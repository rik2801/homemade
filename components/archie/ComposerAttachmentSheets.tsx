import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { AppText } from "@/components/primitives/AppText";
import { SoupHeroIllustration } from "@/components/recipe/SoupHeroIllustration";
import { RECIPE_CATALOG } from "@/features/recipe/data/homemadeRecipe";
import { imagePickerRebuildHint, pickImageFromCamera, pickImageFromLibrary } from "@/lib/composerImage";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/useAppStore";
import { fontFamily } from "@/theme/typography";
import { radius, spacing } from "@/theme/spacing";

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function GalleryIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m3 16 5-5 4 4 5-6 4 5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

type SheetOptionProps = {
  description: string;
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

function SheetOption({ description, icon, label, onPress }: SheetOptionProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: colors.canvas,
          borderColor: colors.border
        }
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.surface }]}>{icon}</View>
      <View style={styles.optionCopy}>
        <AppText style={styles.optionLabel}>{label}</AppText>
        <AppText muted style={styles.optionDescription}>
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

function ComposerRecipePicker() {
  const { colors } = useAppTheme();
  const selectComposerRecipe = useAppStore((state) => state.selectComposerRecipe);

  async function handleSelect(recipeId: string, available: boolean) {
    if (!available) return;
    await Haptics.selectionAsync();
    selectComposerRecipe(recipeId);
  }

  return (
    <View style={styles.recipeList}>
      {RECIPE_CATALOG.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          disabled={!item.available}
          onPress={() => handleSelect(item.id, item.available)}
          style={[
            styles.recipeRow,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: item.available ? 1 : 0.48
            }
          ]}
        >
          <View style={[styles.recipeThumb, { backgroundColor: colors.surfaceWarm }]}>
            <SoupHeroIllustration recipeId={item.id} height={40} />
          </View>
          <View style={styles.recipeCopy}>
            <AppText style={styles.recipeTitle}>{item.title}</AppText>
            <AppText style={[styles.recipeMeta, { color: colors.faint }]}>
              {item.servings} servings · {item.guidelines.join(" · ") || "Home cooking"}
            </AppText>
          </View>
          {!item.available ? (
            <View style={[styles.soon, { borderColor: colors.border, backgroundColor: colors.canvas }]}>
              <AppText style={[styles.soonText, { color: colors.faint }]}>Soon</AppText>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function ComposerAttachmentSheets() {
  const { colors } = useAppTheme();
  const composerSheetMode = useAppStore((state) => state.composerSheetMode);
  const closeComposerSheet = useAppStore((state) => state.closeComposerSheet);
  const setComposerImage = useAppStore((state) => state.setComposerImage);

  async function handleImagePick(source: "camera" | "library") {
    await Haptics.selectionAsync();
    closeComposerSheet();

    const result =
      source === "camera" ? await pickImageFromCamera() : await pickImageFromLibrary();

    if (result.ok) {
      setComposerImage(result.uri);
      return;
    }

    if (result.reason === "unavailable") {
      useAppStore.setState({ toastMessage: imagePickerRebuildHint() });
      return;
    }

    if (result.reason === "permission") {
      useAppStore.setState({
        toastMessage: source === "camera" ? "Camera access is required." : "Photo library access is required."
      });
    }
  }

  async function handlePickFromLibrary() {
    await handleImagePick("library");
  }

  async function handleTakePhoto() {
    await handleImagePick("camera");
  }

  return (
    <>
      <BottomSheet
        visible={composerSheetMode === "image-source"}
        onClose={closeComposerSheet}
        title="Add an image"
      >
        <View style={styles.options}>
          <SheetOption
            description="Use your camera to snap a dish or ingredient"
            icon={<CameraIcon color={colors.text} />}
            label="Take a photo"
            onPress={handleTakePhoto}
          />
          <SheetOption
            description="Choose an existing photo from your library"
            icon={<GalleryIcon color={colors.text} />}
            label="Choose from gallery"
            onPress={handlePickFromLibrary}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={composerSheetMode === "recipe-picker"}
        onClose={closeComposerSheet}
        title="Choose recipe"
        subtitle="Archie will use this recipe as context."
      >
        <ComposerRecipePicker />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm
  },
  option: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  optionIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  optionCopy: {
    flex: 1,
    gap: 3
  },
  optionLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: "600"
  },
  optionDescription: {
    fontFamily,
    fontSize: 10,
    lineHeight: 14
  },
  recipeList: {
    gap: spacing.sm
  },
  recipeRow: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  recipeThumb: {
    borderRadius: radius.md,
    height: 44,
    overflow: "hidden",
    width: 56
  },
  recipeCopy: {
    flex: 1,
    gap: 3
  },
  recipeTitle: {
    fontFamily,
    fontSize: 13,
    fontWeight: "600"
  },
  recipeMeta: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15
  },
  soon: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  soonText: {
    fontFamily,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  }
});
