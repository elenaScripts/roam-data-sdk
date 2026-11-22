# Contributing

Run `npm ci`, then `npm run check`. Keep changes focused and add meaningful tests for changed behavior. Use synthetic fixtures and preserve the documented coordinate, time, and segment conventions.

Keep the core library independent of external services and file storage. Do not add private datasets, local configuration, or generated build files to commits.

## Project scope

This repository is an offline data library. Account sign-in, tracker connections, private API clients, scraping, and live polling are outside its scope. Examples and tests must work with synthetic data without contacting tracker services.

Any future proposal to connect to a provider's private endpoints requires explicit written permission from that provider before implementation or testing. Account-owner consent, an unofficial label, and an open-source license do not replace that permission. Keep private correspondence and account information out of commits, issues, and pull requests.

Contributions to the original code are submitted under the repository's MIT license. Retain any notices required by third-party code.
