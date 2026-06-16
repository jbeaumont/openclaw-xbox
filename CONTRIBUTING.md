# Contributing

## Development

```bash
npm install
npm run typecheck
npm test          # offline suite (node:test + tsx)
npm run rebuild   # cleans and rebuilds dist/
```

The compiled `dist/` is committed so git installs work without a build step. CI
fails if `dist/` drifts from `src/` — run `npm run rebuild` and commit before
pushing.

### Live tests (optional)

The live smoke tests are skipped unless an API key is provided. They are
read-only and never touch write endpoints:

```bash
OPENCLAW_XBOX_API_KEY=your_key npm run test:live
```

### Local install for testing

```bash
openclaw plugins install --link .
openclaw gateway restart
openclaw plugins inspect openclaw-xbox --runtime --json
```

## Releasing / publishing to ClawHub

1. Bump the version in `package.json` and update `CHANGELOG.md`.
2. Merge to `master` (CI must be green).
3. Tag the release and publish:

```bash
git checkout master && git pull
git tag vX.Y.Z && git push origin vX.Y.Z

npm i -g clawhub
clawhub login
clawhub package publish . --family code-plugin --dry-run   # preview
clawhub package publish . --family code-plugin
```

Push the tag before publishing so the `@vX.Y.Z` source provenance resolves.
