import { request } from './api';

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export const imageKitService = {
  /**
   * Fetches short-lived upload authentication parameters from backend
   */
  getAuthParameters: async (): Promise<ImageKitAuthParams> => {
    return request<ImageKitAuthParams>('/auth/imagekit-auth');
  },

  /**
   * Uploads an image binary file directly from mobile device to ImageKit CDN
   * @param fileUri Local file URI from ImagePicker or FileSystem
   * @param customFileName Optional filename prefix
   * @returns Permanent ImageKit CDN hosted image URL
   */
  uploadToImageKit: async (fileUri: string, customFileName?: string): Promise<string> => {
    if (!fileUri) {
      throw new Error('Image file URI is required');
    }

    // If it's already an HTTP URL (remote/existing image), skip uploading
    if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
      return fileUri;
    }

    // 1. Fetch authentication credentials from backend
    const authParams = await imageKitService.getAuthParameters();

    // 2. Extract filename and mime type
    const filename = customFileName || `upload_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    // 3. Build Multipart FormData
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: type,
    } as any);
    formData.append('fileName', filename);
    formData.append('publicKey', authParams.publicKey);
    formData.append('signature', authParams.signature);
    formData.append('expire', authParams.expire.toString());
    formData.append('token', authParams.token);
    formData.append('useUniqueFileName', 'true');

    // 4. Upload directly to ImageKit upload API endpoint
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ImageKit direct upload error:', errorText);
      throw new Error(`ImageKit Upload Failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  },
};
