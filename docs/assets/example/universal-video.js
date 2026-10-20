// universal-video_1.js (Bevara universal tags) transcodes what the browser cannot play
const art = new Artplayer({
  container: '.artplayer-app',
  url: 'https://bevara.github.io/Showcase/mpeg2-canvas/centaur_1.mpg',
  autoSize: true,
  fullscreen: true,
  fullscreenWeb: true,
  plugins: [
    universalVideo({
      using: 'solver_1',
      with: 'libmpeg2_1',
      scriptDirectory: 'https://registry.bevara.ddns.net/accessors/',
      script: 'https://registry.bevara.ddns.net/accessors/universal-video_1.js',
    }),
  ],
})
