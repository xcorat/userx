export function clamp(val: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

export function mapNormalizedToTransform(normalizedPosition: number) {
  const pos = clamp(normalizedPosition, -1, 1);
  // tuning constants
  const ROT_MAX = 18; // degrees
  const SCALE_MAX = 0.06;
  const TY = 50; // px
  const opacityFactor = 0.2;

  const rotateX = pos * ROT_MAX;
  const scale = 1 - Math.abs(pos) * SCALE_MAX;
  const translateY = pos * TY;
  const opacity = Math.max(0, 1 - Math.abs(pos) * opacityFactor);

  const transform = `translate3d(0, ${translateY}px, 0) rotateX(${rotateX}deg) scale(${scale})`;
  return {
    rotateX,
    scale,
    translateY,
    opacity,
    transform,
    css: `transform: ${transform}; opacity: ${opacity}; will-change: transform, opacity;`
  };
}
