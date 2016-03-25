'use strict';

// jQuery related functions.
var start = function() {
    if ($('#nickname').val() === '') return $('#error').show();
    $('#lobby').hide();
    $('#game').show();
};

//jQuery events.
$('#start').on('click', start);
$(document).keypress(function (e) { if (e.which === 13) start(); });

// The Game. Phaserjs related functions.

// Global game vars.
var SCORE = 0;
var text = '';

// The game state.
var GameState = function (game) {

    this.MAX_ANIMALS = 4; // number of animals
    this.FULL_SCREEN = false;

};

// Load images and sounds.
GameState.prototype.preload = function() {

    // Images.
    for (var i = 1; i <= 22; i++) {
        this.game.load.image('mob' + i, '/static/images/anim' + i + '.png');
    }
    this.game.load.image("background", "/static/images/bg.png");
    this.game.load.image('button', '/static/images/expand.png');

    // Spritesheets.
    this.game.load.spritesheet('effect', '/static/images/effect.png', 128, 128);
};

// Setup the game.
GameState.prototype.create = function () {

    // Set stage background to tiled grass
    this.background = this.game.add.tileSprite(0, 0, this.game.width, this.game.height, "background");
    this.background.alpha = 0.8;

    // Create a group to hold the animals
    this.animalGroup = this.game.add.group();

    // Create a group for effects
    this.effectsGroup = this.game.add.group();
    
    // Add the full screen button
    var button = this.game.add.button(this.game.width - 60, 20, 'button', this.fullScreen, this, 2, 1, 0);
    button.scale.setTo(0.08, 0.08);

    // Simulate a pointer click/tap input at the center of the stage
    // when the example begins running.
    this.game.input.activePointer.x = this.game.width/2;
    this.game.input.activePointer.y = this.game.height / 2 - 100;

    // Set default text values
    SCORE = 0;
    text = this.game.add.text(16, 16, $('#nickname').val() + "'s score: " + SCORE, { font: "32px Arial", fill: "#ffffff" });
};

// The update() method is called every frame.
GameState.prototype.update = function () {

    // Fill with tiles.
    this.background.tilePosition.x = 0.5;

    // Update the score points.
    text.setText($('#nickname').val() + "'s score: " + SCORE);

    // If there are fewer than MAX_ANIMALS, spawn a new one.
    if (this.animalGroup.countLiving() < this.MAX_ANIMALS) {

        // Set the spawn point to a random location of the stage.
        var x = this.game.rnd.integerInRange(0, this.game.width - 50);
        var y = this.game.rnd.integerInRange(0, this.game.height - 50);
        this.spawnAnimal(x, y);
    }
};

// Spawn animals with different sprites.
GameState.prototype.spawnAnimal = function (x, y) {

    // Get the first collected animal from the animalGroup.
    var animal = this.animalGroup.getFirstDead();
    // Remove it from the group.
    this.animalGroup.remove(animal);

    // Spawn new one with different skin to replace the removed.
    animal = new Animal(this.game);
    this.animalGroup.add(animal);

    // Move the animal to the given coordinates.
    animal.x = x;
    animal.y = y;

    return animal;
};

// Enter full screen mode.
GameState.prototype.fullScreen = function() {

    this.FULL_SCREEN = !this.FULL_SCREEN;

    if (this.FULL_SCREEN) {
        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        this.game.scale.stopFullScreen();
    } else {
        this.game.scale.startFullScreen(false);
    }
};

