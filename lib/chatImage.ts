import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const MAX_IMAGE_WIDTH = 1024;
const JPEG_QUALITY = 0.72;

export async function readImageAsDataUrl(uri: string): Promise<string | null> {
  try {
    const manipulated = await ImageManipulator.manipulate(uri)
      .resize({ width: MAX_IMAGE_WIDTH })
      .renderAsync();

    const saved = await manipulated.saveAsync({
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
      base64: true
    });

    if (!saved.base64) return null;
    return `data:image/jpeg;base64,${saved.base64}`;
  } catch {
    return null;
  }
}
