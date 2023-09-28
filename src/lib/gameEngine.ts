'use client';
import {CanvasImage} from "@/lib/canvasImage";
import {NPC} from "@/lib/npc";

let requestAnimFrame = function (callback): number {
		return setTimeout(callback, 1000 / 60) as number;
	};
let cancelAnimFrame = clearTimeout;

export class GameEngine {
	private interval: undefined|number;
	private gravity: number;
	private friction: number;
	private levelLength: number;
	private currentLevel: number;
	private latestScore: number;

	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private canvasWidth: number;
	private canvasHeight: number;

	private playerSprite: NPC|null;
	private grassImage: CanvasImage;
	private leftPenguin: CanvasImage;
	private rightPenguin: CanvasImage;

	private level: { platforms: any[] };
	private gameRunningState: boolean;
	private _renderId: number|null;
	private _lastTime: number;
	private _gameOverScreen: boolean;
	private isMobile: boolean;
	private player: { y_v: number; x: number; width: number; y: number; x_v: number; jump: boolean; height: number };
	private screenPosition: any;
	private keys: { left: boolean; right: boolean; up: boolean };
	private background: HTMLImageElement;
	private eventsAttached: boolean | undefined;

	constructor(canvas: HTMLCanvasElement) {
		this.gravity = 0.6;
		this.friction = 0.7;

		this.levelLength =36;
		this.currentLevel = 1;
		this.latestScore = 0;

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
		//this.generateLevelFields();

		this.gameRunningState = false;

		this._renderId = null;
		this._lastTime = 0;

		this._gameOverScreen = false;
		this.isMobile = this.checkIsMobile();

		this.setCanvasElement(canvas)
	}

