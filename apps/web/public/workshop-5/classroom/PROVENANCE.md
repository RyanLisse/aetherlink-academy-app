# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `fecceca2be727e408f30fa2881489653d6550a31` (4 commits on top of the base: the local SRE-agent console lab. Not yet upstream: Devin cannot push to `jyse/aetherlink-classroom-slides`.)
- Copied payload SHA-256 (all files here except this one, sorted by path): `1b3b0df51ed0e3a8cb6d0c411f639fe4affadff9a8076cbfa133b0b2bbda2041`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
