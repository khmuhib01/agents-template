---
name: jvm-development
description: "Use for Java and Kotlin code on the JVM: Spring Boot, Maven/Gradle builds, JPA/Hibernate, coroutines, JUnit 5 and Kotest. Detects JDK version, build tool and framework first."
---

# Java / Kotlin (JVM) development

Detect first: JDK version (`.java-version`, toolchain in build file), build tool (Maven `pom.xml` / Gradle `build.gradle(.kts)`; use the wrapper `mvnw`/`gradlew` if present), language (Java, Kotlin, both), framework (Spring Boot, Quarkus, Micronaut, Ktor, none), formatter (spotless, ktlint, detekt). Follow them; ask before adding dependencies.

## Rules
- Use the wrapper (`./gradlew`, `./mvnw`; `gradlew.bat`/`mvnw.cmd` on Windows) so the build uses the project's version.
- Java: use the language level the project targets (records, `var`, switch expressions only if supported). Prefer immutable objects; `Optional` for return values, not fields/parameters.
- Kotlin: prefer `val`, data classes, null safety without `!!`; coroutines with structured concurrency (no `GlobalScope`); never block inside a coroutine.
- Spring: constructor injection (no field `@Autowired`), validation with `@Valid` + Bean Validation, `@Transactional` on service methods (not private ones, not controllers), config via `@ConfigurationProperties`.
- JPA: watch for N+1 (fetch joins / entity graphs), keep `equals`/`hashCode` safe for entities, schema changes through the project's migration tool (Flyway, Liquibase); never edit applied migrations.
- Resources in try-with-resources / `use {}`; log with the project's logger (SLF4J), never `System.out`.

## Verify
Compile, run the linter/formatter check, then a single test (`./gradlew test --tests 'pkg.ClassTest'` or `./mvnw test -Dtest=ClassTest`), then the full suite.
