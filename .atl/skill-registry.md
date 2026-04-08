# Skill Registry - invent-stock

Generated: 2026-04-08
Project: invent-stock
Stack: Node.js + Express/Fastify + SQLite/PostgreSQL + Telegram Bot

## User Skills

The following skills are available from the global skill directories:

### Backend & API Skills
| Skill | Trigger | When to Use |
|-------|---------|-------------|
| `api-rate-limiting` | API protection, rate limits | Implementar rate limiting para el bot de Telegram |
| `security-audit` | Security assessment, OWASP | Auditorías de seguridad antes de producción |
| `verification-before-completion` | Before handoff, merge, release | Verificar que todo funciona antes de considerar "done" |

### Planning & Architecture Skills
| Skill | Trigger | When to Use |
|-------|---------|-------------|
| `writing-plans` | Approved scope needs tasks | Convertir el scope aprobado en tareas ejecutables |
| `project-memory-governor` | Persist architecture decisions | Mantener memoria persistente del proyecto |

### Quality Skills
| Skill | Trigger | When to Use |
|-------|---------|-------------|
| `quality-gate-orchestrator` | Pre-PR, pre-merge, pre-release | Decidir qué gates correr |
| `quality-gate-release` | Before merge or release | Gate de release readiness |

### SDD Workflow Skills
| Skill | Trigger | When to Use |
|-------|---------|-------------|
| `sdd-init` | Initialize SDD in project | Ya ejecutado ✅ |
| `sdd-explore` | Investigate ideas before commit | Explorar arquitectura alternativa |
| `sdd-propose` | Create change proposal | Crear propuesta de cambio |
| `sdd-spec` | Write specifications | Escribir specs detallados |
| `sdd-design` | Create technical design | Diseño técnico |
| `sdd-tasks` | Break down into tasks | Descomponer en tareas |
| `sdd-apply` | Implement tasks | Implementar código |
| `sdd-verify` | Validate implementation | Verificar contra specs |
| `sdd-archive` | Archive completed change | Cerrar cambio completado |

## Project Conventions

No project-level conventions detected (EMPTY_WORKSPACE).

## Relevant Skills for This Project

Based on the project type (backend service with Telegram bot), the following skills are MOST relevant:

1. **`api-rate-limiting`** - Implementar rate limiting para prevenir abuso del bot
2. **`security-audit`** - Auditoría de seguridad antes de producción
3. **`verification-before-completion`** - Verificar implementation antes de handoff
4. **`writing-plans`** - Descomponer el scope en tareas ejecutables

## Compact Rules

### api-rate-limiting
- Use token bucket for smooth traffic
- Implement sliding window for accurate rate limiting
- Consider Redis for distributed rate limiting
- Always test edge cases: burst traffic, concurrent requests

### security-audit
- OWASP Top10 for backend APIs
- Validate ALL inputs from Telegram webhook
- Sanitize database queries (SQL injection)
- Store secrets in environment variables
- Never log sensitive data

### verification-before-completion
- Run tests if available
- Verify build succeeds
- Check lint passes
- Test runtime behavior manually
- Compare implementation against specs

### writing-plans
- Break tasks into phases
- Use hierarchical numbering (1.1, 1.2, etc.)
- Include dependencies between tasks
- Add verification hooks for each phase
- Keep tasks completable in one session