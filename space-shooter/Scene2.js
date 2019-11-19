class Scene2 extends Phaser.Scene {
  constructor() {
    super('playGame')
  }

  create() {
    this.background = this.add.tileSprite(0, 0, config.width, config.height, 'background')
    this.background.setOrigin(0, 0)

    this.ship1 = this.add.sprite(config.width / 2 - 50, config.height / 2, 'ship')
    this.ship2 = this.add.sprite(config.width / 2, config.height / 2, 'ship2')
    this.ship3 = this.add.sprite(config.width / 2 + 50, config.height / 2, 'ship3')

    this.enemies = this.physics.add.group()
    this.enemies.add(this.ship1)
    this.enemies.add(this.ship2)
    this.enemies.add(this.ship3)

    this.powerUps = this.physics.add.group()
    const maxObjects = 4
    for (let i = 0; i <= maxObjects; i += 1) {
      const powerUp = this.physics.add.sprite(16, 16, 'power-up')
      this.powerUps.add(powerUp)
      powerUp.setRandomPosition(0, 0, config.width, config.height)

      if (Math.random() < 0.5) {
        powerUp.play('red')
      } else {
        powerUp.play('gray')
      }

      powerUp.setVelocity(100, 100)
      powerUp.setCollideWorldBounds(true)
      powerUp.setBounce(1)
    }

    this.ship1.play('ship1_anim')
    this.ship2.play('ship2_anim')
    this.ship3.play('ship3_anim')

    this.ship1.setInteractive()
    this.ship2.setInteractive()
    this.ship3.setInteractive()

    this.input.on('gameobjectdown', this.destroyShip, this)

    this.player = this.physics.add.sprite(config.width / 2 - 8, config.height - 64, 'player')
    this.player.play('thrust')
    this.player.setCollideWorldBounds(true)

    this.cursorKeys = this.input.keyboard.createCursorKeys()
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.projectiles = this.add.group()

    this.physics.add.collider(this.projectiles, this.powerUps, (projectile, powerUp) => {
      projectile.destroy()
    })

    this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this)
    this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this)
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 1)
    graphics.beginPath()
    graphics.moveTo(0, 0)
    graphics.lineTo(config.width, 0)
    graphics.lineTo(config.width, 20)
    graphics.lineTo(0, 20)
    graphics.lineTo(0, 0)
    graphics.closePath()
    graphics.fillPath()

    this.score = 0
    this.scoreLabel = this.add.bitmapText(10, 5, 'pixelFont', `SCORE ${this.zeroPad(this.score, 6)}`, 16)

    this.beamSound = this.sound.add('audio_beam')
    this.explosionSound = this.sound.add('audio_explosion')
    this.pickupSound = this.sound.add('audio_pickup')

    this.music = this.sound.add('music')
    const musicConfig = {
      mute: false,
      volume: 1,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: false,
      delay: 0,
    }
    this.music.play(musicConfig)
  }

  zeroPad(number, size) {
    let strNumber = String(number)
    while (strNumber.length < (size || 2)) {
      strNumber = `0${strNumber}`
    }
    return strNumber
  }

  hitEnemy(projectile, enemy) {
    const explosion = new Explosion(this, enemy.x, enemy.y)

    projectile.destroy()
    this.resetShipPos(enemy)

    this.score += 10
    this.scoreLabel.text = `SCORE ${this.zeroPad(this.score, 6)}`

    this.explosionSound.play()
  }

  resetPlayer() {
    const x = config.width / 2 - 8
    const y = config.height + 64
    this.player.enableBody(true, x, y, true, true)
    this.player.alpha = 0.5

    this.tween = this.tweens.add({
      targets: this.player,
      y: config.height - 64, 
      ease: 'Power1',
      duration: 1500,
      repeat: 0,
      onComplete() {
        this.player.alpha = 1
      },
      callbackScope: this,
    })
  }

  hurtPlayer(player, enemy) {
    this.resetShipPos(enemy)
    this.explosionSound.play()

    if (this.player.alpha < 1) return

    const explosion = new Explosion(this, player.x, player.y)

    player.disableBody(true, true)
    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false,
    })
  }

  pickPowerUp(player, powerUp) {
    powerUp.disableBody(true, true)
    this.pickupSound.play()
  }

  moveShip(ship, speed) {
    ship.y += speed
    if (ship.y > config.height) {
      this.resetShipPos(ship)
    }
  }

  resetShipPos(ship) {
    ship.y = 0
    ship.x = Phaser.Math.Between(0, config.width)
  }

  destroyShip(pointer, gameObject) {
    gameObject.setTexture('explosion')
    gameObject.play('explode')
  }

  movePlayerManager() {
    this.player.setVelocity(0)

    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-gameSettings.playerSpeed)
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(gameSettings.playerSpeed)
    }

    if (this.cursorKeys.up.isDown) {
      this.player.setVelocityY(-gameSettings.playerSpeed)
    } else if (this.cursorKeys.down.isDown) {
      this.player.setVelocityY(gameSettings.playerSpeed)
    }
  }

  shootBeam() {
    const beam = new Beam(this)
    this.beamSound.play()
  }

  update() {
    this.moveShip(this.ship1, 1)
    this.moveShip(this.ship2, 2)
    this.moveShip(this.ship3, 3)

    this.background.tilePositionY -= 0.5

    this.movePlayerManager()

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      if (this.player.active) this.shootBeam()
    }

    for (let i = 0; i < this.projectiles.getChildren().length; i += 1) {
      const beam = this.projectiles.getChildren()[i]
      beam.update()
    }
  }
}
