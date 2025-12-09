import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions from iPhone X (common baseline)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Width percentage to pixels
 * @param percent - Percentage of screen width (0-100)
 */
export const wp = (percent: number): number => {
  return (SCREEN_WIDTH * percent) / 100;
};

/**
 * Height percentage to pixels
 * @param percent - Percentage of screen height (0-100)
 */
export const hp = (percent: number): number => {
  return (SCREEN_HEIGHT * percent) / 100;
};

/**
 * Scale for width-based elements (images, icons)
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

/**
 * Scale for height-based elements
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

/**
 * Moderate scale - balanced scaling (recommended for fonts)
 * @param size - Base size
 * @param factor - Scaling factor (0 = no scale, 1 = full scale)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Font scale based on pixel density
 */
export const fontScale = (size: number): number => {
  return size * PixelRatio.getFontScale();
};

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
