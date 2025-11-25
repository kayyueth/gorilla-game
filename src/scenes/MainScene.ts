import Phaser from "phaser";

const TILESET_CONFIG = [
  { name: "Hills", key: "tiles-hills", file: "Hills.png" },
  { name: "Grass", key: "tiles-grass", file: "Grass.png" },
  { name: "Tilled Dirt", key: "tiles-dirt", file: "Tilled Dirt.png" },
  { name: "Fences", key: "tiles-fences", file: "Fences.png" },
  {
    name: "Basic_Grass_Biom_things",
    key: "tiles-biom",
    file: "Basic_Grass_Biom_things.png",
  },
  { name: "Water", key: "tiles-water", file: "Water.png" },
];

const PLAYER_ANIMATIONS = [
  { key: "player-walk-down", start: 0, end: 3, direction: "down" },
  { key: "player-walk-up", start: 4, end: 7, direction: "up" },
  { key: "player-walk-left", start: 8, end: 11, direction: "left" },
  { key: "player-walk-right", start: 12, end: 15, direction: "right" },
] as const;

type Direction = (typeof PLAYER_ANIMATIONS)[number]["direction"];

const IDLE_FRAMES: Record<Direction, number> = {
  down: 0,
  up: 4,
  left: 8,
  right: 12,
};

const PLAYER_SPEED = 120;

export class MainScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private lastDirection: Direction = "down";

  constructor() {
    super("MainScene");
  }

  preload(): void {
    this.load.tilemapTiledJSON("main-map", "map_v1.tmj");
    TILESET_CONFIG.forEach(({ key, file }) => this.load.image(key, file));
    this.load.spritesheet("player", "Basic Charakter Spritesheet.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create(): void {
    const map = this.make.tilemap({ key: "main-map" });

    const tilesets = TILESET_CONFIG.map(({ name, key }) =>
      map.addTilesetImage(name, key)
    ).filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

    const waterLayer = map.createLayer("water", tilesets, 0, 0);
    const landLayer = map.createLayer("land", tilesets, 0, 0);
    waterLayer?.setDepth(0);
    landLayer?.setDepth(1);

    if (waterLayer && landLayer) {
      waterLayer.forEachTile((tile) => {
        const supportingLand = landLayer.getTileAt(tile.x, tile.y);
        if (supportingLand && supportingLand.index > 0) {
          tile.index = -1;
        }
      });
      waterLayer.setCollisionByExclusion([-1]);
    }

    map.createLayer("object", tilesets, 0, 0)?.setDepth(2);

    this.createPlayer(map.widthInPixels, map.heightInPixels);
    if (waterLayer) this.physics.add.collider(this.player, waterLayer);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard plugin unavailable.");
    this.cursors = keyboard.createCursorKeys();

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(6);
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    const velocity = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left?.isDown) velocity.x = -PLAYER_SPEED;
    else if (this.cursors.right?.isDown) velocity.x = PLAYER_SPEED;

    if (this.cursors.up?.isDown) velocity.y = -PLAYER_SPEED;
    else if (this.cursors.down?.isDown) velocity.y = PLAYER_SPEED;

    this.player.setVelocity(velocity.x, velocity.y);

    if (velocity.lengthSq() === 0) {
      this.player.anims.stop();
      this.player.setFrame(IDLE_FRAMES[this.lastDirection]);
      return;
    }

    const animation = this.getAnimationKey(velocity);
    if (animation) {
      this.player.anims.play(animation, true);
      this.lastDirection = this.getDirectionFromAnimation(animation);
    }
  }

  private createPlayer(mapWidth: number, mapHeight: number): void {
    this.player = this.physics.add.sprite(
      mapWidth / 2,
      mapHeight / 2,
      "player"
    );
    this.player.setDepth(3);
    this.player.setScale(0.75);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 20);
    body.setOffset(15, 20);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    PLAYER_ANIMATIONS.forEach(({ key, start, end }) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("player", { start, end }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  private getAnimationKey(velocity: Phaser.Math.Vector2): string | null {
    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      return velocity.x > 0 ? "player-walk-right" : "player-walk-left";
    }

    if (velocity.y > 0) return "player-walk-down";
    if (velocity.y < 0) return "player-walk-up";
    return null;
  }

  private getDirectionFromAnimation(animationKey: string): Direction {
    const animation = PLAYER_ANIMATIONS.find(({ key }) => key === animationKey);
    return animation?.direction ?? this.lastDirection;
  }
}
