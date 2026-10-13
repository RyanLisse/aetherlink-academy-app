# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `ec1baf34e3633c6f9ff8a90707d3a6848e89144f` (5 commits on top of the base: the local SRE-agent console lab. Not yet upstream: Devin cannot push to `jyse/aetherlink-classroom-slides`.)
- Copied payload SHA-256 (all files here except this one, sorted by path): `66d4a80d9abd63e3f0cf2293fdd766902b01bea863cd3c974825762db2690c43`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
