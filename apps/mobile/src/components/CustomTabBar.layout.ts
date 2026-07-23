export type PillTranslateXParams = {
  barWidth: number;
  tabCount: number;
  activeIndex: number;
  pillSize: number;
  paddingHorizontal: number;
};

export function getPillTranslateX({
  barWidth,
  tabCount,
  activeIndex,
  pillSize,
  paddingHorizontal,
}: PillTranslateXParams) {
  if (barWidth <= 0 || tabCount <= 0 || activeIndex < 0) return 0;

  const contentWidth = Math.max(0, barWidth - paddingHorizontal * 2);
  const tabWidth = contentWidth / tabCount;
  const tabCenter = paddingHorizontal + activeIndex * tabWidth + tabWidth / 2;

  return tabCenter - pillSize / 2;
}
