# Workshop 5 classroom deck provenance

- Source repository: `https://github.com/jyse/aetherlink-classroom-slides.git`
- Source commit: `c9111c354cb94975bb904e194529688d274a3ff0`
- Published entry point: `/workshop-5/classroom/workshop5.html`

Reproduce the static artifact from a checkout at the source commit:

```sh
source_dir=/Users/cortex-air/aetherlink-w5/classroom-slides
target_dir="/Users/cortex-air/Documents/ChatGPT/Aetherlink Slides/aetherlink-academy-app/apps/web/public/workshop-5/classroom"
mkdir -p "$target_dir"
cp "$source_dir"/{workshop5.html,workshop5-presenter.html,workshop5-slides.js,app.js,styles.css,presenter.js,timers.js,demo-fallback.js} "$target_dir"/
cp -R "$source_dir/assets" "$target_dir"/
```
