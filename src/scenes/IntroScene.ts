import Phaser from "phaser";

const INTRO_PARAGRAPHS: ReadonlyArray<string> = [
  [
    "Deep in Rwanda’s volcanic mountains, mountain gorillas still survive —",
    "not by chance, but through years of protection, tourism, and local stewardship.",
  ].join("\n"),
  [
    "When tourism vanished during COVID-19, so did the income that kept these systems alive.",
    "This game imagines another path.",
  ].join("\n"),
  [
    "By rescuing gorillas, you create real-world impact through digital ownership and collective action.",
    "Every rescue supports conservation, communities, and a future beyond fragile funding models.",
  ].join("\n"),
  "Welcome to a new kind of conservation game.",
];

const WARM_PALETTE = [0x3f1d1f, 0x5c2e30, 0x8c4a3c, 0xc07d5b, 0xf2c078];

export class IntroScene extends Phaser.Scene {
  private paragraphs: Array<Phaser.GameObjects.Text> = [];
  private hint?: Phaser.GameObjects.Text;
  private gorillaSprite?: Phaser.GameObjects.Image;
  private bgLayers: Array<Phaser.GameObjects.Graphics> = [];
  private title?: Phaser.GameObjects.Text;
  private textPanel?: Phaser.GameObjects.Graphics;

  constructor() {
    super("IntroScene");
  }

