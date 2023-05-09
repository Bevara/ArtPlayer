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
        `Artplayer.js@${version} is not compatible the UniversalVideo@${UniversalVideo.version}. Please update it to version Artplayer.js@5.x.x`,
    );
}

export default function UniversalVideo(option) {
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
                using: '',
                with: '',
                scriptDirectory: '',
                useCache: false,
                useWorker: false,
                useWebcodec: false,
                ...option,
            },
            {
                using: '?string',
                with: '?string',
                scriptDirectory: '?string',
                useCache: '?boolean',
                useWorker: '?boolean',
                useWebcodec: '?boolean',

            },
        );

        Artplayer.RECONNECT_TIME_MAX = Number.MAX_SAFE_INTEGER;

        const universalVideo = document.createElement("video", { "is": "universal-video" });;

        if (art.video.src && art.video.src != "") {
            universalVideo.setAttribute("src", art.video.src);
        }

        if (option.using && option.using != "") {
            universalVideo.setAttribute("using", option.using);
        }

        if (option.with && option.with != "") {
            universalVideo.setAttribute("with", option.with);
        }

        if (option.scriptDirectory && option.scriptDirectory != "") {
            universalVideo.setAttribute("script-directory", option.scriptDirectory);
        }

        if (option.useCache) {
            universalVideo.setAttribute("use-cache", "");
        }

        if (option.useWorker) {
            universalVideo.setAttribute("use-worker", "");
        }

        if (option.useWebcodec) {
            universalVideo.setAttribute("use-webcodec", "");
        }

        universalVideo.addEventListener('ready', () => {
            art.video.src = universalVideo.src;
        });

        setStyle(universalVideo, 'display', 'none');

        //art.video.parentNode.removeChild(art.video);
        art.template.$universalVideo = append($player, universalVideo);

        return {
            name: 'UniversalVideo'
        };
    };
}

UniversalVideo.env = process.env.NODE_ENV;
UniversalVideo.version = process.env.APP_VER;
UniversalVideo.build = process.env.BUILD_DATE;

if (typeof document !== 'undefined') {
    const script = "https://bevara.ddns.net/accessors/universal-video.js"
    const scripts = document.querySelectorAll(`script[src$="${script}"]`);
    if (scripts.length == 0) {
        const script_elt = document.createElement('script');
        script_elt.src = script;
        document.head.appendChild(script_elt);
    }
}

if (typeof window !== 'undefined') {
    window['UniversalVideo'] = UniversalVideo;
}
