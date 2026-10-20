# universal-canvas

Bevara universal canvas proxy for ArtPlayer: the source is decoded by the
Bevara pipeline (a GPAC solver and its accessors, compiled to WebAssembly) and
drawn into a `<canvas is="universal-canvas_1">`, which ArtPlayer drives as its
video through `option.proxy`. Play, pause, volume and seeking reach the
decoding session; the position and the duration come from the solver. A source
whose duration the solver cannot tell (an Ogg file read as a stream) cannot be
sought: set `isLive: true` for those.

## Usage

```html
<script src="universal-canvas_1.js"></script>
<script src="artplayer.js"></script>
<script src="universal-canvas.js"></script>
<div class="artplayer-app" style="width: 640px; height: 360px"></div>
<script>
  const art = new Artplayer({
    container: '.artplayer-app',
    url: 'https://bevara.ddns.net/test-signals/mpeg1/medical_demo.ts',
    proxy: universalCanvas({
      using: 'solver_1',
      with: 'rfmpgvid_1;ffmpeg_1',
      scriptDirectory: 'https://bevara.ddns.net/accessors/',
    }),
  })
</script>
```

`universal-canvas_1.js` comes from the `universal-tags` package of the Bevara
registry. For a page that only needs the player, the `art-player` tags package
(`packages/art-player`) bundles all of it in one element.

## License

MIT
