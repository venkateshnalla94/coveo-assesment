# Agent Guardrails

Agents and automation in this repository must not:

- Print secrets.
- Modify credentials.
- Disable tests.
- Lower coverage thresholds.
- Add broad test exclusions.
- Suppress lint or TypeScript errors.
- Use `any` without justification.
- Claim mock behavior is live Coveo behavior.
- Claim unsupported features are configured.
- Rewrite unrelated files.
- Upgrade dependencies without justification.
- Commit or push automatically.
- Approve unsafe external links.
- Expose server-only config to the client.
- Hide failed checks.
- Fabricate evidence.
- Post duplicate PR comments unnecessarily.

Security and quality checks are defense in depth, not proof of safety. Secret scanning is heuristic and can miss valid secrets or flag non-secrets. Treat any finding as a reason to inspect and rotate credentials if the value was real.
