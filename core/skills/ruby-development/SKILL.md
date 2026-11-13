---
name: ruby-development
description: "Use for Ruby and Ruby on Rails code: ActiveRecord, migrations, controllers, jobs, Bundler, RuboCop, RSpec and Minitest. Detects Ruby/Rails versions and conventions first."
---

# Ruby / Rails development

Detect first: Ruby version (`.ruby-version`, `Gemfile`), Rails version (`Gemfile.lock`), test framework (RSpec `spec/` or Minitest `test/`), linter (`.rubocop.yml`, standard), background jobs (Sidekiq, GoodJob, Solid Queue), frontend (Hotwire, importmap, jsbundling). Follow them; ask before adding gems.

## Rules
- Run commands through Bundler (`bundle exec`, or `bin/rails`, `bin/rspec`).
- Rails conventions over custom structure; fat models are fine but extract service/query objects when the project already does.
- Strong parameters for every write; never `permit!`. Authorize every action with the project's tool (Pundit, CanCanCan, custom).
- ActiveRecord: avoid N+1 (`includes`/`preload`; Bullet if installed), use scopes, never string-interpolate SQL (use placeholders or Arel), wrap multi-step writes in a transaction.
- Migrations: reversible, one concern each; never edit migrations already run elsewhere; add indexes for foreign keys; ask before `db:migrate` on a non-local DB.
- Jobs must be idempotent and receive IDs, not records. Secrets from credentials or env.

## Verify
`bundle exec rubocop` on changed files, then the single test (`bin/rspec spec/path_spec.rb:LINE` or `bin/rails test test/path_test.rb:LINE`), then the suite.
