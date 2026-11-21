import { calculateTotal } from './cart.js';

export const line = (items) => `Total: ${calculateTotal(items)}`;
