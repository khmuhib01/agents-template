import { calculateTotal } from './cart.js';

export const orderTotal = (order) => calculateTotal(order.items) + order.shipping;