// Try to get a used effect from the effectsGroup.
// If an effect isn't available, create a new one and add it to the group.
// Setup new effects so that the animals animate when they are collected.
GameState.prototype.getEffect = function (x, y) {

    // Get the first dead effect from the effectsGroup.
    var effect = this.effectsGroup.getFirstDead();

    // If there aren't any available, create a new one.
    if (effect === null) {
        effect = this.game.add.sprite(0, 0, 'effect');
        effect.anchor.setTo(0.5, 0.5);

        // Add an animation for the effect that kills the sprite when the
        // animation is complete.
        var animation = effect.animations.add('boom', [0,1,2,3], 60, false);
        animation.killOnComplete = true;

        // Add the effect sprite to the group.
        this.effectsGroup.add(effect);
    }

    // Revive the effect (set it's alive property to true).
    // You can also define a onRevived event handler in your effect objects.
    // to do stuff when they are revived.
    effect.revive();

    // Move the effect to the given coordinates.
    effect.x = x;
    effect.y = y;

    // Set rotation of the effect at random for a little variety.
    effect.angle = this.game.rnd.integerInRange(0, 360);

    // Play the animation.
    effect.animations.play('boom');

    // Return the effect itself in case we want to do anything else with it.
    return effect;
};

// Animal constructor.
var Animal = function(game, x, y) {

    // Get sprite.
    Phaser.Sprite.call(this, game, x, y, 'mob' + game.rnd.integerInRange(1, 21));

    // Set the pivot point for this sprite to the center.
    //this.anchor.setTo(0.5, 0.5);

    // Set scale.
    this.scale.setTo(0.5, 0.5);

    // Enable physics on the animal.
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    //  Enables all kind of input actions on this image (click, etc).
    this.inputEnabled = true;
    this.events.onInputDown.add(this.collect, this);

    // Define constants that affect motion.
    this.SPEED = 100; // animal speed pixels/second.
    this.TURN_RATE = 5; // turn rate in degrees/frame.
    this.WOBBLE_LIMIT = 15; // degrees.
    this.WOBBLE_SPEED = 150; // milliseconds.

    // Create a variable called wobble that tweens back and forth between
    // -this.WOBBLE_LIMIT and +this.WOBBLE_LIMIT forever.
    this.wobble = this.WOBBLE_LIMIT;
    this.game.add.tween(this)
        .to(
            { wobble: -this.WOBBLE_LIMIT },
            this.WOBBLE_SPEED, Phaser.Easing.Sinusoidal.InOut, true, 0,
            Number.POSITIVE_INFINITY, true
        );
};

// Animals are a type of Phaser.Sprite.
Animal.prototype = Object.create(Phaser.Sprite.prototype);
Animal.prototype.constructor = Animal;

// Update the score on collect and remove the animal.
Animal.prototype.collect = function () {

    // Update the game score.
    SCORE += 1;

    // Collect the animal.
    this.kill();

    // Start effect.
    this.game.state.callbackContext.getEffect(this.x, this.y);
}

Animal.prototype.update = function () {

    // If this animal is removed, don't do any of these calculations.
    if (!this.alive) { return; }

    // Calculate the angle from the animal to the mouse cursor game.input.x
    // and game.input.y are the mouse position; substitute with whatever
    // target coordinates you need.
    var targetAngle = this.game.math.angleBetween(
        this.x, this.y,
        this.game.input.activePointer.x, this.game.input.activePointer.y
    );

    // Add our "wobble" factor to the targetAngle to make the animal wobble.
    // Remember that this.wobble is tweening (above).
    targetAngle += this.game.math.degToRad(this.wobble);

    // Gradually (this.TURN_RATE) aim the animal towards the target angle.
    if (this.rotation !== targetAngle) {

        // Calculate difference between the current angle and targetAngle.
        var delta = targetAngle - this.rotation;

        // Keep it in range from -180 to 180 to make the most efficient turns.
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        if (delta > 0) {
            // Turn clockwise.
            this.angle += this.TURN_RATE;
        } else {
            // Turn counter-clockwise.
            this.angle -= this.TURN_RATE;
        }

        // Just set angle to target angle if they are close.
        if (Math.abs(delta) < this.game.math.degToRad(this.TURN_RATE)) {
            this.rotation = targetAngle;
        }
    }

    // Calculate velocity vector based on this.rotation and this.SPEED.
    this.body.velocity.x = Math.cos(this.rotation) * this.SPEED;
    this.body.velocity.y = Math.sin(this.rotation) * this.SPEED;
};

var game = new Phaser.Game(848, 450, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);

// Special thanks to @yafd http://gamemechanicexplorer.com/#hominganimals-5.