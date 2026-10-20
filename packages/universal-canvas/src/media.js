/* Makes a universal canvas (<canvas is="universal-canvas_1">) answer like an
 * HTMLMediaElement, so that ArtPlayer can drive it as its video (option.proxy).
 *
 * The GPAC session draws straight into the canvas and starts playing as soon
 * as it is set up; it reports nothing on its own, and its decodingPromise
 * settles when it ends. Its state is therefore polled: the session is up once
 * get_properties answers, its picture size is known once width is set, and
 * the solver gives the playback position and the duration (currentTime,
 * duration, -1 while unknown). Play, pause, volume and seeking are forwarded
 * to the solver. Seeking needs a known duration: a source whose demultiplexer
 * cannot tell it (an Ogg file read through httpin) stays unseekable, and its
 * duration NaN. A solver too old to give the position has it estimated. */

const POLL_MS = 250
// An audio-only session never reports a picture size: ready anyway after this.
const AUDIO_READY_MS = 3000
// After a seek the outputs report the old position until their next frame:
// their reports are ignored until near the target, or for this long.
const SEEK_SETTLE_MS = 2000
const SEEK_NEAR_S = 1.5

const ranges = end => ({ length: end ? 1 : 0, start: () => 0, end: () => end })

// The accessor of the universal canvas class (play, pause, volume…), which the
// facade shadows on the instance and still needs to reach the solver.
function inherited(el, name) {
  for (let p = Object.getPrototypeOf(el); p; p = Object.getPrototypeOf(p)) {
    const d = Object.getOwnPropertyDescriptor(p, name)
    if (d)
      return d
  }
  return null
}

