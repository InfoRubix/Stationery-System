// Returns the correct image src for local or Google Drive images, using a proxy for Google Drive
export function getImageSrc(imageValue?: string | null): string | null {
  if (!imageValue) return null;
  if (imageValue.startsWith('http')) {
    // Proxy Google Drive images to bypass hotlink protection
    if (imageValue.includes('drive.google.com')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(imageValue)}`;
    }
    return imageValue.trim();
  }
  if (imageValue.startsWith('ITEMLOG_Images/')) return '/' + imageValue.trim();
  return null;
} 