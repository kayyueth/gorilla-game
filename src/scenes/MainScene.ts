import Phaser from "phaser";
import gorillaPurpleAltSheet from "@assets/gorilla.png";

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

const PLAYER_SPEED = 30;
const COLLIDABLE_TILESETS: ReadonlyArray<string> = ["Fences"];

interface NpcDefinition {
  id: string;
  textureKey: string;
  assetPath: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  speed: number;
  depth: number;
  tint?: number;
}

interface NpcState {
  definition: NpcDefinition;
  sprite: Phaser.Physics.Arcade.Sprite;
  moveTimer?: Phaser.Time.TimerEvent;
  lastDirection: Direction;
  currentAnimationKey?: string;
  isWalking: boolean;
  isResting: boolean;
  movementInterrupted: boolean;
  isTouchingPlayer: boolean;
  collider?: Phaser.Physics.Arcade.Collider;
}

const NPC_DEFINITIONS: ReadonlyArray<NpcDefinition> = [
  {
    id: "gorilla-purple-alt",
    textureKey: "gorilla-purple-alt",
    assetPath: gorillaPurpleAltSheet,
    frameWidth: 646,
    frameHeight: 640,
    scale: 0.037,
    speed: 5,
    depth: 2.4,
  },
  {
    id: "gorilla-amber",
    textureKey: "gorilla-amber",
    assetPath: gorillaPurpleAltSheet,
    frameWidth: 646,
    frameHeight: 640,
    scale: 0.035,
    speed: 6,
    depth: 2.3,
    tint: 0xffc107,
  },
  {
    id: "gorilla-emerald",
    textureKey: "gorilla-emerald",
    assetPath: gorillaPurpleAltSheet,
    frameWidth: 646,
    frameHeight: 640,
    scale: 0.038,
    speed: 4,
    depth: 2.2,
    tint: 0x2ecc71,
  },
  {
    id: "gorilla-sapphire",
    textureKey: "gorilla-sapphire",
    assetPath: gorillaPurpleAltSheet,
    frameWidth: 646,
    frameHeight: 640,
    scale: 0.036,
    speed: 7,
    depth: 2.5,
    tint: 0x3498db,
  },
  {
    id: "gorilla-crimson",
    textureKey: "gorilla-crimson",
    assetPath: gorillaPurpleAltSheet,
    frameWidth: 646,
    frameHeight: 640,
    scale: 0.034,
    speed: 6,
    depth: 2.1,
    tint: 0xe74c3c,
  },
] as const;

const NPC_ANIMATIONS = [
  { suffix: "walk-down", start: 0, end: 3, direction: "down" },
  { suffix: "walk-up", start: 4, end: 7, direction: "up" },
  { suffix: "walk-left", start: 8, end: 11, direction: "left" },
  { suffix: "walk-right", start: 12, end: 15, direction: "right" },
] as const;

const NPC_IDLE_FRAMES: Record<Direction, number> = {
  down: 0,
  up: 4,
  left: 8,
  right: 12,
};

const NPC_WALK_DIRECTIONS: Array<{ x: number; y: number }> = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const NPC_PROXIMITY_THRESHOLD = 50;

