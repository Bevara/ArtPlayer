import type Artplayer from 'artplayer'

interface Option {
  /** the solver the universal video loads, e.g. "solver_1" */
  using?: string
  /** the accessors, separated by ";" */
  with?: string
  /** where the solver and the accessors are served from */
  scriptDirectory?: string
  /** universal-video_1.js, loaded when the element is not defined yet */
  script?: string
  useCache?: boolean
  useWorker?: boolean
  useWebcodec?: boolean
}

interface Result {
  name: 'universalVideo'
}

declare const universalVideo: (option?: Option) => (art: Artplayer) => Result

export default universalVideo