export default function mediaFacade(canvas) {
  if (canvas.__universalMedia)
    return canvas.__universalMedia

  // Looked up when used: the element may be upgraded after the facade is made.
  const solverPlay = () => inherited(canvas, 'play')?.value?.call(canvas)
  const solverPause = () => inherited(canvas, 'pause')?.value?.call(canvas)
  const solverVolume = value => inherited(canvas, 'volume')?.set?.call(canvas, value)
  const solverSet = properties => Promise.resolve(canvas._messageHandlerNoWorker?.({ data: { event: 'set_properties', properties } }))
    .catch(e => console.warn(`[universal-canvas] ${Object.keys(properties).join(', ')}: ${e.message}`))

  const state = {
    ready: false,
    paused: true,
    ended: false,
    volume: 1,
    muted: false,
    currentTime: 0,
    // Whether the solver gives the position; else it is estimated.
    reportsTime: false,
    duration: Number.NaN,
    seekTarget: null,
    seekAt: 0,
    videoWidth: 0,
    videoHeight: 0,
    lastTick: 0,
    upSince: 0,
    polling: false,
    timer: null,
  }

  const fire = type => canvas.dispatchEvent(new Event(type))
  const seekable = () => Number.isFinite(state.duration)

  // The solver takes the volume of its audio output in percent, as a string.
  function sendVolume() {
    if (!state.ready)
      return
    try {
      solverVolume(String(Math.round((state.muted ? 0 : state.volume) * 100)))
    }
    catch (e) {
      console.warn(`[universal-canvas] volume: ${e.message}`)
    }
  }

  function setPlaying(playing) {
    if (playing === !state.paused)
      return
    state.paused = !playing
    state.lastTick = performance.now()
    fire(playing ? 'play' : 'pause')
    if (playing)
      fire('playing')
  }

  function onTime(time) {
    const now = performance.now()
    if (state.seekTarget !== null) {
      if (Math.abs(time - state.seekTarget) > SEEK_NEAR_S && now - state.seekAt < SEEK_SETTLE_MS)
        return
      state.seekTarget = null
    }
    state.reportsTime = true
    state.currentTime = time
  }

  function onDuration(duration) {
    if (!(duration > 0) || duration === state.duration)
      return
    state.duration = duration
    fire('durationchange')
  }

  async function poll() {
    // Not running yet: the solver's script or module is still loading.
    if (state.polling || !canvas._messageHandlerNoWorker || !canvas.properties)
      return
    state.polling = true
    let props = null
    try {
      props = await canvas.properties(['width', 'height', 'currentTime', 'duration'])
    }
    catch {
      return
    }
    finally {
      state.polling = false
    }
    if (!props)
      return
    const now = performance.now()
    state.upSince ||= now
    if (props.width > 0 && props.height > 0) {
      state.videoWidth = props.width
      state.videoHeight = props.height
    }
    if (props.currentTime >= 0)
      onTime(props.currentTime)
    onDuration(props.duration)
    if (!state.ready && (state.videoWidth || now - state.upSince > AUDIO_READY_MS)) {
      state.ready = true
      sendVolume()
      for (const type of ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'])
        fire(type)
      setPlaying(true)
    }
  }

  function tick() {
    if (!state.paused && !state.ended) {
      const now = performance.now()
      if (!state.reportsTime)
        state.currentTime += (now - state.lastTick) / 1000
      state.lastTick = now
      fire('timeupdate')
    }
    if (!state.ended)
      poll()
  }

  function seek(value) {
    const time = Number(value)
    if (!state.ready || state.ended || !seekable() || !Number.isFinite(time))
      return
    const target = Math.min(Math.max(0, time), state.duration)
    state.seekTarget = target
    state.seekAt = performance.now()
    state.currentTime = target
    fire('seeking')
    solverSet({ seek: target })
    fire('timeupdate')
    fire('seeked')
  }

  // The session ends (or fails) once: the decodingPromise is set when the
  // element is connected, possibly after the facade was made.
  let watched = false
  function watchEnd() {
    if (watched || !canvas.decodingPromise)
      return
    watched = true
    canvas.decodingPromise.then(
      () => {
        state.ended = true
        setPlaying(false)
        fire('ended')
      },
      () => {
        state.ended = true
        setPlaying(false)
        fire('error')
      },
    )
  }

  state.timer = setInterval(() => {
    watchEnd()
    tick()
  }, POLL_MS)

  Object.defineProperties(canvas, {
    paused: { get: () => state.paused, configurable: true },
    playing: { get: () => state.ready && !state.paused && !state.ended, configurable: true },
    ended: { get: () => state.ended, configurable: true },
    readyState: { get: () => (state.ready ? 4 : 0), configurable: true },
    networkState: { get: () => (state.ended ? 1 : 2), configurable: true },
    seeking: { get: () => state.seekTarget !== null, configurable: true },
    currentTime: { get: () => state.currentTime, set: seek, configurable: true },
    duration: { get: () => state.duration, configurable: true },
    playbackRate: { get: () => 1, set: () => {}, configurable: true },
    defaultPlaybackRate: { get: () => 1, set: () => {}, configurable: true },
    buffered: { get: () => ranges(0), configurable: true },
    seekable: { get: () => ranges(seekable() ? state.duration : 0), configurable: true },
    played: { get: () => ranges(0), configurable: true },
    videoWidth: { get: () => state.videoWidth, configurable: true },
    videoHeight: { get: () => state.videoHeight, configurable: true },
    volume: {
      get: () => state.volume,
      set: (value) => {
        const v = Math.min(1, Math.max(0, Number(value) || 0))
        if (v === state.volume)
          return
        state.volume = v
        sendVolume()
        fire('volumechange')
      },
      configurable: true,
    },
    muted: {
      get: () => state.muted,
      set: (value) => {
        if (!!value === state.muted)
          return
        state.muted = !!value
        sendVolume()
        fire('volumechange')
      },
      configurable: true,
    },
    play: {
      value() {
        if (state.ended)
          return Promise.reject(new DOMException('The session has ended', 'InvalidStateError'))
        if (state.ready) {
          solverPlay()
          setPlaying(true)
        }
        return Promise.resolve()
      },
      configurable: true,
      writable: true,
    },
    pause: {
      value() {
        if (state.ready && !state.paused) {
          solverPause()
          setPlaying(false)
        }
      },
      configurable: true,
      writable: true,
    },
    canPlayType: { value: () => '', configurable: true, writable: true },
  })

  const facade = {
    // Whether the source can be sought: its duration is known.
    get seekable() {
      return seekable()
    },
    destroy() {
      clearInterval(state.timer)
      state.timer = null
      delete canvas.__universalMedia
    },
  }
  canvas.__universalMedia = facade
  return facade
}
