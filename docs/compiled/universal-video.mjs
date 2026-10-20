/*!
 * universal-video.js v1.0.0
 * Github: https://github.com/zhw2590582/ArtPlayer
 * (c) 2017-2026 Harvey Zhao
 * Released under the MIT License.
 */
const TAG = "universal-video_1";
function checkVersion(art) {
  const {
    version,
    utils: { errorHandle }
  } = art.constructor;
  const arr = version.split(".").map(Number);
  const major = arr[0];
  const minor = arr[1] / 100;
  errorHandle(
    major + minor >= 5,
    `Artplayer.js@${version} is not compatible the universalVideo. Please update it to version Artplayer.js@5.x.x`
  );
}
function loadScript(src) {
  if (!src || customElements.get(TAG) || document.querySelector(`script[src="${src}"]`))
    return;
  const script = document.createElement("script");
  script.src = src;
  document.head.appendChild(script);
}
function universalVideo(option = {}) {
  return (art) => {
    checkVersion(art);
    const {
      template: { $player },
      constructor: {
        validator,
        utils: { append, setStyle }
      }
    } = art;
    option = validator(
      {
        using: "",
        with: "",
        scriptDirectory: "",
        script: "",
        useCache: false,
        useWorker: false,
        useWebcodec: false,
        ...option
      },
      {
        using: "?string",
        with: "?string",
        scriptDirectory: "?string",
        script: "?string",
        useCache: "?boolean",
        useWorker: "?boolean",
        useWebcodec: "?boolean"
      }
    );
    loadScript(option.script);
    art.constructor.RECONNECT_TIME_MAX = Number.MAX_SAFE_INTEGER;
    const video = document.createElement("video", { is: TAG });
    video.setAttribute("is", TAG);
    const source = art.option.url;
    if (source)
      video.setAttribute("src", source);
    if (option.using)
      video.setAttribute("using", option.using);
    if (option.with)
      video.setAttribute("with", option.with);
    if (option.scriptDirectory)
      video.setAttribute("script-directory", option.scriptDirectory);
    if (option.useCache)
      video.setAttribute("use-cache", "");
    if (option.useWorker)
      video.setAttribute("use-worker", "");
    if (option.useWebcodec)
      video.setAttribute("use-webcodec", "");
    video.addEventListener("ready", () => {
      art.url = video.src;
    });
    setStyle(video, "display", "none");
    art.template.$universalVideo = append($player, video);
    return {
      name: "universalVideo"
    };
  };
}
if (typeof window !== "undefined") {
  window.universalVideo = universalVideo;
}
export {
  universalVideo as default
};
