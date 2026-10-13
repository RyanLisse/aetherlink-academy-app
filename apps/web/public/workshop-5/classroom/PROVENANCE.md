# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `da122c1b3871bd7c706245aa80c0b0e1d19b5e3c` (6 commits on top of the base: the local SRE-agent console lab. Not yet upstream: Devin cannot push to `jyse/aetherlink-classroom-slides`.)
- Copied payload SHA-256 (all files here except this one, sorted by path): `3e1f8f9e8b265990be0a396678718fabeee5e05d0cc3b951e046f76c150177c8`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
