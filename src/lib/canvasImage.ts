
export class CanvasImage {
    private _loadedImage: any;
    private name: any;
    private path: string;
    private _lastTime: number;
    private _elapsedTime: number;
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
