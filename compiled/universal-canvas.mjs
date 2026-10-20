/*!
 * universal-canvas.js v1.0.0
 * Github: https://github.com/zhw2590582/ArtPlayer
 * (c) 2017-2026 Harvey Zhao
 * Released under the MIT License.
 */
const POLL_MS = 250;
const AUDIO_READY_MS = 3e3;
const SEEK_SETTLE_MS = 2e3;
const SEEK_NEAR_S = 1.5;
const ranges = (end) => ({ length: end ? 1 : 0, start: () => 0, end: () => end });
function inherited(el, name) {
  for (let p = Object.getPrototypeOf(el); p; p = Object.getPrototypeOf(p)) {
    const d = Object.getOwnPropertyDescriptor(p, name);
    if (d)
      return d;
  }
  return null;
}
function mediaFacade(canvas) {
  if (canvas.__universalMedia)
    return canvas.__universalMedia;
  const solverPlay = () => inherited(canvas, "play")?.value?.call(canvas);
  const solverPause = () => inherited(canvas, "pause")?.value?.call(canvas);
  const solverVolume = (value) => inherited(canvas, "volume")?.set?.call(canvas, value);
  const solverSet = (properties) => Promise.resolve(canvas._messageHandlerNoWorker?.({ data: { event: "set_properties", properties } })).catch((e) => console.warn(`[universal-canvas] ${Object.keys(properties).join(", ")}: ${e.message}`));
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
    timer: null
  };
  const fire = (type) => canvas.dispatchEvent(new Event(type));
  const seekable = () => Number.isFinite(state.duration);
  function sendVolume() {
    if (!state.ready)
      return;
    try {
      solverVolume(String(Math.round((state.muted ? 0 : state.volume) * 100)));
    } catch (e) {
      console.warn(`[universal-canvas] volume: ${e.message}`);
    }
  }
  function setPlaying(playing) {
    if (playing === !state.paused)
      return;
    state.paused = !playing;
    state.lastTick = performance.now();
    fire(playing ? "play" : "pause");
    if (playing)
      fire("playing");
  }
  function onTime(time) {
    const now = performance.now();
    if (state.seekTarget !== null) {
      if (Math.abs(time - state.seekTarget) > SEEK_NEAR_S && now - state.seekAt < SEEK_SETTLE_MS)
        return;
      state.seekTarget = null;
    }
    state.reportsTime = true;
    state.currentTime = time;
  }
  function onDuration(duration) {
    if (!(duration > 0) || duration === state.duration)
      return;
    state.duration = duration;
    fire("durationchange");
  }
  async function poll() {
    if (state.polling || !canvas._messageHandlerNoWorker || !canvas.properties)
      return;
    state.polling = true;
    let props = null;
    try {
      props = await canvas.properties(["width", "height", "currentTime", "duration"]);
    } catch {
      return;
    } finally {
      state.polling = false;
    }
    if (!props)
      return;
    const now = performance.now();
    state.upSince || (state.upSince = now);
    if (props.width > 0 && props.height > 0) {
      state.videoWidth = props.width;
      state.videoHeight = props.height;
    }
    if (props.currentTime >= 0)
      onTime(props.currentTime);
    onDuration(props.duration);
    if (!state.ready && (state.videoWidth || now - state.upSince > AUDIO_READY_MS)) {
      state.ready = true;
      sendVolume();
      for (const type of ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"])
        fire(type);
      setPlaying(true);
    }
  }
  function tick() {
    if (!state.paused && !state.ended) {
      const now = performance.now();
      if (!state.reportsTime)
        state.currentTime += (now - state.lastTick) / 1e3;
      state.lastTick = now;
      fire("timeupdate");
    }
    if (!state.ended)
      poll();
  }
  function seek(value) {
    const time = Number(value);
    if (!state.ready || state.ended || !seekable() || !Number.isFinite(time))
      return;
    const target = Math.min(Math.max(0, time), state.duration);
    state.seekTarget = target;
    state.seekAt = performance.now();
    state.currentTime = target;
    fire("seeking");
    solverSet({ seek: target });
    fire("timeupdate");
    fire("seeked");
  }
  let watched = false;
  function watchEnd() {
    if (watched || !canvas.decodingPromise)
      return;
    watched = true;
    canvas.decodingPromise.then(
      () => {
        state.ended = true;
        setPlaying(false);
        fire("ended");
      },
      () => {
        state.ended = true;
        setPlaying(false);
        fire("error");
      }
    );
  }
  state.timer = setInterval(() => {
    watchEnd();
    tick();
  }, POLL_MS);
  Object.defineProperties(canvas, {
    paused: { get: () => state.paused, configurable: true },
    playing: { get: () => state.ready && !state.paused && !state.ended, configurable: true },
    ended: { get: () => state.ended, configurable: true },
    readyState: { get: () => state.ready ? 4 : 0, configurable: true },
    networkState: { get: () => state.ended ? 1 : 2, configurable: true },
    seeking: { get: () => state.seekTarget !== null, configurable: true },
    currentTime: { get: () => state.currentTime, set: seek, configurable: true },
    duration: { get: () => state.duration, configurable: true },
    playbackRate: { get: () => 1, set: () => {
    }, configurable: true },
    defaultPlaybackRate: { get: () => 1, set: () => {
    }, configurable: true },
    buffered: { get: () => ranges(0), configurable: true },
    seekable: { get: () => ranges(seekable() ? state.duration : 0), configurable: true },
    played: { get: () => ranges(0), configurable: true },
    videoWidth: { get: () => state.videoWidth, configurable: true },
    videoHeight: { get: () => state.videoHeight, configurable: true },
    volume: {
      get: () => state.volume,
      set: (value) => {
        const v = Math.min(1, Math.max(0, Number(value) || 0));
        if (v === state.volume)
          return;
        state.volume = v;
        sendVolume();
        fire("volumechange");
      },
      configurable: true
    },
    muted: {
      get: () => state.muted,
      set: (value) => {
        if (!!value === state.muted)
          return;
        state.muted = !!value;
        sendVolume();
        fire("volumechange");
      },
      configurable: true
    },
    play: {
      value() {
        if (state.ended)
          return Promise.reject(new DOMException("The session has ended", "InvalidStateError"));
        if (state.ready) {
          solverPlay();
          setPlaying(true);
        }
        return Promise.resolve();
      },
      configurable: true,
      writable: true
    },
    pause: {
      value() {
        if (state.ready && !state.paused) {
          solverPause();
          setPlaying(false);
        }
      },
      configurable: true,
      writable: true
    },
    canPlayType: { value: () => "", configurable: true, writable: true }
  });
  const facade = {
    // Whether the source can be sought: its duration is known.
    get seekable() {
      return seekable();
    },
    destroy() {
      clearInterval(state.timer);
      state.timer = null;
      delete canvas.__universalMedia;
    }
  };
  canvas.__universalMedia = facade;
  return facade;
}
const TAG = "universal-canvas_1";
function checkVersion(art) {
  const {
    version,
    utils: { errorHandle }
  } = art.constructor;
  const arr = version.split(".").map(Number);
  const major = arr[0];
  const minor = arr[1] / 100;
  errorHandle(
    major + minor >= 5.01,
    `Artplayer.js@${version} is not compatible the universalCanvas. Please update it to version Artplayer.js@5.1.0 or later (option.proxy)`
  );
}
function loadScript(src) {
  if (!src || customElements.get(TAG) || document.querySelector(`script[src="${src}"]`))
    return;
  const script = document.createElement("script");
  script.src = src;
  document.head.appendChild(script);
}
function universalCanvas(option = {}) {
  return (art) => {
    checkVersion(art);
    const { validator } = art.constructor;
    option = validator(
      {
        using: "",
        with: "",
        scriptDirectory: "",
        script: "",
        useWebcodec: false,
        loop: true,
        ...option
      },
      {
        using: "string",
        with: "?string",
        scriptDirectory: "?string",
        script: "?string",
        useWebcodec: "?boolean",
        loop: "?boolean"
      }
    );
    loadScript(option.script);
    const canvas = document.createElement("canvas", { is: TAG });
    canvas.setAttribute("is", TAG);
    canvas.setAttribute("data-url", art.option.url);
    canvas.setAttribute("using", option.using);
    if (option.with)
      canvas.setAttribute("with", option.with);
    if (option.scriptDirectory)
      canvas.setAttribute("script-directory", option.scriptDirectory);
    if (option.useWebcodec)
      canvas.setAttribute("use-webcodec", "");
    if (!option.loop)
      canvas.setAttribute("noloop", "");
    const media = mediaFacade(canvas);
    art.on("destroy", () => media.destroy());
    return canvas;
  };
}
if (typeof window !== "undefined") {
  window.universalCanvas = universalCanvas;
}
export {
  universalCanvas as default
};
