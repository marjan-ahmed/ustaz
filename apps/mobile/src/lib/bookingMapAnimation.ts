export const PROVIDER_SEARCH_CIRCLE_MAX_RADIUS = 200;
export const PROVIDER_SEARCH_CIRCLE_RESET_RADIUS = 50;
export const PROVIDER_SEARCH_CIRCLE_INCREMENT = 2;

export function getNextProviderSearchRadius(currentRadius: number) {
  const nextRadius = currentRadius + PROVIDER_SEARCH_CIRCLE_INCREMENT;
  return nextRadius > PROVIDER_SEARCH_CIRCLE_MAX_RADIUS ? PROVIDER_SEARCH_CIRCLE_RESET_RADIUS : nextRadius;
}
