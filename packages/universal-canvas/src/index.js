import mediaFacade from './media.js'

/* Plays a source through the Bevara universal canvas inside ArtPlayer:
 *
 *   new Artplayer({
 *     container: '.artplayer-app',
 *     url: 'movie.ts',
 *     proxy: universalCanvas({ using: 'solver_1', with: 'rfmpgvid;ffmpeg', scriptDirectory: 'https://…/accessors/' }),
 *   })
 *
 * The proxy returns a <canvas is="universal-canvas_1"> that ArtPlayer drives as
 * its video: its play, pause and volume controls reach the GPAC session. The
 * element must be defined, by universal-canvas_1.js (or universal-tags_1.js)
 * on the page, or by the script named in option.script, loaded here. */

const TAG = 'universal-canvas_1'

function checkVersion(art) {
  const {
    version,
    utils: { errorHandle },
  } = art.constructor
  const arr = version.split('.').map(Number)
  const major = arr[0]
  const minor = arr[1] / 100
  errorHandle(
    major + minor >= 5.01,
    `Artplayer.js@${version} is not compatible the universalCanvas. Please update it to version Artplayer.js@5.1.0 or later (option.proxy)`,
  )
}

function loadScript(src) {
  if (!src || customElements.get(TAG) || document.querySelector(`script[src="${src}"]`))
    return
  const script = document.createElement('script')
  script.src = src
  document.head.appendChild(script)
}

export default function universalCanvas(option = {}) {
  return (art) => {
    checkVersion(art)

    const { validator } = art.constructor

    option = validator(
      {
        using: '',
        with: '',
        scriptDirectory: '',
        script: '',
        useWebcodec: false,
        loop: true,
        ...option,
      },
      {
        using: 'string',
        with: '?string',
        scriptDirectory: '?string',
        script: '?string',
        useWebcodec: '?boolean',
        loop: '?boolean',
      },
    )

    loadScript(option.script)

    const canvas = document.createElement('canvas', { is: TAG })
    canvas.setAttribute('is', TAG)
    canvas.setAttribute('data-url', art.option.url)
    canvas.setAttribute('using', option.using)
    if (option.with)
      canvas.setAttribute('with', option.with)
    if (option.scriptDirectory)
      canvas.setAttribute('script-directory', option.scriptDirectory)
    if (option.useWebcodec)
      canvas.setAttribute('use-webcodec', '')
    if (!option.loop)
      canvas.setAttribute('noloop', '')

    const media = mediaFacade(canvas)
    art.on('destroy', () => media.destroy())

    return canvas
  }
}

if (typeof window !== 'undefined') {
  window.universalCanvas = universalCanvas
}