	checkIsMobile(){
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	isReady() {
		return this.canvas instanceof HTMLCanvasElement;
	}

	_stopRendering() {
		if ( this._renderId ) {
			cancelAnimFrame(this._renderId);
			this._renderId = null;
		}
	}

	_startRendering() {
		if ( !this._renderId ) {
			this._renderId = requestAnimFrame(time => {
				if ( this.gameRunningState ) {
					this._renderId = null;
					const now = Date.now();
					const dt = (now - this._lastTime) / 1000.0;
					//if ( dt >= 0.016666 ) {
						this._lastTime = now;
						this._mainLoop();
						this.renderPlayGround(Math.round(1 / dt), time);
					//}


					this._startRendering();
				} else {
					this._stopRendering()
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
		this.attachEvents();

		this.gameRunningState = true;
		this.setRenderEnvironment();
		this._startRendering();
		//this.interval = setInterval(this._mainLoop,22);
	}

	setCanvasElement(canvas) {
		if ( canvas && canvas instanceof HTMLCanvasElement ) {
			this.canvas = canvas;
			this.ctx = this.canvas.getContext("2d");
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

	renderHUD(score) {
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
		/*if ( dt < 10 ) {
			dt = "  " + dt;
		} else if ( dt < 100 ) {
			dt = " " + dt;
		}*/
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

	renderPlayGround(dt, time) {
		// Rendering the canvas, the player and the platforms
		this.renderBackground();
		this.renderPlayer();
		this.renderPlatforms();
		this.renderHUD(-1 * this.screenPosition.x)
	}

	private _mainLoop = () => {
		//allowed area: screenPosition.x +100 screenPosition.x +500
		if ( this.screenPosition.x + 20 >= this.player.x ) {
			//screenPosition.x += 2;
		} else if (this.screenPosition.x + this.canvasWidth / 2 + 20 <= this.player.x ) {
			if (this.isMobile && this.screenPosition.x + this.canvasWidth - 40 <= this.player.x) {
				this.screenPosition.x -= this.currentLevel * 2;
			} else if(!this.isMobile) {
				this.screenPosition.x -= this.currentLevel * 2;
			}

		}

		if ( this.player.y > this.canvasHeight + 100 ) {
			clearInterval(this.interval);
			this.gameRunningState = false;
			setTimeout( () => {
				this.renderGameOverScreen(-1 * this.screenPosition.x)
			}, 100);
			return;
		}

		// If the player is not jumping apply the effect of frictiom
		if ( !this.player.jump ) {
			this.player.x_v *= this.friction;
		} else {
			// If the player is in the air then apply the effect of gravity
			this.player.y_v += this.gravity;
		}
		this.player.jump = true;
		// If the left key is pressed increase the relevant horizontal velocity
		if ( this.keys.left ) {
			this.player.x_v = -(this.currentLevel * 1.2) - 1.3;
		}
		if ( this.keys.right ) {
			this.player.x_v = (this.currentLevel * 1.2) + 1.3;
		}
		// Updating the y and x coordinates of the player
		this.player.y += this.player.y_v;
		this.player.x += this.player.x_v;
		// A simple code that checks for collisions with the platform
		let i = -1;
		let currentHeight = 0;
		for ( let index = 0; index < this.level.platforms.length; index++ ) {
			let platform = this.level.platforms[index];
			if ( platform.x < this.player.x + 15 &&
				this.player.x - 5 < platform.x + platform.width &&
				platform.y < this.player.y &&
				this.player.y - 20 < platform.y + platform.height ) {

				if ( currentHeight < platform.y + platform.height ) {
					currentHeight = platform.y + platform.height;
					i = index;
					index = this.level.platforms.length; //Exit
				}
			}
		}


		if ( i > -1 ) {
			this.player.jump = false;
			this.player.y = this.level.platforms[i].y;
			if ( this.level.platforms[i].last ) {
				clearInterval(this.interval);
				this.gameRunningState = false;
				setTimeout(() => {
					this.renderNextLevelScreen(-1 * this.screenPosition.x)
				}, 100);
				return;
			}
		}

		if ( this.level.platforms[0] ) {
			if ( (this.player.x - this.canvasWidth) > this.level.platforms[0].x ) {
				this.level.platforms.shift();
			}
		}
	}

	setPlayerSprite(sprite: NPC) {
		this.playerSprite = sprite;
	}

	attachEvents() {
		if (this.eventsAttached) {
			return;
		}
		this.eventsAttached = true;
		const self = this;
		let mousePos;

		function keydown(e) {
			if ( e.key === "a" || e.key === "ArrowLeft" ) {
				self.keys.left = true;
				if (self.playerSprite) {
					self.playerSprite.setActionType("left");
				}
			}
			if ( e.key === "w" || e.key === "ArrowUp" ) {
				if ( self.player.jump === false ) {
					self.player.y_v = -10;
				}
			}
			if ( e.key === "d" || e.key === "ArrowRight" ) {
				self.keys.right = true;
				if (self.playerSprite) {
					self.playerSprite.setActionType("right");
				}
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
				if (self.playerSprite) {
					self.playerSprite.setActionType("idle");
				}
			}
			if ( e.key === "Enter" && !self.gameRunningState ) {
				self.restartGame();
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
					if (self.playerSprite) {
						self.playerSprite.setActionType("left");
					}
				} else if ( mouseEvent.clientX > self.canvasWidth / 2 ) {
					self.keys.right = true;
					if (self.playerSprite) {
						self.playerSprite.setActionType("right");
					}
				}
			} else {
				if ( !self.player.jump ) {
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
			if (self.playerSprite) {
				self.playerSprite.setActionType("idle");
			}
		});

		self.canvas.addEventListener("mousemove", function (mouseEvent) {
			if ( mouseEvent.clientY < self.canvasHeight - 150 && mouseStarted ) {
				if ( !self.player.jump ) {
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

	private setRenderEnvironment() {
		if (window) {
			requestAnimFrame =
				window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function (callback) {
					window.setTimeout(callback, 1000 / 60);
				};
			cancelAnimFrame = window.cancelAnimationFrame ||
				window.webkitCancelRequestAnimationFrame ||
				window.mozCancelAnimationFrame ||
				window.msCancelAnimationFrame ||
				window.clearTimeout
		} else {
			requestAnimFrame =
				function (callback) {
					return setTimeout(callback, 1000 / 60) as number;
				};
			cancelAnimFrame = clearTimeout
		}
	}
}


