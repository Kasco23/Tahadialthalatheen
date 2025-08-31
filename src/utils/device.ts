/**
 * Device detection utilities
 * Provides functions to detect device types and capabilities
 */

/**
 * Detects if the current device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects if the current device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth <= 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detects if the device supports WebGL2
 */
export function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Detects if the device has touch support
 */
export function hasTouch(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Gets the device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
}