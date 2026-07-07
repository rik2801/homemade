import { requireOptionalNativeModule } from "expo-modules-core";

export type ComposerImagePickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: "unavailable" | "permission" | "cancelled" };

const IMAGE_PICKER_REBUILD_HINT =
  "Rebuild the app to enable photos: npx expo run:ios";

function isImagePickerNativeAvailable() {
  return requireOptionalNativeModule("ExponentImagePicker") !== null;
}

async function loadImagePicker() {
  if (!isImagePickerNativeAvailable()) return null;

  try {
    return await import("expo-image-picker");
  } catch {
    return null;
  }
}

async function ensureLibraryPermission(ImagePicker: Awaited<ReturnType<typeof loadImagePicker>>) {
  if (!ImagePicker) return false;
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

async function ensureCameraPermission(ImagePicker: Awaited<ReturnType<typeof loadImagePicker>>) {
  if (!ImagePicker) return false;
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

export function imagePickerRebuildHint() {
  return IMAGE_PICKER_REBUILD_HINT;
}

export async function pickImageFromLibrary(): Promise<ComposerImagePickResult> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const granted = await ensureLibraryPermission(ImagePicker);
    if (!granted) return { ok: false, reason: "permission" };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return { ok: false, reason: "cancelled" };
    }

    return { ok: true, uri: result.assets[0].uri };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function pickImageFromCamera(): Promise<ComposerImagePickResult> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const granted = await ensureCameraPermission(ImagePicker);
    if (!granted) return { ok: false, reason: "permission" };

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return { ok: false, reason: "cancelled" };
    }

    return { ok: true, uri: result.assets[0].uri };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
