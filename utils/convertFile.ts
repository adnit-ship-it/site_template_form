import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to reduce its size before storage.
 * Only applies to image files; other file types are returned as-is.
 * @param file The File object to compress.
 * @returns A promise that resolves with the compressed File or original file.
 */
export const compressImageIfNeeded = async (file: File): Promise<File> => {
  // Check if the file is an image
  const isImage = file.type.startsWith('image/');
  
  if (!isImage) {
    // Not an image, return as-is
    return file;
  }

  try {
    // Compression options
    const options = {
      maxSizeMB: 0.5, // Maximum size in MB (500KB)
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true, // Use web worker for better performance
      fileType: file.type, // Preserve original file type
    };

    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    // If compression fails, return the original file
    return file;
  }
};

/**
 * Converts a File object into a base64 encoded string.
 * This is a generic utility function that can be reused anywhere in the application.
 * @param file The File object to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // The result includes a prefix like "data:image/png;base64,"
        // We need to strip that out for the API.
        const base64String = result.split(',')[1];
  
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error('Could not extract base64 string from file.'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };
  