// Modern Card Styles Utility
// Use these styles throughout the system for consistent design

export const getBaseCardStyle = (mobile = false) => ({
  background: '#ffffff',
  borderRadius: 16,
  padding: mobile ? 16 : 24,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  cursor: 'default'
});

export const getGradientCardStyle = (mobile = false) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 16,
  padding: mobile ? 16 : 24,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  cursor: 'default'
});

export const getItemCardStyle = (mobile = false) => ({
  background: '#ffffff',
  borderRadius: 12,
  padding: mobile ? 12 : 16,
  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
});

// Hover effect handlers
export const handleCardHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.transform = 'translateY(0px)';
  }
};

export const handleGradientCardHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.transform = 'translateY(0px) scale(1)';
  }
};

export const handleItemCardHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 6px 10px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.transform = 'translateY(0px) scale(1)';
  }
};

// Responsive grid styles
export const getResponsiveGrid = (mobile = false) => ({
  display: 'grid',
  gap: mobile ? 16 : 32,
  width: '100%',
  overflow: 'hidden'
});

export const getTwoColumnGrid = (mobile = false) => ({
  ...getResponsiveGrid(mobile),
  gridTemplateColumns: mobile ? '1fr' : '1fr 1fr'
});

export const getAsymmetricGrid = (mobile = false) => ({
  ...getResponsiveGrid(mobile),
  gridTemplateColumns: mobile ? '1fr' : '2.2fr 1.2fr'
});

// Mobile detection helper
export const isMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth <= 768;
  }
  return false;
};

// Text styles
export const cardHeadingStyle = {
  fontWeight: 600,
  fontSize: 18,
  color: '#1f2937',
  marginBottom: 12
};

export const cardWhiteHeadingStyle = {
  fontWeight: 600,
  fontSize: 18,
  color: '#ffffff',
  marginBottom: 12
};