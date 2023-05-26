import config from '../../artplayer/src/config';
import style from 'bundle-text:./style.less';

function checkVersion(art) {
    const {
        version,
        utils: { errorHandle },
    } = art.constructor;
    const arr = version.split('.').map(Number);
    const major = arr[0];
    const minor = arr[1] / 100;
    errorHandle(
        major + minor >= 5,
        `Artplayer.js@${version} is not compatible the UniversalCanvas@${UniversalCanvas.version}. Please update it to version Artplayer.js@5.x.x`,
    );
}

export default function UniversalCanvas(option) {
    return (art) => {
        checkVersion(art);

        const {
            template: { $player },
            icons: { volume, volumeClose, fullscreenOn, fullscreenOff, loading },
            constructor: {
                validator,
                utils: { query, append, setStyle },
            },
        } = art;
        console.log(art.video);

        option = validator(
            {
                video: '',
                using: '',
                with: '',
                scriptDirectory: '',
                useCache: false,
                useWorker: false,
                useWebcodec: false,
                i18n: {
                    close: 'close',
                    countdown: 'countdown',
                    detail: 'detail',
                    canBeClosed: 'can be closed',
                },
                ...option,
            },
            {
                video: '?string',
                using: '?string',
                with: '?string',
                scriptDirectory: '?string',
                useCache: '?boolean',
                useWorker: '?boolean',
                useWebcodec: '?boolean',
                i18n: {
                    close: 'string',
                    countdown: 'string',
                    detail: 'string',
                    canBeClosed: 'string',
                },
            },
        );

        let $countdown = null;

        let time = 0;
        let isEnd = false;
        let timer = null;
        let isInit = false;
        let src = null;

        function getI18n(val, str) {
            return str.replace('%s', val);
        }

        function play() {
            if (isEnd) return;

            timer = setTimeout(() => {
                time += 1;

                $countdown.innerHTML = getI18n(option.totalDuration - time, option.i18n.countdown);

                if (time >= option.totalDuration) {
                    skip();
                } else {
                    play();
                }
            }, 1000);
        }

        function pause() {
            if (isEnd) return;
            clearTimeout(timer);
        }

        Artplayer.RECONNECT_TIME_MAX = -1;

        const universalCanvas = document.createElement("canvas", { "is": "universal-canvas" });;
        universalCanvas.classList.add('artplayer-plugin-ads-video');

        if (art.video.src && art.video.src != "") {
            universalCanvas.setAttribute("data-url", art.video.src);
            src = art.video.src;
        }

        if (option.using && option.using != "") {
            universalCanvas.setAttribute("using", option.using);
        }
        
        if (option.autoplay) {
            universalCanvas.setAttribute("data-autoplay", "true");
        }

        if (option.with && option.with != "") {
            universalCanvas.setAttribute("with", option.with);
        }

        if (option.scriptDirectory && option.scriptDirectory != "") {
            universalCanvas.setAttribute("script-directory", option.scriptDirectory);
        }

        if (option.useCache) {
            universalCanvas.setAttribute("use-cache", "");
        }

        if (option.useWorker) {
            universalCanvas.setAttribute("use-worker", "");
        }

        if (option.useWebcodec) {
            universalCanvas.setAttribute("use-webcodec", "");
        }

        universalCanvas.addEventListener('ready', () => {
            art.video.src = universalCanvas.src;
        });

        //art.video.parentNode.removeChild(art.video);
        art.video.src = "";
        art.template.$universalCanvas = append($player, universalCanvas);

        function show() {
            art.template.$ads = append($player, '<div class="artplayer-plugin-ads"></div>');

            $ads = append(
                art.template.$ads,
                universalCanvas
            );

            $loading = append(art.template.$ads, '<div class="artplayer-plugin-ads-loading"></div>');
            //append($loading, loading);

            $control = append(
                art.template.$ads,
                `<div class="artplayer-plugin-ads-control">
                    <div class="artplayer-plugin-ads-detail">${option.i18n.detail}</div>
                    <div class="artplayer-plugin-ads-muted"></div>
                    <div class="artplayer-plugin-ads-fullscreen"></div>
                </div>`,
            );

            const $detail = query('.artplayer-plugin-ads-detail', $control);
            const $muted = query('.artplayer-plugin-ads-muted', $control);
            const $fullscreen = query('.artplayer-plugin-ads-fullscreen', $control);

            if (option.url) {
                art.proxy($detail, 'click', () => {
                    window.open(option.url);
                    art.emit('artplayerPluginAds:click', option);
                });
            } else {
                setStyle($detail, 'display', 'none');
            }

            if (src) {
                const $volume = append($muted, volume);
                const $volumeClose = append($muted, volumeClose);
                setStyle($volumeClose, 'display', 'none');

                // If the ad was set to muted initially, match the icon
                if (option.muted) {
                    $ads.muted = true;
                    setStyle($volume, 'display', 'none');
                    setStyle($volumeClose, 'display', 'inline-flex');
                }

                art.proxy($muted, 'click', () => {
                    $ads.muted = !$ads.muted;
                    if ($ads.muted) {
                        setStyle($volume, 'display', 'none');
                        setStyle($volumeClose, 'display', 'inline-flex');
                    } else {
                        setStyle($volume, 'display', 'inline-flex');
                        setStyle($volumeClose, 'display', 'none');
                    }
                });
            } else {
                setStyle($muted, 'display', 'none');
            }

            const $fullscreenOn = append($fullscreen, fullscreenOn);
            const $fullscreenOff = append($fullscreen, fullscreenOff);
            setStyle($fullscreenOff, 'display', 'none');

            art.proxy($fullscreen, 'click', () => {
                art.fullscreen = !art.fullscreen;
                if (art.fullscreen) {
                    setStyle($fullscreenOn, 'display', 'inline-flex');
                    setStyle($fullscreenOff, 'display', 'none');
                } else {
                    setStyle($fullscreenOn, 'display', 'none');
                    setStyle($fullscreenOff, 'display', 'inline-flex');
                }
            });

            art.proxy($ads, 'click', () => {
                if (option.url) window.open(option.url);
                art.emit('artplayerPluginAds:click', option);
            });
        }

        function init() {
            if (isInit) return;
            isInit = true;

            show();
            art.pause();

            if (src) {
                art.proxy($ads, 'loadedmetadata', () => {
                    play();
                    $ads.play();
                    setStyle($control, 'display', 'flex');
                    setStyle($loading, 'display', 'none');
                });
            } else {
                play();
                setStyle($control, 'display', 'flex');
                setStyle($loading, 'display', 'none');
            }

            art.proxy(document, 'visibilitychange', () => {
                if (document.hidden) {
                    pause();
                } else {
                    play();
                }
            });
        }

        art.events.destroy();
        for (let index = 0; index < config.events.length; index++) {
            art.proxy(universalCanvas, config.events[index], (event) => {
                art.emit(`video:${event.type}`, event);
            });
        }

        art.emit('video:canplay');
        art.on('video:error', async (error) => {
            //art.mask.show = false;
            //art.player.classList.remove('art-error');
            art.emit('video:canplay');
            
            //art.emit('play');           
        });

 
        art.on('play', async (e) => {
            art.emit('video:playing');
        })

        init();

        return {
            name: 'UniversalCanvas',
            pause,
            play
        };
    };
}

UniversalCanvas.env = process.env.NODE_ENV;
UniversalCanvas.version = process.env.APP_VER;
UniversalCanvas.build = process.env.BUILD_DATE;

if (typeof document !== 'undefined') {
    const script = "https://bevara.ddns.net/accessors/universal-canvas.js"
    const scripts = document.querySelectorAll(`script[src$="${script}"]`);
    if (scripts.length == 0) {
        const script_elt = document.createElement('script');
        script_elt.src = script;
        document.head.appendChild(script_elt);
    }

    if (!document.getElementById('artplayer-plugin-ads')) {
        const $style = document.createElement('style');
        $style.id = 'artplayer-plugin-ads';
        $style.textContent = style;
        document.head.appendChild($style);
    }
}

if (typeof window !== 'undefined') {
    window['UniversalCanvas'] = UniversalCanvas;
}
