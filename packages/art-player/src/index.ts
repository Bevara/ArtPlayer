/* <canvas is="art-player_1">: the universal canvas inside an ArtPlayer.
 *
 *   <script src="art-player_1.js"></script>
 *   <canvas is="art-player_1" src="movie.mpg" using="solver_1" with="libmpeg2_1"
 *           style="width: 640px; height: 360px"></canvas>
 *
 * The source is decoded by the Bevara pipeline - the solver named by using,
 * the accessors named by with - and drawn into the canvas, which ArtPlayer
 * drives as its video (option.proxy): its play, pause, volume, fullscreen and
 * progress controls reach the GPAC session. The progress bar and the time
 * show once the solver knows the duration of the source; a source whose
 * demultiplexer cannot tell it (an Ogg file read as a stream) plays without
 * them, since it cannot be sought. The element builds on universal-canvas_1,
 * whose attributes it keeps (script-directory, use-webcodec, noloop…), but
 * reads its source from src.
 *
 * On connection the canvas wraps itself in a container, which takes its
 * inline style and class, and hands itself to ArtPlayer, which moves it into
 * its template. ArtPlayer options can be given as JSON in options="…". */

import { UniversalCanvas } from '../../../../UCanvas'
// The UMD build: its module.exports is the class, which the player's tsconfig
// (CommonJS, no esModuleInterop) reaches as UCanvas.ts reaches JSZip.
// eslint-disable-next-line ts/no-require-imports
import Artplayer = require('../../artplayer/dist/artplayer.js')
import mediaFacade from '../../universal-canvas/src/media.js'

const GENERATION = 1
const TAG = `art-player_${GENERATION}`
// Set on the player while the source cannot be sought (duration unknown).
const UNSEEKABLE = 'art-player-unseekable'

// What the decoding session supports: no rate, no picture in picture; the
// rest of the interface works as with a video.
const DEFAULTS = {
  isLive: false,
  autoplay: false,
  hotkey: true,
  mutex: true,
  fullscreen: true,
  fullscreenWeb: true,
  setting: false,
  playbackRate: false,
  aspectRatio: false,
  pip: false,
  screenshot: false,
  miniProgressBar: false,
  autoPlayback: false,
}

class ArtPlayerCanvas extends UniversalCanvas {
  art: any = null
  host: HTMLDivElement = null
  media: any = null
  // Set while the canvas is moved around by the wrapping, or by ArtPlayer
  // building or tearing down its template: those moves are not the page's.
  private moving = false
  private started = false

  protected sourceAttribute(): string {
    return 'src'
  }

  private playerOptions() {
    let extra = {}
    const json = this.getAttribute('options')
    if (json) {
      try {
        extra = JSON.parse(json)
      }
      catch (e) {
        console.warn(`${TAG}: options is not valid JSON (${e.message})`)
      }
    }
    const option: any = { ...DEFAULTS, ...extra }
    for (const name of ['poster', 'theme', 'lang']) {
      if (this.hasAttribute(name))
        option[name] = this.getAttribute(name)
    }
    if (this.hasAttribute('volume'))
      option.volume = Number(this.getAttribute('volume'))
    if (this.hasAttribute('muted'))
      option.muted = true
    return option
  }

  // The container stands where the canvas was, sized as the canvas would be.
  private makeHost(): HTMLDivElement {
    const host = document.createElement('div')
    host.className = 'art-player-host'
    const style = this.getAttribute('style')
    if (style) {
      host.setAttribute('style', style)
      this.removeAttribute('style')
    }
    if (this.className) {
      host.className += ` ${this.className}`
    }
    const width = this.getAttribute('width')
    const height = this.getAttribute('height')
    if (!host.style.width)
      host.style.width = width ? `${width}px` : '100%'
    if (!host.style.height && !host.style.aspectRatio) {
      if (height)
        host.style.height = `${height}px`
      else host.style.aspectRatio = width && height ? `${width} / ${height}` : '16 / 9'
    }
    return host
  }

  private mount() {
    this.moving = true
    try {
      this.host = this.makeHost()
      this.parentNode.insertBefore(this.host, this)
      this.media = mediaFacade(this)
      const source = this.getAttribute('src') || ''
      let url = source
      try {
        url = new URL(source, window.location.href).href
      }
      catch { /* left as written: the session reports what it cannot open */ }
      this.art = new Artplayer({
        ...this.playerOptions(),
        container: this.host,
        url,
        proxy: () => this,
      })
      // ArtPlayer names its video "art-video"; the picture keeps its ratio.
      this.style.objectFit = 'contain'
      const $player = this.art.template.$player
      const showProgress = () => $player.classList.toggle(UNSEEKABLE, !this.media?.seekable)
      showProgress()
      this.addEventListener('durationchange', showProgress)
    }
    finally {
      this.moving = false
    }
  }

  connectedCallback() {
    if (this.moving)
      return
    if (!this.art)
      this.mount()
    if (!this.started) {
      this.started = true
      super.connectedCallback()
    }
  }

  disconnectedCallback() {
    if (this.moving)
      return
    // ArtPlayer moves its player around (into document.body for the web
    // fullscreen, and back): the canvas is connected again within the same
    // task. Only a canvas still out of the document was removed by the page.
    queueMicrotask(() => {
      if (!this.isConnected && this.art)
        this.teardown()
    })
  }

  // Removed by the page: the player goes with it.
  private teardown() {
    this.moving = true
    try {
      this.media?.destroy()
      this.art?.destroy(true)
      this.host?.remove()
    }
    finally {
      this.moving = false
    }
    this.art = null
    this.host = null
    this.media = null
    this.started = false
    super.disconnectedCallback()
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, ArtPlayerCanvas, { extends: 'canvas' })
}

if (typeof document !== 'undefined' && !document.getElementById(UNSEEKABLE)) {
  const style = document.createElement('style')
  style.id = UNSEEKABLE
  style.textContent = `.${UNSEEKABLE} .art-control-progress, .${UNSEEKABLE} .art-control-time { display: none !important; }`
  document.head.appendChild(style)
}

if (typeof window !== 'undefined') {
  (window as any).Artplayer ??= Artplayer
}

export { ArtPlayerCanvas }
