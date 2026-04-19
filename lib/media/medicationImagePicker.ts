import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type MedicationImagePickResult =
  | { type: 'success'; uri: string }
  | { type: 'cancelled' }
  | { type: 'permission-denied'; message: string }
  | { type: 'error'; message: string };

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.85,
};

export async function takeMedicationPhoto(): Promise<MedicationImagePickResult> {
  try {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      return {
        type: 'permission-denied',
        message: 'Camera access is needed to take a medication photo.',
      };
    }

    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled || result.assets.length === 0) {
      return { type: 'cancelled' };
    }

    return {
      type: 'success',
      uri: result.assets[0].uri,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open the camera.';
    return { type: 'error', message };
  }
}

export async function chooseMedicationPhotoFromLibrary(): Promise<MedicationImagePickResult> {
  try {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!libraryPermission.granted) {
      return {
        type: 'permission-denied',
        message: 'Photo library access is needed to choose a medication image.',
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled || result.assets.length === 0) {
      return { type: 'cancelled' };
    }

    return {
      type: 'success',
      uri: result.assets[0].uri,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open the photo library.';
    return { type: 'error', message };
  }
}
