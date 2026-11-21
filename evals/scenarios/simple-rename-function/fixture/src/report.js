import { calcTotal } from './cart.js';

export const line = (items) => `Total: ${calcTotal(items)}`;
