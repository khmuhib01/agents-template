# orders-db (PostgreSQL migrations)
Migrations are plain SQL in `migrations/NNNN_name.sql` with a matching `NNNN_name.down.sql`.
The runner wraps every migration file in one transaction, EXCEPT files whose first line is `-- no-transaction`.
A `-- no-transaction` file must contain only the statements that cannot run inside a transaction.
The `orders` table has about 40 million rows and takes writes all day: migrations must not hold long locks.
