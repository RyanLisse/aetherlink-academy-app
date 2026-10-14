# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/RyanLisse/aetherlink-classroom-slides.git` (fork of `jyse/aetherlink-classroom-slides`)
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `ee7cf611bcbb68dfe204521f7a2ddddb85d7de0b` (W5 deck on the fork: the local SRE-agent console lab, review fixes and the INC-1001 scenario). `sessions.js` stays at the upstream base: the fork's version links decks that are not mirrored here.
- Copied payload SHA-256 (contents of all files here except this one, concatenated in `LC_ALL=C` path order): `8ff8aa3b75ede294392d5f5ebec38ceee0f7c1936eba58e25607eea2e48729e6`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
