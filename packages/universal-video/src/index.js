/* Plays a source the browser cannot decode by transcoding it first through the
 * Bevara universal video (<video is="universal-video_1">), hidden in the
 * player: once it hands back a playable file, ArtPlayer switches to it.
 * The element must be defined, by universal-video_1.js (or
 * universal-tags_1.js) on the page, or by the script named in option.script. */

const TAG = 'universal-video_1'

function checkVersion(art) {
  const {
    version,
    utils: { errorHandle },
  } = art.constructor
  const arr = version.split('.').map(Number)
  const major = arr[0]
  const minor = arr[1] / 100
  errorHandle(
    major + minor >= 5,
    `Artplayer.js@${version} is not compatible the universalVideo. Please update it to version Artplayer.js@5.x.x`,
  )
}

function loadScript(src) {
  if (!src || customElements.get(TAG) || document.querySelector(`script[src="${src}"]`))
    return
  const script = document.createElement('script')
  script.src = src
  document.head.appendChild(script)
}

export default function universalVideo(option = {}) {
  return (art) => {
    checkVersion(art)

    const {
      template: { $player },
      constructor: {
        validator,
        utils: { append, setStyle },
      },
    } = art

    option = validator(
      {
        using: '',
        with: '',
        scriptDirectory: '',
        script: '',
        useCache: false,
        useWorker: false,
        useWebcodec: false,
        ...option,
      },
      {
        using: '?string',
        with: '?string',
        scriptDirectory: '?string',
        script: '?string',
        useCache: '?boolean',
        useWorker: '?boolean',
        useWebcodec: '?boolean',
      },
    )

    loadScript(option.script)

    // The source fails natively until the transcoded file is ready: keep the
    // player waiting instead of giving up after a few reconnections.
    art.constructor.RECONNECT_TIME_MAX = Number.MAX_SAFE_INTEGER

    const video = document.createElement('video', { is: TAG })
    video.setAttribute('is', TAG)
    const source = art.option.url
    if (source)
      video.setAttribute('src', source)
    if (option.using)
      video.setAttribute('using', option.using)
    if (option.with)
      video.setAttribute('with', option.with)
    if (option.scriptDirectory)
      video.setAttribute('script-directory', option.scriptDirectory)
    if (option.useCache)
      video.setAttribute('use-cache', '')
    if (option.useWorker)
      video.setAttribute('use-worker', '')
    if (option.useWebcodec)
      video.setAttribute('use-webcodec', '')

    video.addEventListener('ready', () => {
      art.url = video.src
    })

    setStyle(video, 'display', 'none')
    art.template.$universalVideo = append($player, video)

    return {
      name: 'universalVideo',
    }
  }
}

if (typeof window !== 'undefined') {
  window.universalVideo = universalVideo
}
