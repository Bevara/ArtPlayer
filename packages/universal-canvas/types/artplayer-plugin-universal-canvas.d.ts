import type Artplayer from 'artplayer';

export = UniversalCanvas;
export as namespace UniversalCanvas;

type Option = {
    using: string;
    with: ?string;

    useCache?: boolean;
    useWorker?: boolean;
    useWebcodec?: boolean;
};

declare const UniversalCanvas: (option: Option) => (art: Artplayer) => UniversalCanvas;
