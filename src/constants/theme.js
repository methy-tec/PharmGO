// ============================================
// 🎨 THEME - CONSTANTES DE STYLE
// src/constants/theme.js
// ============================================

export const COLORS = {
  // Couleurs principales
  primary: '#00b368',
  primaryDark: '#008C52',
  secondary: '#ff9500',
  
  // Couleurs par rôle
  roles: {
    user: {
      color: '#007aff',
      bg: '#e5f2ff',
      name: 'Patient'
    },
    admin: {
      color: '#00b368',
      bg: '#e8f5f0',
      name: 'Admin'
    },
    pharmacy: {
      color: '#ff9500',
      bg: '#fff3e0',
      name: 'Gérant'
    },
    travailleur: {
      color: '#34c759',
      bg: '#e8f5e9',
      name: 'Employé'
    },
    superadmin: {
      color: '#6c2bd9',
      bg: '#f3e5ff',
      name: 'SuperAdmin'
    }
  },
  
  // États
  success: '#34c759',
  successBg: '#e8f5e9',
  error: '#ff3b30',
  errorBg: '#ffebee',
  warning: '#ff9500',
  warningBg: '#fff3e0',
  info: '#007aff',
  infoBg: '#e5f2ff',
  
  // Texte
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  textTertiary: '#c7c7cc',
  
  // Backgrounds
  background: '#f5f5f5',
  backgroundLight: '#ffffff',
  backgroundDark: '#1c1c1e',
  
  // Borders
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderDark: '#c0c0c0',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)'
};

export const FONTS = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  circle: 9999
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  }
};

export default {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS
};