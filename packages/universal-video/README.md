# universal-video

Bevara universal video plugin for ArtPlayer: a source the browser cannot
decode is transcoded by a hidden `<video is="universal-video_1">` (the Bevara
pipeline, compiled to WebAssembly), and ArtPlayer switches to the playable file
it hands back.

## Usage

```js
const art = new Artplayer({
  container: '.artplayer-app',
  url: 'https://bevara.ddns.net/test-signals/mpeg1/medical_demo.ts',
  plugins: [
    universalVideo({
      using: 'solver_1',
      with: 'm2psdmx_1;rfmpgvid_1;ffmpeg_1;mp4mx_1;rfnalu_1',
      scriptDirectory: 'https://bevara.ddns.net/accessors/',
    }),
  ],
})
```

`universal-video_1.js` (the `universal-tags` package of the Bevara registry)
must be on the page, or named in `script`.

## License

MIT
