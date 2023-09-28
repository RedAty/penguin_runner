export class NPC {
    private customCut: { sHeight: any; sx: any; sy: any; sWidth: any };
    private sprites: any;
    private _currentSprite: any;
    private name: any;
    private imageFolder: string;
    private spriteCount: { idle: number; walking: number };
    private _currentID: number;
    private _lastTime: number;
    private _elapsedTime: number;

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
