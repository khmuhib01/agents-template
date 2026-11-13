---
name: dotnet-development
description: "Use for C#/.NET code: ASP.NET Core (minimal APIs, MVC), Entity Framework Core, dependency injection, async/await, nullable reference types, xUnit/NUnit and dotnet CLI. Detects target framework and solution layout first."
---

# .NET development

Detect first: target framework (`<TargetFramework>` in `.csproj`, `global.json` SDK), solution/projects layout, nullable and implicit usings settings, web style (minimal APIs, controllers, Blazor), data access (EF Core, Dapper), test framework (xUnit, NUnit, MSTest), analyzers / `.editorconfig`. Follow them; ask before adding NuGet packages.

## Rules
- Respect nullable reference types; no `!` to silence warnings without a reason. Keep warnings at zero if the project treats them as errors.
- async all the way: `async Task`, never `.Result`/`.Wait()`/`async void` (except event handlers); pass `CancellationToken` through I/O.
- DI: register services with the right lifetime (no scoped service captured by a singleton); constructor injection; options pattern (`IOptions<T>`) for config.
- ASP.NET Core: validate input, return proper status codes / `ProblemDetails`, authorize endpoints explicitly, never trust client data.
- EF Core: `AsNoTracking` for reads, avoid N+1 (`Include`, projections), parameterized raw SQL only (`FromSqlInterpolated`), schema changes via migrations; review generated migrations and never edit applied ones.
- `using`/`await using` for disposables; structured logging via `ILogger<T>` with message templates, not string interpolation.

## Verify
`dotnet build`, `dotnet format --verify-no-changes` if used, then `dotnet test --filter FullyQualifiedName~ClassName` (narrowest first), then `dotnet test`.
