# LOCAL-PUBLISH-TEST

This repository is used for control-plane acceptance tests.

It is not a product codebase. Its sole purpose is to exercise the control plane's
publish pipeline end to end: changes committed on an `agent/<id>` branch are
published by the control plane and then verified against the expected state.

## What is being tested

- Branch selection and isolation for `agent/<id>` branches
- Commit, publish, and read-back round trips through the control plane
- Correct propagation of file contents added or modified by an agent

## Expected contents

The repository is intentionally minimal. Aside from `README.md`, this file is
the only expected content and acts as the marker that a publish succeeded.

## Do not

- Do not add application code, dependencies, or build tooling here.
- Do not reuse this repository as a template for real projects.
