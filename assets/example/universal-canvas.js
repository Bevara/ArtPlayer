// The Bevara universal canvas draws the decoded source; ArtPlayer drives it
const art = new Artplayer({
  container: '.artplayer-app',
  url: 'https://bevara.github.io/Showcase/mpeg2-canvas/centaur_1.mpg',
  fullscreen: true,
  fullscreenWeb: true,
  proxy: universalCanvas({
    using: 'solver_1',
    with: 'libmpeg2_1',
    scriptDirectory: 'https://registry.bevara.ddns.net/accessors/',
    script: 'https://registry.bevara.ddns.net/accessors/universal-canvas_1.js',
  }),
})
