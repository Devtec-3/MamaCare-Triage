export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Return only the base64 string, split off the data URI prefix if needed
      // Actually, the backend schema says "Base64-encoded image (JPEG or PNG)"
      // Let's keep the prefix so it's a valid data URL, unless backend strips it.
      // Assuming backend handles data URLs or raw base64. We will send data URL.
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}