  preload(): void {
    this.load.image("intro-gorilla", "gorilla.png");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a0d10");
    this.createBackgroundLayers();
    this.createTextPanel();
    this.createTitle();
    this.createCopy();
    this.createGorillaBadge();
    this.createHint();
    this.registerInput();
    this.tweenInContent();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  private createBackgroundLayers(): void {
    this.bgLayers.forEach((layer) => layer.destroy());
    this.bgLayers = [];
    const { width, height } = this.scale;
    const stripeHeight = height / WARM_PALETTE.length;

    WARM_PALETTE.forEach((color, index) => {
      const layer = this.add.graphics();
      layer.fillStyle(color, 1);
      layer.fillRect(0, index * stripeHeight, width, stripeHeight + 2);
      layer.setAlpha(0.95 - index * 0.1);
      layer.setDepth(-10); // Keep transparent stripes behind text to avoid darkening via alpha blending.
      this.bgLayers.push(layer);
    });

    const noise = this.add.graphics();
    for (let i = 0; i < 200; i += 1) {
      const size = Phaser.Math.Between(2, 4);
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      noise.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.03, 0.08));
      noise.fillRect(x, y, size, size);
    }
    noise.setDepth(-9);
    this.bgLayers.push(noise);
  }

  private createTextPanel(): void {
    this.textPanel?.destroy();
    this.textPanel = this.add.graphics();
    this.textPanel.setDepth(6);
  }

  private createTitle(): void {
    this.title?.destroy();
    this.title = this.add.text(0, 0, "Gorilla Rescue Mission", {
      fontFamily:
        "PixelFont, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "44px",
      color: "#ffe9c4",
      align: "center",
      fontStyle: "bold",
      shadow: {
        offsetX: 0,
        offsetY: 5,
        color: "#000000",
        blur: 0,
        fill: true,
      },
    });
    this.title.setOrigin(0.5);
    this.title.setAlpha(0);
    this.title.setDepth(10);
  }

  private createCopy(): void {
    this.paragraphs.forEach((text) => text.destroy());
    this.paragraphs = [];

    INTRO_PARAGRAPHS.forEach((text, index) => {
      const paragraph = this.add.text(0, 0, text, this.getCopyStyle(index));
      paragraph.setAlpha(0);
      paragraph.setWordWrapWidth(this.getWrapWidth());
      paragraph.setOrigin(0, 0);
      paragraph.setLineSpacing(this.getLineSpacing());
      paragraph.setDepth(12);
      this.paragraphs.push(paragraph);
    });

    this.handleResize();
  }

  private createGorillaBadge(): void {
    const { width } = this.scale;
    this.gorillaSprite?.destroy();
    this.gorillaSprite = this.add.image(width / 2, 120, "intro-gorilla");
    this.gorillaSprite.setScale(2.5);
    this.gorillaSprite.setAlpha(0);
    this.gorillaSprite.setTint(0xf5d0c5);
  }

  private createHint(): void {
    this.hint?.destroy();
    this.hint = this.add.text(0, 0, "Press space, enter, or click to begin", {
      fontFamily:
        "PixelFont, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
    });
    this.hint.setAlpha(0);
    this.hint.setOrigin(0.5);
    this.hint.setDepth(12);
    this.positionHint();
  }

  private registerInput(): void {
    this.input.keyboard?.once("keydown-SPACE", this.startGame, this);
    this.input.keyboard?.once("keydown-ENTER", this.startGame, this);
    this.input.once("pointerdown", this.startGame, this);
  }

  private tweenInContent(): void {
    this.tweens.add({
      targets: this.gorillaSprite,
      alpha: 1,
      duration: 800,
      ease: "Sine.easeOut",
    });

    this.paragraphs.forEach((paragraph, index) => {
      this.tweens.add({
        targets: paragraph,
        alpha: 1,
        duration: 600,
        delay: 200 + index * 250,
        ease: "Sine.easeOut",
      });
    });

    if (this.title) {
      this.tweens.add({
        targets: this.title,
        alpha: 1,
        duration: 700,
        ease: "Sine.easeOut",
      });
    }

    if (this.hint) {
      this.tweens.add({
        targets: this.hint,
        alpha: 1,
        delay: 2500,
        duration: 400,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private handleResize(): void {
    const { width, height } = this.scale;
    this.createBackgroundLayers();
    const panelWidth = this.getPanelWidth();
    const panelPadding = this.getPanelPadding();
    const wrapWidth = panelWidth - panelPadding * 2;
    const spacing = this.getParagraphSpacing();
    const panel = this.textPanel;

    panel?.clear();

    const heights = this.paragraphs.map((paragraph, index) => {
      paragraph.setWordWrapWidth(wrapWidth);
      paragraph.setStyle(this.getCopyStyle(index));
      return paragraph.height;
    });

    const paragraphBlockHeight =
      heights.reduce((sum, value) => sum + value, 0) +
      spacing * (this.paragraphs.length - 1);
    const titleHeight = this.title?.height ?? 0;
    const panelHeight =
      panelPadding * 2 + titleHeight + spacing + paragraphBlockHeight;
    const panelX = (width - panelWidth) / 2;
    const panelY = Math.max(60, (height - panelHeight) / 2);

    if (panel) {
      panel.fillStyle(0x120607, 0.55);
      panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 24);
      panel.lineStyle(2, 0xf7d6c2, 0.4);
      panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 24);
    }

    if (this.title) {
      this.title.setPosition(panelX + panelWidth / 2, panelY + panelPadding);
    }

    let currentY = panelY + panelPadding + titleHeight + spacing;
    this.paragraphs.forEach((paragraph, index) => {
      paragraph.setPosition(panelX + panelPadding, currentY);
      currentY += heights[index] + (index < heights.length - 1 ? spacing : 0);
    });

    this.positionHint(panelX + panelWidth / 2, panelY + panelHeight + 60);

    if (this.gorillaSprite) {
      this.gorillaSprite.setPosition(width / 2, Math.max(panelY - 70, 100));
      this.gorillaSprite.setDepth(8);
    }
  }

  private positionHint(x?: number, y?: number): void {
    if (!this.hint) return;
    const { width, height } = this.scale;
    this.hint.setPosition(x ?? width / 2, y ?? height - 60);
  }

  private getWrapWidth(): number {
    const panelWidth = this.getPanelWidth();
    return panelWidth - this.getPanelPadding() * 2;
  }

  private getCopyStyle(
    paragraphIndex?: number
  ): Phaser.Types.GameObjects.Text.TextStyle {
    const responsiveSize = this.getFontSize();
    const isHeroParagraph = paragraphIndex === 0;
    const isClosingParagraph =
      paragraphIndex === INTRO_PARAGRAPHS.length - 1 && paragraphIndex !== 0;
    const color = isClosingParagraph ? "#fff1cc" : "#ffe9c4";
    const fontStyle = isHeroParagraph
      ? "normal"
      : isClosingParagraph
      ? "normal"
      : "lighter";
    return {
      fontFamily:
        "PixelFont, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: `${responsiveSize}px`,
      color,
      align: "left",
      fontStyle,
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: "#000000",
        blur: 0,
        fill: true,
      },
    };
  }

  private getParagraphSpacing(): number {
    return Math.max(32, Math.round(this.getFontSize() * 1.1));
  }

  private getFontSize(): number {
    return Math.max(18, Math.min(28, this.scale.width / 32));
  }

  private getLineSpacing(): number {
    return Math.round(this.getFontSize() * 0.55);
  }

  private getPanelWidth(): number {
    const { width } = this.scale;
    return Math.min(900, Math.max(520, width * 0.78));
  }

  private getPanelPadding(): number {
    return this.scale.width < 640 ? 56 : 80;
  }

  private startGame(): void {
    this.scene.start("MainScene");
  }
}
