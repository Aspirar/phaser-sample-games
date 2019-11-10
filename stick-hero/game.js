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
		this.gameMode = GROWING
		this.growTween = this.tweens.add({
			targets: [this.pole],
			displayHeight: gameOptions.platformGapRange[1]
				+ gameOptions.platformWidthRange[1],
			duration: gameOptions.growTime,
		})
	}

	fallAndDie() {
		this.tweens.add({
			targets: [this.player],
			y: game.config.height + this.player,
			duration: gameOptions.fallTime,
			ease: 'Cubic.easeIn',
			callbackScope: this,
			onComplete() {
				this.cameras.main.shake(800, 0.01)
				this.time.addEvent({
					delay: 2000,
					callbackScope: this,
					callback() {
						this.scene.start('PlayGame')
					},
				})
			},
		})
	}

	platformTooLong() {
		this.tweens.add({
			targets: [this.player],
			x: this.pole.x
				+ this.pole.displayHeight
				+ this.player.displayWidth,
			duration: gameOptions.walkTime,
			callbackScope: this,
			onComplete() {
				this.fallAndDie()
			},
		})
	}

	platformTooShort() {
		this.tweens.add({
			targets: [this.pole],
			angle: 90,
			duration: gameOptions.rotateTime,
			ease: 'Cubic.easeIn',
			callbackScope: this,
			onComplete() {
				this.tweens.add({
					targets: [this.player],
					x: this.pole.x + this.pole.displayHeight,
					duration: gameOptions.walkTime,
					callbackScope: this,
					onComplete() {
						this.tweens.add({
							targets: [this.pole],
							angle: 180,
							duration: gameOptions.rotateTime,
							ease: 'Cubic.easeIn',
						})
						this.fallAndDie()
					},
				})
			},
		})
	}

	prepareNextMove() {
		this.platforms[this.mainPlatform].x = game.config.width
		this.mainPlatform = 1 - this.mainPlatform
		this.tweenPlatform()
		this.pole.angle = 0
		this.pole.x = this.platforms[this.mainPlatform].displayWidth
		this.pole.displayHeight = gameOptions.poleWidth
	}

	stop() {
		if (this.gameMode !== GROWING) return
		this.gameMode = IDLE
		this.growTween.stop()

		if (this.pole.displayHeight > (
			this.platforms[1 - this.mainPlatform].x - this.pole.x
		)) {
			this.tweens.add({
				targets: [this.pole],
				angle: 90,
				duration: gameOptions.rotateTime,
				ease: 'Bounce.easeOut',
				callbackScope: this,
				onComplete() {
					if (!(this.pole.displayHeight < (
						this.platforms[1 - this.mainPlatform].x
							+ this.platforms[1 - this.mainPlatform].displayWidth
							- this.pole.x
					))) {
						this.platformTooLong()
						return
					}

					this.tweens.add({
						targets: [this.player],
						x: this.platforms[1 - this.mainPlatform].x
							+ this.platforms[1 - this.mainPlatform].displayWidth
							- this.pole.displayWidth,
						duration: gameOptions.walkTime,
						callbackScope: this,
						onComplete() {
							this.tweens.add({
								targets: [
									this.player,
									this.pole,
									this.platforms[1 - this.mainPlatform],
									this.platforms[this.mainPlatform],
								],
								props: {
									x: {
										value: `-=${this.platforms[1 - this.mainPlatform].x}`,
									},
								},
								duration: gameOptions.scrollTime,
								callbackScope: this,
								onComplete() {
									this.prepareNextMove()
								},
							})
						},
					})
				},
			})
		} else {
			this.platformTooShort()
		}
	}

	create() {
		this.addPlatforms()
		this.addPlayer()
		this.addPole()
		this.input.on('pointerdown', this.grow, this)
		this.input.on('pointerup', this.stop, this)
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
