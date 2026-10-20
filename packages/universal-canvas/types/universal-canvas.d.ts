import type Artplayer from 'artplayer'

interface Option {
  /** the solver the universal canvas loads, e.g. "solver_1" */
  using: string
  /** the accessors, separated by ";", e.g. "rfmpgvid;ffmpeg" */
  with?: string
  /** where the solver and the accessors are served from */
  scriptDirectory?: string
  /** universal-canvas_1.js, loaded when the element is not defined yet */
  script?: string
  useWebcodec?: boolean
  /** loop the source (default: true) */
  loop?: boolean
}

type Result = HTMLCanvasElement

declare const universalCanvas: (option: Option) => (art: Artplayer) => Result

export default universalCanvas
