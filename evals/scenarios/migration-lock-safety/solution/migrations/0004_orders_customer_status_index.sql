-- no-transaction
CREATE INDEX CONCURRENTLY idx_orders_customer_status ON orders (customer_id, status);
