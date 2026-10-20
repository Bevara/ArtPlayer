# art-player

`<canvas is="art-player_1">`: the Bevara universal canvas inside an ArtPlayer.
The source is decoded by the Bevara pipeline — the solver named by `using`,
the accessors named by `with`, compiled to WebAssembly — and drawn into the
canvas, which ArtPlayer drives as its video: play, pause, volume, web and
native fullscreen, hotkeys, and the progress bar with seeking once the solver
knows the duration of the source. A source whose demultiplexer cannot tell it
(an Ogg file read as a stream) plays without progress bar: it cannot be sought.

```html
<canvas
  is="art-player_1"
  src="movie.mpg"
  using="solver_1"
  with="libmpeg2_1"
  style="width: 640px; height: 360px"
></canvas>
<script src="art-player_1.js"></script>
```

`art-player_1.js` carries everything: the universal canvas, ArtPlayer and the
bridge between them. The element builds on `universal-canvas_1` and keeps its
attributes (`script-directory`, `use-webcodec`, `noloop`, …), but reads its
source from `src`.

| Attribute                                    |                                                              |
| -------------------------------------------- | ------------------------------------------------------------ |
| `src`                                        | the source                                                   |
| `using`, `with`                              | the solver and the accessors (`;`-separated)                 |
| `options`                                    | ArtPlayer options, as JSON: `options='{"theme": "#e1001a"}'` |
| `poster`, `theme`, `lang`, `volume`, `muted` | shorthands for the same ArtPlayer options                    |

The canvas wraps itself in a `<div class="art-player-host">`, which takes its
inline style and class: size the element as usual.

## Registry

This directory is a Bevara tags package (`art-player.json`), which extends
`universal-canvas_1`:

```sh
bevara publish --build                       # builds dist/art-player_1.js, then publishes it
bevara update-page index.html --tags art-player --write
```

The build uses the player's toolchain (`webpack.config.cjs`), this repository
being the player's `webinterface/ArtPlayer`: it bundles `../../../../UCanvas.ts`,
`../artplayer/dist/artplayer.js` and `../universal-canvas/src/media.js`.

## License

MIT (ArtPlayer, this element) and LGPL-3.0-or-later (the universal canvas).
