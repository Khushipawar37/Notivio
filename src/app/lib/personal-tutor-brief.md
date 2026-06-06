# Notivio Personal Tutor

## System Prompt
Use `PERSONAL_TUTOR_SYSTEM_PROMPT` from `personal-tutor.ts` as the base system instruction.

## Implementation Notes
- Feature name: `PersonalTutor`
- Replaces StudyPlanner entrypoint in nav and template redirect.
- New primary route: `/dashboard/tutor`
- APIs:
  - `POST /api/tutor/blankpage`
  - `POST /api/tutor/hint`
  - `GET /api/tutor/profile`
  - `POST /api/tutor/diagnose`
  - `POST /api/tutor/exam-briefing`

## Data Models
- `TutorProfile`
- `ConceptMetric`
- `TutorEventLog`

## Behavior
- Retrieval-first hints and escalation after repeated failures.
- Personalized tone/persona.
- Root-cause diagnosis + targeted remediation.
- Pre-exam briefing + 30-minute plan.
- Event logging with privacy-aware redaction flag.
