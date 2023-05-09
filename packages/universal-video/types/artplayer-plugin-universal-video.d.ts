import type Artplayer from 'artplayer';

export = UniversalVideo;
export as namespace UniversalVideo;

type Option = {
    using: string;
    with: ?string;

    useCache?: boolean;
    useWorker?: boolean;
    useWebcodec?: boolean;
};

declare const UniversalVideo: (option: Option) => (art: Artplayer) => UniversalVideo;
