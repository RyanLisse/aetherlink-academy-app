# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/RyanLisse/aetherlink-classroom-slides.git` (fork of `jyse/aetherlink-classroom-slides`)
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `79b50cef007e0c15ded353f1a9e68bbd6b2225e4` (W5 deck on the fork: the local SRE-agent console lab, review fixes, the on-call use case story and the INC-1001 scenario). `sessions.js` stays at the upstream base: the fork's version links decks that are not mirrored here.
- Copied payload SHA-256 (contents of all files here except this one, concatenated in `LC_ALL=C` path order): `cd782fbebe41ead769812858da1a04da706bffccb4c616424e8fbb1da77e9b9b`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```
