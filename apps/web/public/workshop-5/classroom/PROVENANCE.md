# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `c5af4914b74ffb3cc1e06e6028ff85f097177dc7` (8 commits on top of the base: the local SRE-agent console lab. Not yet upstream: Devin cannot push to `jyse/aetherlink-classroom-slides`.)
- Copied payload SHA-256 (all files here except this one, sorted by path): `d88e8e768d4a2f9754a324dabaccee1ba11370c726869d685f8580e2ce09c85a`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
