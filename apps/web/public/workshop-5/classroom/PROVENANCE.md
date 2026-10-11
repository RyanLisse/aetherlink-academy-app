# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Source commit: `26822d7e44d215a2427ed26585857daf745c7485`
- Copied payload SHA-256: `aa126af7d78d7400fd0e413614b712c9b20f03ceccb45de302c0d1a4122c81ab`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=/Users/cortex-air/aetherlink-w5/classroom-slides
target_dir="/Users/cortex-air/Documents/ChatGPT/Aetherlink Slides/aetherlink-academy-app/apps/web/public/workshop-5/classroom"
mkdir -p "$target_dir"
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
```
