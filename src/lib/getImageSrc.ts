// Returns the correct image src for local or Google Drive images
export function getImageSrc(imageValue?: string | null): string | null {
  if (!imageValue) return null;
  if (imageValue.startsWith('http')) return imageValue;
  if (imageValue.startsWith('ITEMLOG_Images/')) return '/' + imageValue;
  return null;
} 