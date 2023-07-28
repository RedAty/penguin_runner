class PoingGame {
	constructor() {
		this.interval = null;

		this.gravity = 0.6;
		this.friction = 0.7;

		this.levelLength =36;
		this.currentLevel = 1;
		this.latestScore = 0;

		this.canvas = null;
		this.ctx = null;
		this.canvasWidth = window.innerWidth;
		this.canvasHeight = window.innerHeight;
		this.setBackgroundSrc("./img/1761712.jpg");
		this.playerSprite = null;
		this.grassImage = new CanvasImage("snow.jpg");
		this.leftPenguin = new CanvasImage("penguin_left.png");
		this.rightPenguin = new CanvasImage("penguin_right.png");

		this.level = {
			platforms: []
		}
		this.generateLevelFields();

		this.gameRunningState = false;

		this._renderId = null;
		this._lastTime = 0;

		this._gameOverScreen = false;
		this.isMobile = this.checkIsMobile();
	}

	checkIsMobile(){
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
			// true for mobile device
			return true;
		}else{
			// false for not mobile device
			return false;
		}
	}

	isReady() {
		if ( this.canvas instanceof HTMLCanvasElement ) {
			return true;
		}

		return false;
	}

	_stopRendering() {
		if ( this._renderId ) {
			window.cancelAnimationFrame(this._renderId);
			this._renderId = null;
		}
	}

	_startRendering() {
		if ( !this._renderId ) {
			const self = this;
			this._renderId = window.requestAnimationFrame(function (time) {
				if ( self.gameRunningState ) {
					self._renderId = null;
					const now = Date.now();
					const dt = (now - self._lastTime) / 1000.0;
					if ( dt >= 0.016666 ) {
						self._lastTime = now;
						self._mainLoop(dt, time);
						self.renderPlayGround(Math.round(1 / dt), time);
					}


					self._startRendering();
				} else {
					self._stopRendering()
				}
			});
		}
	}

	restartGame() {
		//clearInterval(this.interval);
		this._gameOverScreen = false;
		this.gameRunningState = false;
		this._stopRendering();
		if ( !this.isReady() ) {
			throw new Error("Game is not ready! Canvas is not found!");
		}
		this.resetPlayer();
		this.resetScreenPosition();
		this.keys = {
			right: false,
			left: false,
			up: false,
		};
		this.generateLevelFields();
		if ( typeof this._mainLoop != "function" ) {
			this.attachEvents();
		}

		this.gameRunningState = true;
		this._startRendering();
		//this.interval = setInterval(this._mainLoop,22);
	}

	setCanvasElement(canvas) {
		if ( canvas && canvas instanceof HTMLCanvasElement ) {
			this.canvas = canvas;
			this.ctx = this.canvas.getContext("2d");
			console.log(canvas.offsetWidth, canvas.offsetHeight);
			this.canvasWidth = canvas.offsetWidth;
			this.canvasHeight = canvas.offsetHeight;
			canvas.width = this.canvasWidth;
			canvas.height = this.canvasHeight;
			return true;
		}
		return false;
	}

	setCanvasBySelector(selector) {
		const canvas = document.querySelector(selector);
		return this.setCanvasElement(canvas);
	}

	setBackgroundSrc(src) {
		//this.backgroundSrc = src;
		this.background = new Image();
		this.background.src = src;
		this.background.onload = () => {
			console.log("Background Loaded");
		}
	}

	renderBackground() {
		this.ctx.fillStyle = "#F0F8FF";
		const pos = this.screenPosition.x / 10;
		this.ctx.drawImage(this.background, -pos, 0, this.canvasWidth, this.canvasHeight, 0, 0, this.canvasWidth, this.canvasHeight);
	}

	renderPlayer() {
		this.ctx.fillStyle = "#b880f0";

		const x = this.screenPosition.x + (this.player.x) - 20;
		const y = this.screenPosition.y + (this.player.y) - 60;

		if ( this.playerSprite && typeof this.playerSprite.renderNPC === "function" ) {
			this.playerSprite.renderNPC(this.ctx, x, y, this.player.width, this.player.height);
		} else {
			this.ctx.fillRect(x, y, this.player.width, this.player.height);
		}

	}

	renderPlatforms() {
		// this.ctx.fillStyle = "#75c646";
		this.level.platforms.forEach(platform => {
			this.grassImage.renderImage(this.ctx, this.screenPosition.x + platform.x, this.screenPosition.y + platform.y, platform.width, platform.height);
			//this.ctx.fillRect(this.screenPosition.x + platform.x, this.screenPosition.y + platform.y, platform.width, platform.height);
		});
	}

	renderHUD(score, dt) {
		const menuHeight = this.canvasHeight - 100;
		const leftCenter = this.canvasWidth / 4;
		const rightCenter = leftCenter * 3;
		this.ctx.font = this.canvasWidth < 500 ? "26px Arial" : "30px Arial";
		this.ctx.textAlign = "start";
		this.ctx.fillStyle = "#e1e1e1";
		this.ctx.fillText("Score: " + (score || 0), 10, 50);
		this.ctx.fillStyle = "#242424";
		//this.ctx.fillRect(leftCenter - leftCenter / 4, menuHeight - 50, leftCenter / 2, 100);
		this.leftPenguin.renderImage(this.ctx,leftCenter - leftCenter / 4, menuHeight - 50, leftCenter / 2, 100);


		//this.ctx.fillRect(50, canvasHeight - 210, canvasWidth /2 - 200, Math.min(canvasHeight/4,100));
		//this.ctx.fillRect(rightCenter - leftCenter / 4, menuHeight - 50, leftCenter / 2, 100);
		this.rightPenguin.renderImage(this.ctx,rightCenter - leftCenter / 4, menuHeight - 50, leftCenter / 2, 100);


		this.ctx.fillStyle = "#efefef";
		this.ctx.textAlign = "center";
		//this.ctx.fillText("<<<", leftCenter, menuHeight);
		//this.ctx.fillText("^^^^", 50 + (canvasWidth /2 - 200)/2, canvasHeight - 150);
		//this.ctx.fillText(">>>", rightCenter, menuHeight);

		this.ctx.fillStyle = "#eeeeee";
		this.ctx.textAlign = "right";
		if ( dt < 10 ) {
			dt = "  " + dt;
		} else if ( dt < 100 ) {
			dt = " " + dt;
		}
		//this.ctx.fillText("FPS:" + dt.toString(), this.canvasWidth, 30);

	}

	renderGameOverScreen(score) {
		const finalScore = this.latestScore + score;
		this.latestScore = 0;
		this.currentLevel = 1;
		this._gameOverScreen = true;
		this.ctx.fillStyle = "#F0F8FF";
		this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.ctx.fillStyle = "#1f1f1f";
		this.ctx.font = "34px Arial";
		this.ctx.textAlign = "center";
		this.ctx.fillText("Game Over", this.canvasWidth / 2, this.canvasHeight / 2 - 90);
		this.ctx.font = "30px Arial";
		this.ctx.fillText("Final Score: " + (finalScore || 0), this.canvasWidth / 2, this.canvasHeight / 2);
		this.ctx.fillText("Press Enter to Restart", this.canvasWidth / 2, this.canvasHeight / 2 + 30);
	}

	renderNextLevelScreen(score) {
		this.latestScore += score;
		this.currentLevel++;
		this._gameOverScreen = true;
		this.ctx.fillStyle = "#d7cece";
		this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.ctx.fillStyle = "#222222";
		this.ctx.font = "34px Arial";
		this.ctx.textAlign = "center";
		this.ctx.fillText("Level Done", this.canvasWidth / 2, this.canvasHeight / 2 - 90);
		this.ctx.font = "30px Arial";
		this.ctx.fillText("Final Score: " + (this.latestScore || 0), this.canvasWidth / 2, this.canvasHeight / 2);
		this.ctx.fillText("Press Enter to Continue", this.canvasWidth / 2, this.canvasHeight / 2 + 30);
	}

	renderPlayGround(dt) {
		// Rendering the canvas, the player and the platforms
		this.renderBackground();
		this.renderPlayer();
		this.renderPlatforms();
		this.renderHUD(-1 * this.screenPosition.x, dt)
	}

	attachEvents() {
		const self = this;
		let mousePos;

		function keydown(e) {
			if ( e.key === "a" || e.key === "ArrowLeft" ) {
				self.keys.left = true;
				self.playerSprite.setActionType("left");
			}
			if ( e.key === "w" || e.key === "ArrowUp" ) {
				if ( self.player.jump === false ) {
					self.player.y_v = -10;
				}
			}
			if ( e.key === "d" || e.key === "ArrowRight" ) {
				self.keys.right = true;
				self.playerSprite.setActionType("right");
			}

			if ( e.key === "i" ) {
				self.screenPosition.x += 10;
			} else if ( e.key === "u" ) {
				self.screenPosition.x -= 10;
			}


		}

		// This function is called when the pressed key is released
		function keyup(e) {
			if ( e.key === "a" || e.key === "ArrowLeft" ) {
				self.keys.left = false;
			}
			if ( e.key === "w" || e.key === "ArrowUp" ) {
				if ( self.player.y_v < -2 ) {
					self.player.y_v = -3;
				}
			}
			if ( e.key === "d" || e.key === "ArrowRight" ) {
				self.keys.right = false;
			}
			if ( !self.keys.right && !self.keys.left ) {
				self.playerSprite.setActionType("idle");
			}
			if ( e.key === "Enter" && !self.gameRunningState ) {
				self.restartGame();
			}
		}

		this._mainLoop = (dt, time) => {

			//allowed area: screenPosition.x +100 screenPosition.x +500
			if ( self.screenPosition.x + 20 >= self.player.x ) {
				//screenPosition.x += 2;
			} else if (self.screenPosition.x + self.canvasWidth / 2 + 20 <= self.player.x ) {
				if (this.isMobile && self.screenPosition.x + self.canvasWidth - 40 <= self.player.x) {
					self.screenPosition.x -= self.currentLevel * 2;
				} else if(!this.isMobile) {
					self.screenPosition.x -= self.currentLevel * 2;
				}

			}

			if ( self.player.y > self.canvasHeight + 100 ) {
				clearInterval(self.interval);
				self.gameRunningState = false;
				setTimeout(function () {
					self.renderGameOverScreen(-1 * self.screenPosition.x)
				}, 100);
				return;
			}

			// If the player is not jumping apply the effect of frictiom
			if ( self.player.jump === false ) {
				self.player.x_v *= self.friction;
			} else {
				// If the player is in the air then apply the effect of gravity
				self.player.y_v += self.gravity;
			}
			self.player.jump = true;
			// If the left key is pressed increase the relevant horizontal velocity
			if ( self.keys.left ) {
				self.player.x_v = -(self.currentLevel * 1.2) - 1.3;
			}
			if ( self.keys.right ) {
				self.player.x_v = (self.currentLevel * 1.2) + 1.3;
			}
			// Updating the y and x coordinates of the player
			self.player.y += self.player.y_v;
			self.player.x += self.player.x_v;
			// A simple code that checks for collisions with the platform
			let i = -1;
			let currentHeight = 0;
			for ( let index = 0; index < self.level.platforms.length; index++ ) {
				let platform = self.level.platforms[index];
				if ( platform.x < self.player.x + 15 &&
					self.player.x - 5 < platform.x + platform.width &&
					platform.y < self.player.y &&
					self.player.y - 20 < platform.y + platform.height ) {

					if ( currentHeight < platform.y + platform.height ) {
						currentHeight = platform.y + platform.height;
						i = index;
						index = self.level.platforms.length; //Exit
					}
				}
			}


			if ( i > -1 ) {
				self.player.jump = false;
				self.player.y = self.level.platforms[i].y;
				if ( self.level.platforms[i].last ) {
					clearInterval(self.interval);
					self.gameRunningState = false;
					setTimeout(function () {
						self.renderNextLevelScreen(-1 * self.screenPosition.x)
					}, 100);
					return;
				}
			}

			if ( self.level.platforms[0] ) {
				//console.log((self.player.x - self.canvasWidth)+ "   " + self.level.platforms[0].x + "   " + self.level.platforms.length);
				if ( (self.player.x - self.canvasWidth) > self.level.platforms[0].x ) {
					self.level.platforms.shift();
				}
			}
		}

		document.addEventListener("keydown", keydown);
		document.addEventListener("keyup", keyup);

		let mouseStarted = false;
		self.canvas.addEventListener("mousedown", function (mouseEvent) {
			mouseStarted = true;
			if ( mouseEvent.clientY > self.canvasHeight - 150 ) {
				if ( mouseEvent.clientX < self.canvasWidth / 2 ) {
					self.keys.left = true;
					self.playerSprite.setActionType("left");
				} else if ( mouseEvent.clientX > self.canvasWidth / 2 ) {
					self.keys.right = true;
					self.playerSprite.setActionType("right");
				}
			} else {
				if ( self.player.jump === false ) {
					self.player.y_v = -10;
				}
			}
		});

		self.canvas.addEventListener("mouseup", function (mouseEvent) {
			mouseStarted = false;
			self.keys.right = false;
			self.keys.left = false;
			if ( self.player.y_v < -2 ) {
				self.player.y_v = -3;
			}
			self.playerSprite.setActionType("idle");
		});

		self.canvas.addEventListener("mousemove", function (mouseEvent) {
			if ( mouseEvent.clientY < self.canvasHeight - 150 && mouseStarted ) {
				if ( self.player.jump === false ) {
					self.player.y_v = -10;
				}
			}
		});


		document.addEventListener("touchstart", function (e) {
			mousePos = getTouchPos(self.canvas, e);
			let touch = e.touches[0];
			let mouseEvent = new MouseEvent("mousedown", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			self.canvas.dispatchEvent(mouseEvent);


		}, false);
		document.addEventListener("touchend", function (e) {
			let mouseEvent = new MouseEvent("mouseup", {});
			self.canvas.dispatchEvent(mouseEvent);

			if ( self._gameOverScreen ) {
				self.restartGame();
			}

		}, false);
		document.addEventListener("touchmove", function (e) {
			let touch = e.touches[0];
			let mouseEvent = new MouseEvent("mousemove", {
				clientX: touch.clientX,
				clientY: touch.clientY
			});
			self.canvas.dispatchEvent(mouseEvent);
		}, false);

		// Get the position of a touch relative to the canvas
		function getTouchPos(canvasDom, touchEvent) {
			const rect = canvasDom.getBoundingClientRect();
			return {
				x: touchEvent.touches[0].clientX - rect.left,
				y: touchEvent.touches[0].clientY - rect.top
			};
		}
	}

	generateLevelFields() {
		function randomIntFromInterval(min, max) { // min and max included
			//const first = Math.floor(Math.random() * (max - min + 1) + min);
			const difference = max - min;
			if ( difference )
				return Math.floor(Math.random() * (max - min + 1) + min);
		}

		const platforms = [];

		for ( let i = 0; i < this.levelLength; i++ ) {
			if ( platforms.length ) {
				const lastOne = platforms[platforms.length - 1];
				let plannedYMin = lastOne.y - 100;
				let plannedYMax = lastOne.y + 100;

				if ( plannedYMin < 100 ) {
					plannedYMin = 100;
					plannedYMax += 100;
				}
				if ( plannedYMax > this.canvasHeight - 80 ) {
					plannedYMax = 500
				}
				const firstTry = randomIntFromInterval(plannedYMin, plannedYMax);

				if ( i === this.levelLength - 1 ) {

					platforms.push({
						x: 200 + (120 * i),
						y: firstTry > lastOne.y - 10 && firstTry < lastOne.y + 10 ? lastOne.y - 50 : firstTry,
						width: randomIntFromInterval(70, 100),
						height: 15,
						last: true
					});
				} else {
					platforms.push(
						{
							x: 200 + ((this.currentLevel*20+100) * i),
							y: firstTry > lastOne.y - 10 && firstTry < lastOne.y + 10 ? lastOne.y - 50 : firstTry,
							width: randomIntFromInterval(70, 100),
							height: 15
						}
					);
				}

			} else {
				//100 + (30 * i)
				platforms.push(
					{
						x: 140 + (100 * i),
						y: 220 + (30 * i),
						width: 110,
						height: 15
					}
				);
			}

		}

		this.level.platforms = platforms;
	}

	resetPlayer() {
		this.player = {
			x: 200,
			y: 200,
			x_v: 0,
			y_v: 0,
			jump: true,
			height: 60,
			width: 60
		};
	}

	resetScreenPosition() {
		this.screenPosition = {
			x: 0,
			y: 0
		};
	}
}

