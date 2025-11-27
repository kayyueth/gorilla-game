import Phaser from "phaser";
import { IntroScene } from "./scenes/IntroScene";
import { MainScene } from "./scenes/MainScene";

function launch(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "app",
    backgroundColor: "#0b1d2a",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: [IntroScene, MainScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
  };

  return new Phaser.Game(config);
}

launch();
