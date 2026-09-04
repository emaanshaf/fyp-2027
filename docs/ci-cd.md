# CI and CD

Three workflows, separated by what they cost and what they can break.

| Workflow | Trigger | Secrets | Consequence |
|---|---|---|---|
| `ci.yml` | every push and pull request | none | free, safe to run always |
| `cd.yml` | push to `main`, tag `v*` | `EXPO_TOKEN`, `DOCKERHUB_TOKEN` | spends build minutes, publishes images |
| `eas-submit.yml` | manual only | `EXPO_TOKEN` | builds and can submit to the stores |

## CI

Runs on everything and needs no credentials, so it works before any account
exists.

- **quality** — lint plus both jest projects, the Expo app and the Express API.
  Lint fails on errors only; the ~150 existing warnings would otherwise fail
  every run on debt unrelated to the change.
- **bundle** — `expo export` for android and ios. The unit tests mock freely
  and never prove the app assembles; this runs every module through the real
  Metro graph, which is what catches an unresolved import or a Babel plugin
  that moved between SDK versions.
- **api** — starts the server and runs `scripts/verify-deployment.js` against
  it. Catches a broken require chain or a route that fails to mount.
- **docker** — builds `server/Dockerfile`, then runs the image against a real
  Postgres in production mode and verifies it serves. The image sets
  `NODE_ENV=production`, and production refuses to start without a database,
  so a database is the only way to smoke test what actually ships.

## CD

Two triggers with deliberately different consequences:

- **push to `main`** → an internal preview build, so `main` is always
  installable.
- **tag `v*`** → a production build and a store submission.

Releases are tied to tags rather than to a branch so that shipping is an
explicit act with a name attached, and a merge can never put something in
front of users by accident. Production additionally verifies the live backend
before building, because `EXPO_PUBLIC_API_URL` is baked into the binary and
cannot be changed afterwards.

Both halves skip rather than fail when their credentials are missing, so the
file is inert until you are ready.

### Cutting a release

```bash
git tag v1.0.0
git push unibotverse v1.0.0
```

The first store submission of each app must be uploaded by hand — Play rejects
API submissions until a build exists in the console — so `eas submit` will fail
until that has been done once.

## Secrets and variables

Settings → Secrets and variables → Actions.

| Name | Kind | Where it comes from |
|---|---|---|
| `EXPO_TOKEN` | secret | expo.dev → Account Settings → Access Tokens |
| `DOCKERHUB_TOKEN` | secret | hub.docker.com → Account Settings → Personal access tokens |
| `DOCKERHUB_USERNAME` | variable, optional | defaults to `nabeel` |

Use a Docker Hub access token, not the account password: it can be scoped to
read/write without delete, and revoked on its own.

## The API image

Published to `docker.io/nabeel/qitabe-noor-api`, built for `linux/amd64` and
`linux/arm64`.

| Trigger | Tags |
|---|---|
| push to `main` | `latest`, `main`, `main-<sha>` |
| tag `v1.2.3` | `1.2.3`, `1.2`, `1`, `<sha>` |

Every image carries an immutable sha tag, so a deployment can name exactly what
it runs instead of chasing a moving `latest`.

```bash
docker pull nabeel/qitabe-noor-api:latest

docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")" \
  -e CORS_ORIGIN=https://qitabe-noor.app \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  nabeel/qitabe-noor-api:latest
```

Run the schema migration once against a new database before the first boot:

```bash
docker run --rm -e DATABASE_URL=postgresql://... nabeel/qitabe-noor-api npm run migrate
```

No secret is baked into the image; everything arrives as an environment
variable at run time, which is why it is safe to publish.
