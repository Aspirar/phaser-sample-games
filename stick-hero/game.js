let game

function resize() {
	const canvas = document.querySelector('canvas')
	const width = window.innerWidth
	const height = window.innerHeight
	const ratio = width / height
	const gameRatio = game.config.width / game.config.height

	if (ratio < gameRatio) {
		canvas.style.width = `${width}px`
		canvas.style.height = `${width / gameRatio}px`
	} else {
		canvas.style.width = `${height * gameRatio}px`
		canvas.style.height = `${height}px`
	}
}

const gameOptions = {
	platformHeight: 600,
	platformWidthRange: [50, 150],
	platformGapRange: [200, 400],
	scrollTime: 250,
	playerWidth: 32,
	playerHeight: 64,
	poleWidth: 8,
	growTime: 500,
	rotateTime: 500,
	walkTime: 500,
	fallTime: 500,
}

const IDLE = 0
const WAITING = 1
const GROWING = 2

class PlayGame extends Phaser.Scene {
	constructor() {
		super('PlayGame')
	}

	preload() {
		this.load.image('tile', 'tile.png')
	}

	addPlatform(posX) {
		const platform = this.add.sprite(
			posX,
			game.config.height - gameOptions.platformHeight,
			'tile',
		)
		platform.displayWidth = (
			gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]
		) / 2
		platform.alpha = 0.7
		platform.setOrigin(0, 0)
		return platform
	}

	tweenPlatform() {
		const destination = this.platforms[this.mainPlatform].displayWidth
			+ Phaser.Math.Between(
				gameOptions.platformGapRange[0],
				gameOptions.platformGapRange[1]
			)
		const size = Phaser.Math.Between(
			gameOptions.platformWidthRange[0],
			gameOptions.platformWidthRange[1],
		)
		this.tweens.add({
			targets: [this.platforms[1 - this.mainPlatform]],
			x: destination,
			displayWidth: size,
			duration: gameOptions.scrollTime,
			callbackScope: this,
			onComplete() {
				this.gameMode = WAITING
			},
		})
	}

	addPlatforms() {
		this.mainPlatform = 0
		this.platforms = [
			this.addPlatform(0),
			this.addPlatform(game.config.width),
		]
		this.tweenPlatform()
	}

	addPlayer() {
		this.player = this.add.sprite(
			this.platforms[this.mainPlatform].displayWidth - gameOptions.poleWidth,
			game.config.height - gameOptions.platformHeight,
			'tile',
		)
		this.player.displayWidth = gameOptions.playerWidth
		this.player.displayHeight = gameOptions.playerHeight
		this.player.setOrigin(1, 1)
	}

	addPole() {
		this.pole = this.add.sprite(
			this.platforms[this.mainPlatform].displayWidth,
			game.config.height - gameOptions.platformHeight,
			'tile',
		)
		this.pole.setOrigin(1, 1)
		this.pole.displayWidth = gameOptions.poleWidth
		this.pole.displayHeight = gameOptions.playerHeight / 4
	}

	grow() {
		if (this.gameMode !== WAITING) return
		this.growTween = this.tweens.add({
			targets: [this.pole],
			displayHeight: gameOptions.platformGapRange[1]
				+ gameOptions.platformWidthRange[1],
			duration: gameOptions.growTime,
		})
	}

	create() {
		this.addPlatforms()
		this.addPlayer()
		this.addPole()
		this.input.on('pointerdown', this.grow, this)
	}
}

window.onload = () => {
	const gameConfig = {
		type: Phaser.AUTO,
		width: 750,
		height: 1334,
		scene: [PlayGame],
		backgroundColor: 0x0c88c7,
	}
	game = new Phaser.Game(gameConfig)
	window.focus()
	resize()
	window.addEventListener('resize', resize, false)
}
