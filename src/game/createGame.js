import Phaser from 'phaser'
import CatchHearts from './scenes/CatchHearts.js'
import Storm from './scenes/Storm.js'
import PaperPlane from './scenes/PaperPlane.js'

const WIDTH = 390
const HEIGHT = 720

const SCENE_BY_KEY = {
  CatchHearts,
  Storm,
  PaperPlane,
}

/**
 * Create a Phaser game for one level. Imported dynamically from GameHost so
 * Phaser stays out of the initial Vue bundle until Start is tapped.
 * Logical size 390x720 with FIT; textures at 2x; keep canvas sides well under 4096.
 *
 * @param {HTMLElement} parent
 * @param {{ levelId: number, config: object, sceneKey: string }} options
 */
export function createGame(parent, options) {
  const { levelId, config, sceneKey } = options
  const SceneClass = SCENE_BY_KEY[sceneKey] || CatchHearts
  const key = sceneKey in SCENE_BY_KEY ? sceneKey : 'CatchHearts'

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x000000,
    transparent: true,
    antialias: true,
    clearBeforeRender: true,
    audio: {
      noAudio: true,
    },
    fps: {
      target: 60,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
      parent,
    },
    input: {
      activePointers: 2,
    },
    scene: [],
    callbacks: {
      postBoot(g) {
        g.scene.add(key, SceneClass, true, { levelId, config })
        requestAnimationFrame(() => {
          try {
            g.scale.refresh()
          } catch {
            /* ignore */
          }
        })
      },
    },
  })

  return game
}

export default createGame