class CanvasImage {
	constructor(name) {
		this.name = name;
		this.path = "./img/" + name.toLowerCase();
		this._lastTime = Date.now();
		this._elapsedTime = 0;
		this._loadedImage = null;
		const self = this;
		this._loadImagePromise(this.path).then(image=>{
			self._loadedImage = image;
		}).catch(e => console.error(e));
	}

	_loadImagePromise(url) {
		return new Promise((resolve, reject) => {
			try {
				const image = new Image();
				image.src = url;
				image.onload = () => {
					resolve(image);
				}
			} catch ( e ) {
				reject(e);
			}

		});
	}

	renderImage(ctx, x, y, width, height) {
		if(this._loadedImage){
			ctx.drawImage(this._loadedImage, x, y, width, height);
		} else {
			ctx.fillRect(x, y, width, height);
		}
	}

}

class NPC {
	constructor(name) {
		this.name = name;
		this.imageFolder = "./img/" + name.toLowerCase() + "/";
		this.sprites = {
			walking: [],
			idle: []/*,
			attack: [],
			casting: [],
			dying: []*/
		};
		this.spriteCount = {
			walking: 4,
			idle: 12/*,
			attack: 4,
			casting: 4,
			dying: 4*/
		}

		this.customCut = {
			sx: 0,
			sy: 0,
			sWidth: 0,
			sHeight: 0,
		}

		this._currentID = 0;
		this._currentSprite = "idle";
		this._lastTime = Date.now();
		this._elapsedTime = 0;

	}

