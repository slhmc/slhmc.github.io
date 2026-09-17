import { screens, type Screen } from './screens.ts';

/** Each shuffled cycle visits all screenshots once, without repeating at its boundary. */
export function shuffleScreens(previous?: Screen, random = Math.random): Screen[] {
  const order = [...screens];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order[0] === previous) [order[0], order[1]] = [order[1], order[0]];
  return order;
}
