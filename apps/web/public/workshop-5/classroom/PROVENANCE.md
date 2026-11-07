# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/RyanLisse/aetherlink-classroom-slides.git` (fork of `jyse/aetherlink-classroom-slides`)
- Upstream base commit: `77c375982f922d057823f45c7f41b718149d008f`
- Source commit: `79b50cef007e0c15ded353f1a9e68bbd6b2225e4` (W5 deck on the fork: the local SRE-agent console lab, review fixes, the on-call use case story and the INC-1001 scenario). `sessions.js` stays at the upstream base: the fork's version links decks that are not mirrored here.
- Current payload SHA-256 (contents of all files here except this one, concatenated in `LC_ALL=C` path order): `5af274cd1aae2857a23f13c65e0b8441d05ec1b412e746c8faa3d757001fcff1`
- Academy adaptation: assignments 1–9 and the daily-brief bonus now lead with copyable Claude Code prompts, participant choices and visible checks. Solved tags are comparison material after an attempt. The SRE lab stays local; human approval and hook ownership remain explicit.
- Lab instructions checked against `RyanLisse/sre-oncall-agent` branch `workshop/start` at `4c4e3fc7b5310225f35f5629c0e91db58e579d4f`. The README says not to push or open a PR; the git gate is reference material here. The upstream classroom source above predates these Academy edits.
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the original mirror from a checkout at the source commit. This does not include the Academy adaptation listed above:

```sh
source_dir=path/to/aetherlink-classroom-slides
target_dir=apps/web/public/workshop-5/classroom
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,sessions.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
# then keep only the assets the W5 deck references
```

Verify the current payload checksum from the repository root:

```sh
find apps/web/public/workshop-5/classroom -type f ! -name PROVENANCE.md -print | LC_ALL=C sort | while IFS= read -r file; do cat "$file"; done | shasum -a 256
```
