export function findLongestStreakOfBlackColor(
  colors: { r: number; g: number; b: number; x: number; y: number }[],
  threshold: number,
  equalOrLess: '<' | '===',
) {
  let longestStreak = 0;
  let currentStreak = 0;
  let x = 0;
  let y = 0;

  // const x = []

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    // const isBlack = color.r < 10 && color.g < 10 && color.b < 10;
    // const isBlack = color.r === 217 && color.g === 217 && color.b === 217;
    const isBlack = eval(
      `color.r ${equalOrLess} ${threshold} && color.g ${equalOrLess} ${threshold} && color.b ${equalOrLess} ${threshold}`,
    );

    if (isBlack) {
      currentStreak++;
    } else {
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        x = color.x;
        y = color.y;
      }

      currentStreak = 0;
    }
  }

  return { longestStreak, x, y };
}
