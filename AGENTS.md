# Kubbetition Backend – Agent Guidelines

This document describes the project’s stack, schema, and conventions so agents (and humans) can work consistently. **Never guess** — if something is unclear (e.g. where the mobile app lives), ask.

---

## Stack

- **Runtime**: Node.js, NestJS 10
- **Database**: PostgreSQL with **TypeORM**
- **Cache**: Redis (`@liaoliaots/nestjs-redis`, `ioredis`)
- **Auth**: JWT, Passport (local, Google OAuth), Firebase (push)
- **API**: REST, Swagger/OpenAPI, Socket.IO
- **Config**: `@nestjs/config` with **Joi** schema in `src/app.config-schema.ts`
- **Validation**: `class-validator` on DTOs; **Swagger**: `@nestjs/swagger` + `ApiProperty` on DTOs

---

## Database & schema

### Entities (TypeORM)

- **Base**: Many entities extend `Common` from `src/common/entities/CommonEntity.ts`:
  - `id: string` (UUID, `@PrimaryGeneratedColumn('uuid')`)
  - `createdAt: Date`, `updatedAt: Date`
- **Standalone**: `User` does **not** extend `Common`; it has its own `id` (UUID) and uses `@DeleteDateColumn()` for soft delete.
- **Locations**:
  - `src/users/entities/`: `user.entity.ts`, `friend-request.entity.ts`
  - `src/teams/entities/`: `team.entity.ts`, `division.entity.ts`, `post.entity.ts`, `post-reaction.entity.ts`
  - `src/games/entities/`: `game.entity.ts`
  - `src/events/entities/`: `event.entity.ts`, `event-invitation.entity.ts`
  - `src/team-requests/entities/`: `team-request.entity.ts`
- **Patterns**:
  - Enums: `@Column({ type: 'enum', enum: SomeEnum })` (e.g. `Role`, `GameType`)
  - Relations: `@ManyToOne`, `@OneToMany`, `@ManyToMany` with `@JoinTable` for M:N
  - Soft delete: `@DeleteDateColumn()` where used (e.g. `User`, `Event`)
  - Indexes: `@Index()` on table or columns; `@Check()` for constraints
  - Timestamps: `timestamptz` for date columns

### Migrations (mandatory)

- **DataSource for CLI**: `src/data-source.ts` — used by the TypeORM CLI only; loads env via `dotenv` (`.local.env` then `.env`) and registers all entities and `src/migrations/*.ts`.
- **App runtime**: `DatabaseModule` runs pending migrations on startup (`migrationsRun: true`) and uses `synchronize: false`. Migrations are loaded from `dist/migrations/*.js` after `nest build`.

**Commands (run from project root):**

| Script | Purpose |
|--------|--------|
| `npm run migration:generate -- src/migrations/DescriptiveName` | Generate a new migration by diffing entities vs DB. Replace `DescriptiveName` with a short name (e.g. `AddUserIdToPosts`, `CreateEventsTable`). |
| `npm run migration:run` | Apply all pending migrations. |
| `npm run migration:revert` | Revert the last executed migration. |

**Workflow:**

1. **After every database/schema change** (new entity, new column, type change, index, constraint, etc.):
   - Create or edit the entity in `src/`.
   - **Generate** a migration:  
     `npm run migration:generate -- src/migrations/YourDescriptiveName`
   - **Run** it:  
     `npm run migration:run`
2. For **production**, migrations run automatically when the app starts (after `npm run build`); ensure migrations are committed and deployed before the new code.
3. **Docker**: The image runs migrations before starting the app (`migration:run -d dist/data-source.js` then `node dist/main`). If migrations fail, the container exits and the app does not start. See `Dockerfile` CMD.
4. Do **not** use `synchronize: true`; migrations are the source of truth.

**Existing database:** If the DB already has tables (e.g. from a previous `synchronize: true`), the first generated migration may try to create them again. Review the generated file and remove statements for tables that already exist, or use a fresh DB for a clean first migration.

### Entity schema lifecycle

- If an entity (or its fields) **does not exist** for a feature: **create** the entity (and any new enums/DTOs) following the patterns above.
- If the schema **already exists** but is incomplete or wrong: **update** the entity and then **add and run a migration** for that change.

---

## API & DTOs

- **DTOs**: Live under `src/<module>/dto/` (e.g. `create-*.dto.ts`, `update-*.dto.ts`).
- **Validation**: Use `class-validator` decorators (`IsString`, `IsOptional`, `IsUUID`, `Validate(CustomRule)`, etc.) on every request DTO.
- **Swagger**: Use `@ApiProperty()` / `@ApiPropertyOptional()` on DTO properties so the OpenAPI spec stays accurate.
- **Update DTOs**: Often `class UpdateXDto extends PartialType(CreateXDto)` from `@nestjs/mapped-types`.
- **Context**: Some DTOs extend `ContextAwareDto` from `src/common/dto/context-aware.dto.ts` when the handler needs the authenticated user (e.g. `context.user`).

---

## Config

- Env schema: **Joi** in `src/app.config-schema.ts`. Required/optional vars and types are defined there.
- Load order: `.local.env` then `.env` (see `ConfigModule.forRoot` in `app.module.ts`).

---

## Mobile / frontend alignment

- The **mobile application** (or other frontend) may keep its own schema/docs (e.g. types, API models) in sync with this backend.
- **After every backend schema/API change** that affects the client (new/updated entities, DTOs, endpoints):
  - **Update the mobile project’s AGENTS.md** (or equivalent schema/API doc) so the frontend’s schema and patterns match the backend.
- **Frontend/mobile path**: This repo does **not** assume where the mobile app lives. If you need to update the mobile project’s AGENTS.md or schema: **ask for the path to the frontend/mobile project**; do not guess.

---

## Summary checklist for agents

- [ ] Use **migrations** for every DB change; create and run them after entity/schema edits.
- [ ] Create or update **entities** when the schema is missing or wrong; keep `Common` and existing patterns in mind.
- [ ] Keep **DTOs** validated (`class-validator`) and documented (**Swagger**).
- [ ] After schema/API changes that affect the client: **update the mobile app’s AGENTS.md** (or schema doc); **ask for the mobile project path** if you don’t know it.
- [ ] When unsure about paths, conventions, or intent: **ask instead of guessing**.
