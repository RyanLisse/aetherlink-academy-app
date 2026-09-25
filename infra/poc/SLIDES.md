# Academy Slides image

This recipe packages the real Slides scaffold at `/tmp/academy-slides-service`.
It runs the scaffold's `pnpm build` and starts the generated Nitro node server
from `.output/server/index.mjs`. The runtime listens on `0.0.0.0:3000`; provide
`DATABASE_URL` at runtime, pointing at persistent PostgreSQL for a deployment.
`/data` is available as a volume for local PGlite or other file-backed state.

Build from the scaffold root so its source and lockfile are the inputs. The
portable command below creates a temporary filtered context because the
scaffold's checked-in `.dockerignore` omits `server/` and `types/`, which
production compilation needs. `COPYFILE_DISABLE=1` prevents macOS AppleDouble
metadata from becoming apparent `._*.ts` source files in the context.

```sh
build_context_dir="$(mktemp -d /tmp/academy-slides-poc/slides-build.XXXXXX)"
trap 'rm -rf "$build_context_dir"' EXIT
COPYFILE_DISABLE=1 rsync -a \
  --exclude-from=/tmp/academy-slides-poc/infra/poc/slides.dockerignore \
  /tmp/academy-slides-service/ "$build_context_dir/"
cp /tmp/academy-slides-poc/infra/poc/slides.Dockerfile "$build_context_dir/Dockerfile"
docker build \
  --file "$build_context_dir/Dockerfile" \
  --build-arg SOURCE_REVISION="$(git -C /tmp/academy-slides-service rev-parse HEAD)" \
  --tag academy-slides-poc:local \
  "$build_context_dir"
```

Run a local smoke instance with a disposable PGlite database:

```sh
docker run --rm --init \
  --publish 3000:3000 \
  --env DATABASE_URL=pglite:/data/pglite \
  --volume academy-slides-poc-data:/data \
  academy-slides-poc:local
```

The image healthcheck calls `/_agent-native/ping`. A deployment should set its
own `DATABASE_URL` and other provider configuration as runtime secrets; no
`.env` file is part of the build context or image. For the local PGlite smoke,
the server may create schema state in the named volume.

Reproducibility comes from three pins: the base image is digest-pinned in the
Dockerfile, the package manager is pnpm `10.14.0`, and `pnpm install
--frozen-lockfile` consumes the scaffold's `pnpm-lock.yaml`. The scaffold
declares `@agent-native/core` `0.182.1`; the lockfile records its registry
integrity and transitive resolutions. The supplied upstream lineage is
recorded as `UPSTREAM_CORE_REVISION=adec853eb337cbe0ead48464305d6f30cc07806e`
in the image label. Set `SOURCE_REVISION` to the exact scaffold commit for
release identity; leaving it at `unknown` is suitable only for ad hoc local
builds.

The recipe does not copy application source into the runtime layer. It copies
the generated `.output`, production dependencies, and package metadata only.
