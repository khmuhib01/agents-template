import { calcTotal } from './cart.js';

export const orderTotal = (order) => calcTotal(order.items) + order.shipping;
