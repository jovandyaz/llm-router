# Security policy

## Supported versions

Only the latest published `0.x` release receives fixes. Upgrade to it before reporting.

## Reporting a vulnerability

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue, pull request or discussion for a security problem.

Include the affected version, a minimal reproduction and the impact you expect. You will get an acknowledgement within 7 days and a fix or a decision within 30 days of that.

## Scope

In scope: anything in the published package that lets untrusted input crash the host process, hang it (for example a regular expression with catastrophic backtracking), read or write outside what the caller passed in, or make the package reach the network without the caller asking.

Out of scope: the prompt-injection guard is a heuristic. An input it scores as safe is a detection gap, not a vulnerability; report it as a regular issue with the text that slipped through.
