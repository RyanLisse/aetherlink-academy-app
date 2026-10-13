# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `20a1b988b0dafaff95e1658f6a27055bd4039f23` (7 commits on top of the base: the local SRE-agent console lab. Not yet upstream: Devin cannot push to `jyse/aetherlink-classroom-slides`.)
- Copied payload SHA-256 (all files here except this one, sorted by path): `5804ba47c187ef625c33724113912398411b90aa876292c57852c7a96eb398ae`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
