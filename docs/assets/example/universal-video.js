var art = new Artplayer({
    container: '.artplayer-app',
    url: 'https://bevara.ddns.net/test-signals/mpeg1/medical_demo.ts',
    autoSize: true,
    fullscreen: true,
    fullscreenWeb: true,
    plugins: [
        UniversalVideo({
            using:"solver",
            with:"m2psdmx;rfmpgvid;ffmpeg;mp4mx;rfnalu",
            scriptDirectory:"https://bevara.ddns.net/accessors/"
        }),
    ],
});

// 广告被点击
art.on('artplayerPluginAds:click', (ads) => {
    console.info('广告被点击', ads);
});

// 广告被跳过
art.on('artplayerPluginAds:skip', (ads) => {
    console.info('广告被跳过', ads);
});