export class MainScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private lastDirection: Direction = "down";
  private dialogBox?: Phaser.GameObjects.Image;
  private dialogText?: Phaser.GameObjects.Text;
  private isDialogOpen: boolean = false;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;
  private dialogCloseTime: number = 0;
  private readonly DIALOG_COOLDOWN: number = 500; // 500ms cooldown after closing dialog
  private npcs: Record<string, NpcState> = {};
  private activeNpcId?: string;
  private playerCanTriggerDialog: boolean = true;
  private isPlayerOverlappingNpc: boolean = false;

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
    NPC_DEFINITIONS.forEach(
      ({ textureKey, assetPath, frameWidth, frameHeight }) => {
        this.load.spritesheet(textureKey, assetPath, {
          frameWidth,
          frameHeight,
        });
      }
    );
    this.load.image("dialog-box", "/Premade dialog box  big.png");
  }

  create(): void {
    const map = this.make.tilemap({ key: "main-map" });

    const tilesets = TILESET_CONFIG.map(({ name, key }) =>
      map.addTilesetImage(name, key)
    ).filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset));

    const waterLayer = map.createLayer("water", tilesets, 0, 0);
    const landLayer = map.createLayer("land", tilesets, 0, 0);
    const objectLayer = map.createLayer("object", tilesets, 0, 0);
    waterLayer?.setDepth(0);
    landLayer?.setDepth(1);
    objectLayer?.setDepth(2);

    if (waterLayer && landLayer) {
      waterLayer.forEachTile((tile) => {
        const supportingLand = landLayer.getTileAt(tile.x, tile.y);
        if (supportingLand && supportingLand.index > 0) {
          tile.index = -1;
        }
      });
      waterLayer.setCollisionByExclusion([-1]);
    }

    this.createPlayer(map.widthInPixels, map.heightInPixels);
    this.createNpcs(map.widthInPixels, map.heightInPixels);
    if (waterLayer) {
      this.physics.add.collider(this.player, waterLayer);
      Object.values(this.npcs).forEach(({ sprite }) =>
        this.physics.add.collider(sprite, waterLayer)
      );
    }
    if (objectLayer) {
      this.registerTileCollisions(objectLayer, tilesets, COLLIDABLE_TILESETS);
      this.physics.add.collider(this.player, objectLayer);
      Object.values(this.npcs).forEach(({ sprite }) =>
        this.physics.add.collider(sprite, objectLayer)
      );
    }

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error("Keyboard plugin unavailable.");
    this.cursors = keyboard.createCursorKeys();
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(6);
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);

    // Create dialog box (initially hidden)
    this.createDialogBox();
  }

  update(): void {
    if (!this.player || !this.cursors) return;

    // Handle dialog closing
    if (this.isDialogOpen) {
      if (
        (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
        (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey))
      ) {
        this.hideDialog();
      }
      return;
    }

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.isPlayerOverlappingNpc = false;
    Object.values(this.npcs).forEach((npcState) =>
      this.handleNpcProximity(npcState, playerBody)
    );
    if (!this.isPlayerOverlappingNpc && !this.playerCanTriggerDialog) {
      this.playerCanTriggerDialog = true;
    }

    const touchingNpc = Object.values(this.npcs).find(
      (npc) => npc.isTouchingPlayer
    );
    if (touchingNpc) {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setFrame(IDLE_FRAMES[this.lastDirection]);
      this.makeNpcRest(touchingNpc);
      return;
    }

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

    Object.values(this.npcs).forEach((npcState) =>
      this.updateNpcAnimation(npcState)
    );
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

  private createNpcs(mapWidth: number, mapHeight: number): void {
    NPC_DEFINITIONS.forEach((definition) =>
      this.createNpc(definition, mapWidth, mapHeight)
    );
  }

  private createNpc(
    definition: NpcDefinition,
    mapWidth: number,
    mapHeight: number
  ): void {
    const sprite = this.physics.add.sprite(
      Phaser.Math.Between(100, mapWidth - 100),
      Phaser.Math.Between(100, mapHeight - 100),
      definition.textureKey
    );
    sprite.setDepth(definition.depth);
    sprite.setScale(definition.scale);
    if (definition.tint !== undefined) {
      sprite.setTint(definition.tint);
    } else {
      sprite.clearTint();
    }
    sprite.setCollideWorldBounds(true);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(definition.frameWidth * 0.35, definition.frameHeight * 0.35);
    body.setOffset(
      definition.frameWidth * 0.325,
      definition.frameHeight * 0.45
    );

    this.ensureNpcAnimations(definition);

    const state: NpcState = {
      definition,
      sprite,
      lastDirection: "down",
      isWalking: false,
      isResting: Phaser.Math.Between(0, 1) === 0,
      movementInterrupted: false,
      isTouchingPlayer: false,
    };

    state.collider = this.physics.add.collider(this.player, sprite);
    this.physics.add.overlap(
      this.player,
      sprite,
      () => this.onPlayerTouchNpc(definition.id),
      undefined,
      this
    );

    this.npcs[definition.id] = state;

    if (state.isResting) {
      this.makeNpcRest(state);
    } else {
      this.pickNpcDirection(state);
    }
    this.scheduleNpcMove(state);
  }

  private ensureNpcAnimations(definition: NpcDefinition): void {
    const texture = this.textures.get(definition.textureKey);
    if (!texture) return;

    const totalFrames = texture.frameTotal;

    NPC_ANIMATIONS.forEach(({ suffix, start, end }) => {
      if (end >= totalFrames) return;

      const key = `${definition.textureKey}-${suffix}`;
      if (this.anims.exists(key)) return;

      const frames = this.anims.generateFrameNumbers(definition.textureKey, {
        start,
        end,
      });
      if (frames.length === 0) return;

      this.anims.create({
        key,
        frames,
        frameRate: 6,
        repeat: -1,
      });
    });
  }

  private registerTileCollisions(
    layer: Phaser.Tilemaps.TilemapLayer,
    tilesets: Phaser.Tilemaps.Tileset[],
    tilesetNames: ReadonlyArray<string>
  ): void {
    tilesetNames.forEach((name) => {
      const tileset = tilesets.find((set) => set.name === name);
      if (!tileset || tileset.total === 0) return;
      const firstIndex = tileset.firstgid;
      const lastIndex = firstIndex + tileset.total - 1;
      layer.setCollisionBetween(firstIndex, lastIndex);
    });
  }

  private scheduleNpcMove(state: NpcState): void {
    if (this.isDialogOpen || state.isTouchingPlayer) return;

    state.moveTimer?.remove(false);

    if (state.isResting) {
      const restDuration = Phaser.Math.Between(2000, 4000);
      state.moveTimer = this.time.addEvent({
        delay: restDuration,
        callback: () => {
          if (this.isDialogOpen || state.isTouchingPlayer) return;
          state.isResting = false;
          this.pickNpcDirection(state);
          this.scheduleNpcMove(state);
        },
      });
    } else {
      const walkDuration = Phaser.Math.Between(3000, 6000);
      state.moveTimer = this.time.addEvent({
        delay: walkDuration,
        callback: () => {
          if (this.isDialogOpen || state.isTouchingPlayer) return;
          state.isResting = true;
          this.makeNpcRest(state);
          this.scheduleNpcMove(state);
        },
      });
    }
  }

  private pickNpcDirection(state: NpcState): void {
    if (this.isDialogOpen || state.isWalking) return;
    const direction = Phaser.Utils.Array.GetRandom(NPC_WALK_DIRECTIONS);
    if (!direction) return;

    state.sprite.setVelocity(
      direction.x * state.definition.speed,
      direction.y * state.definition.speed
    );

    const facing: Direction =
      direction.x > 0
        ? "right"
        : direction.x < 0
        ? "left"
        : direction.y > 0
        ? "down"
        : "up";

    const animationKey = `${state.definition.textureKey}-walk-${facing}`;
    state.lastDirection = facing;
    state.sprite.setFlipX(facing === "left" || facing === "right");

    if (this.anims.exists(animationKey)) {
      state.currentAnimationKey = animationKey;
      state.sprite.anims.play(animationKey, true);
      state.isWalking = true;
      return;
    }

    this.makeNpcRest(state);
  }

  private makeNpcRest(state: NpcState): void {
    state.sprite.setVelocity(0, 0);
    state.sprite.anims.stop();
    state.sprite.setFrame(NPC_IDLE_FRAMES[state.lastDirection]);
    state.sprite.setFlipX(
      state.lastDirection === "left" || state.lastDirection === "right"
    );
    state.currentAnimationKey = undefined;
    state.isWalking = false;
  }

  private updateNpcAnimation(state: NpcState): void {
    if (this.isDialogOpen) return;
    const body = state.sprite.body as Phaser.Physics.Arcade.Body;
    const velocity = new Phaser.Math.Vector2(body.velocity.x, body.velocity.y);

    if (velocity.lengthSq() === 0) {
      if (state.sprite.anims.isPlaying) state.sprite.anims.stop();
      state.sprite.setFrame(NPC_IDLE_FRAMES[state.lastDirection]);
      state.sprite.setFlipX(
        state.lastDirection === "left" || state.lastDirection === "right"
      );
      state.currentAnimationKey = undefined;
      state.isWalking = false;
    }
  }

  private handleNpcProximity(
    state: NpcState,
    playerBody: Phaser.Physics.Arcade.Body
  ): void {
    const npcBody = state.sprite.body as Phaser.Physics.Arcade.Body;
    const playerBounds = new Phaser.Geom.Rectangle(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );
    const npcBounds = new Phaser.Geom.Rectangle(
      npcBody.x,
      npcBody.y,
      npcBody.width,
      npcBody.height
    );

    const isOverlapping = Phaser.Geom.Rectangle.Overlaps(
      playerBounds,
      npcBounds
    );
    if (isOverlapping) {
      this.isPlayerOverlappingNpc = true;
    }
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      state.sprite.x,
      state.sprite.y
    );

    if (
      (distance < NPC_PROXIMITY_THRESHOLD || isOverlapping) &&
      !state.isTouchingPlayer
    ) {
      if (!state.movementInterrupted) {
        state.moveTimer?.remove(false);
        state.movementInterrupted = true;
      }
      if (state.collider) {
        state.collider.active = false;
      }
      npcBody.setImmovable(true);
      this.makeNpcRest(state);
      state.isResting = true;
    } else if (
      distance >= NPC_PROXIMITY_THRESHOLD &&
      !isOverlapping &&
      !state.isTouchingPlayer
    ) {
      if (state.collider && !state.collider.active) {
        state.collider.active = true;
      }
      if (npcBody.immovable) {
        npcBody.setImmovable(false);
      }
      if (state.movementInterrupted) {
        state.movementInterrupted = false;
        this.scheduleNpcMove(state);
      }
    }

    if (!isOverlapping && state.isTouchingPlayer && !this.isDialogOpen) {
      state.isTouchingPlayer = false;
      if (state.collider) {
        state.collider.active = true;
      }
      npcBody.setImmovable(false);
      if (state.movementInterrupted) {
        state.movementInterrupted = false;
        this.scheduleNpcMove(state);
      }
    }
  }

  private onPlayerTouchNpc(npcId: string): void {
    if (this.isDialogOpen || !this.playerCanTriggerDialog) return;

    const state = this.npcs[npcId];
    if (!state) return;

    const timeSinceClose = this.time.now - this.dialogCloseTime;
    if (timeSinceClose < this.DIALOG_COOLDOWN) return;

    this.playerCanTriggerDialog = false;
    state.isTouchingPlayer = true;
    this.activeNpcId = npcId;

    if (state.collider) {
      state.collider.active = false;
    }

    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.player.setFrame(IDLE_FRAMES[this.lastDirection]);

    state.moveTimer?.remove(false);
    this.makeNpcRest(state);
    state.isResting = true;
    const npcBody = state.sprite.body as Phaser.Physics.Arcade.Body;
    npcBody.setImmovable(true);

    this.showDialog();
  }

  private createDialogBox(): void {
    this.dialogBox = this.add.image(0, 0, "dialog-box");
    this.dialogBox.setDepth(100);
    this.dialogBox.setScale(0.5);
    this.dialogBox.setVisible(false);
    this.dialogBox.setScrollFactor(0);

    // Create text with the pixel font
    this.dialogText = this.add.text(0, 0, "", {
      // fontFamily: "PixelFont",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "20px",
      color: "#000000",
      align: "center",
    });
    this.dialogText.setDepth(101);
    this.dialogText.setVisible(false);
    this.dialogText.setScrollFactor(0);

    this.centerDialog();
    this.scale.on("resize", this.centerDialog, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.centerDialog, this);
    });
  }

  private showDialog(): void {
    if (this.isDialogOpen || !this.dialogBox || !this.player) return;

    this.isDialogOpen = true;
    this.dialogBox.setVisible(true);
    if (this.dialogText) {
      this.dialogText.setVisible(true);
    }
  }

  private centerDialog(): void {
    if (!this.dialogBox) return;
    const { width, height } = this.scale;
    this.dialogBox.setPosition(width / 2, height / 2);
    if (this.dialogText) {
      // Position text slightly above center to align with dialog box text area
      this.dialogText.setPosition(width / 2, height / 2 - 10);
    }
  }

  private hideDialog(): void {
    if (!this.dialogBox || !this.isDialogOpen) return;

    this.isDialogOpen = false;
    this.dialogBox.setVisible(false);
    if (this.dialogText) {
      this.dialogText.setVisible(false);
    }

    this.dialogCloseTime = this.time.now;

    if (this.activeNpcId) {
      const npc = this.npcs[this.activeNpcId];
      if (npc) {
        npc.isTouchingPlayer = false;
        if (npc.collider) {
          npc.collider.active = true;
        }
        const npcBody = npc.sprite.body as Phaser.Physics.Arcade.Body;
        npcBody.setImmovable(false);
        npc.movementInterrupted = false;

        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          npc.sprite.x,
          npc.sprite.y
        );
        if (distance >= NPC_PROXIMITY_THRESHOLD) {
          npc.isResting = false;
          this.pickNpcDirection(npc);
        }
        this.scheduleNpcMove(npc);
      }
    }

    this.activeNpcId = undefined;
  }
}
