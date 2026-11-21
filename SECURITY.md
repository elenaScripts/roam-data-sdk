# Security

This library processes supplied data locally. It has no account connection, telemetry, background tasks, or runtime package dependencies. Applications using it are responsible for storage, access controls, and any external services they add.

Use synthetic data in public issues. Do not include private location history or other sensitive information in reports. Use GitHub's private vulnerability reporting when available; otherwise, ask the maintainer for a private contact method.

Validation checks data shape and numeric constraints. It is not a sandbox for executable JavaScript objects, and it does not establish that a location or timestamp is accurate. Prefer JSON input when processing untrusted datasets.