	setActionType(type) {
		switch ( type ) {
			case "walking":
				this._currentSprite = "walking";
				break;
			case "casting":
				this._currentSprite = "casting";
				break;
			case "dying":
				this._currentSprite = "dying";
				break;
			case "idle":
				this._currentSprite = "idle";
				break;
			case "left":
				this._currentSprite = "walking";
				break;
			case "right":
				this._currentSprite = "walking";
				break;
			case "jump":
				this._currentSprite = "idle";
				break;
			default:
				this._currentSprite = "idle";
		}
	}

	setSpriteCount(type, spriteCount) {
		if ( typeof this.spriteCount[type] === "number" && typeof spriteCount === "number" ) {
			this.spriteCount[type] = spriteCount;
			return true;
		}
		return false;
	}

	setSpriteCounts(object) {
		let bool = true;
		if ( object && typeof object === "object" ) {
			const types = Object.keys(object);
			for ( let i = 0; i < types.length; i++ ) {
				const type = types[i];
				if ( !this.setSpriteCount(type, object[type]) ) {
					bool = false;
				}
			}
		}
		return bool;
	}

	setCustomCuts(sx, sy, width, height) {
		this.customCut = {
			sx: sx,
			sy: sy,
			sWidth: width,
			sHeight: height,
		}
	}

