'use client';

import {useEffect, useRef} from "react";
import {GameEngine} from "@/lib/gameEngine";
import {NPC} from "@/lib/npc";

export function GameContainer() {

    const reactCanvas = useRef(null);


    useEffect(() => {
        const { current: canvas } = reactCanvas;
        if (canvas) {
            console.log(canvas);
            const game = new GameEngine(canvas as HTMLCanvasElement);
            //
            window.game = game;
            game.restartGame();
            const penguin = new NPC("penguin");
            penguin.setCustomCuts(0,0, 144, 128);

            let loadedSprite = false;
            penguin.load().then(res=>{
                if(!loadedSprite) {
                    loadedSprite = true;
                    game.setPlayerSprite(penguin);
                }


            }).catch(e=>{
                console.log("error");
            });
        }
    }, []);

console.log('Render')
    return (
        <canvas ref={reactCanvas}/>
    )
}
