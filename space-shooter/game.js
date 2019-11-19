let config

function resize() {
  const canvas = document.querySelector('canvas')
  canvas.style.width = '768px'
  canvas.style.height = '816px'
}

const gameSettings = {
  playerSpeed: 200,
}

window.onload = () => {
  config = {
    width: 256,
    height: 272,
    backgroundColor: 0x000000,
    scene: [Scene1, Scene2],
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
  }
  const game = new Phaser.Game(config)
  resize()
}