	_loadImagePromise(url) {
		return new Promise((resolve, reject) => {
			try {
				const image = new Image();
				image.src = url;
				image.onload = () => {
					resolve(image);
				}
			} catch ( e ) {
				reject(e);
			}

		});
	}

	async load() {
		const createNumberString = function (number) {
			if ( number < 10 ) {
				return "00" + number;
			} else if ( number < 100 ) {
				return "0" + number;
			} else {
				return number;
			}
		}
		const spriteTypes = Object.keys(this.sprites);
		for ( let j = 0; j < spriteTypes.length; j++ ) {
			const spriteType = spriteTypes[j];
			const spriteCount = this.spriteCount[spriteType];

			for ( let i = 0; i < spriteCount; i++ ) {
				const fileName = this.name + "_" + spriteType.charAt(0) + spriteType.substring(1) + "_" + createNumberString(i) + ".png";
				const spritePath = this.imageFolder + spriteType + "/" + fileName;


				const imageStorageArray = this.sprites[spriteType];
				try {
					const loadedSprite = await this._loadImagePromise(spritePath).catch(e => console.error(e));
					imageStorageArray.push(loadedSprite);
				} catch ( e ) {
					console.error(e);
				}

			}
		}
	}

	renderNPC(ctx, x, y, width, height) {
		const now = Date.now();
		this._elapsedTime += now - this._lastTime;
		if ( this._elapsedTime > 1000 ) {
			this._elapsedTime = 0;
			this._lastTime = now;
			this._currentID += 1;
		}
		if ( this.sprites[this._currentSprite].length - 1 < this._currentID ) {
			this._currentID = 0;
		}
		if ( this.customCut.sHeight && this.customCut.sWidth ) {
			ctx.drawImage(this.sprites[this._currentSprite][this._currentID], this.customCut.sx, this.customCut.sy, this.customCut.sWidth, this.customCut.sHeight, x, y, width, height);
		} else {
			ctx.drawImage(this.sprites[this._currentSprite][this._currentID], x, y, width, height);
		}

	}

}
