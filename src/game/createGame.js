import Phaser from 'phaser'
import CatchHearts from './scenes/CatchHearts.js'

const WIDTH = 390
const HEIGHT = 720

const SCENE_BY_KEY = {
  CatchHearts,
}

/**
 * Create a Phaser game for one level. Imported dynamically from GameHost so
 * Phaser stays out of the initial Vue bundle until Start is tapped.
 *
 * DPR: Phaser 4 has no game-level `resolution`. We draw procedural textures at
 * 2x and cap Text resolution at 2; Scale.FIT handles layout.
 *
 * @param {HTMLElement} parent
 * @param {{ levelId: number, config: object, sceneKey: string }} options
 */
export function createGame(parent, options) {
  const { levelId, config, sceneKey } = options
  const SceneClass = SCENE_BY_KEY[sceneKey] || CatchHearts
  const key = SceneClass === CatchHearts ? 'CatchHearts' : sceneKey

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#00000000',
    transparent: true,
    antialias: true,
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
    },
    input: {
      activePointers: 2,
    },
    scene: [],
  })

  game.scene.add(key, SceneClass, true, { levelId, config })

  return game
}

export default createGame
