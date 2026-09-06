# Contributing to Sankat Setu

This project is built for Smart India Hackathon 2026 and is open source under the MIT License.

---

## Before you contribute

**This is not production software.** It is a working prototype built to a six-day sprint deadline. See `docs/decisions.md` for what is deliberately unimplemented.

If you are modifying this for production use — particularly in a real disaster-response context — you must:

1. Audit the cut list in `docs/decisions.md`. Several items (encryption, sophisticated conflict resolution, multi-hop reliability) are critical for a real system.
2. Understand that triage and allocation logic may not match your region's actual protocols. Verify against local disaster-management guidelines.
3. Test extensively on real hardware and networks, not just in development environments.
4. Have a qualified person (preferably someone with disaster-management or medical training) review triage rules before deployment.

---

## Licensing

By contributing, you agree that your work is licensed under the MIT License. This means:

- Your contribution can be used, modified, and distributed freely.
- You retain copyright to your work.
- You provide it "as is" with no warranty.
- You cannot retroactively change these terms.

If you cannot accept this, do not contribute.

---

## Code guidelines

- All code must pass `pnpm typecheck` and `pnpm test`.
- Every triage or allocation change must include updated tests.
- No hardcoded values for thresholds, ranges, or limits — use named constants.
- Comment assumptions, especially in the triage adapter. Future readers may not know why you mapped a field that way.
- If you add a dependency, justify it in the commit message. Six-day deadlines make new dependencies high-risk.

---

## What to work on

**High impact, low risk:**
- Bug fixes with test coverage
- Documentation improvements
- Build log additions (fixes for known errors)
- Offline UI responsiveness

**Medium impact, medium risk:**
- Refactoring to reduce technical debt (but not before 10 September)
- Adding tests for existing logic
- Optimising performance (measure first, optimise second)

**Blocked or deferred:**
Everything on the cut list in `docs/decisions.md`. If you believe something cut should be uncut, open an issue first — don't implement it and hope.

---

## Reporting issues

Include:
- What you were doing
- What you expected
- What actually happened
- Your environment (OS, Node version, Android version if device-related)
- The exact error text

**For device-related bugs:** mention whether it happens on the emulator or only physical hardware, and which Android version.

---

## After 10 September

This project ships as-is for SIH evaluation. Post-demo maintenance and improvements are a different conversation. If you want to maintain this or build a production version, reach out to the core team.

---

## Questions?

Read `CLAUDE.md` for the architectural decisions. Read `build_logs.md` for known issues. If neither answers your question, open an issue.
