var art = new Artplayer({
    container: '.artplayer-app',
    url: 'https://bevara.ddns.net/test-signals/mpeg1/medical_demo.ts',
    autoSize: true,
    fullscreen: true,
    fullscreenWeb: true,
    plugins: [
        UniversalCanvas({
            using:"solver",
            with:"rfmpgvid;ffmpeg",
            scriptDirectory:"https://bevara.ddns.net/accessors/",
            video: '/assets/sample/test1.mp4',
            autoplay:true
            
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
