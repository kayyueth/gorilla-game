import Phaser from "phaser";

interface MessageBoxConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  backgroundTexture: string;
  buttonTexture: string;
  buttonPaddingX?: number;
  buttonPaddingY?: number;
  closeIconTexture?: string;
  closeIconPaddingX?: number;
  closeIconPaddingY?: number;
  depth?: number;
  onConfirm?: () => void;
  maxWidthPercent?: number; // Max width as percentage of screen (0-1)
  maxHeightPercent?: number; // Max height as percentage of screen (0-1)
}

export class MessageBox extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Image;
  private button: Phaser.GameObjects.Image;
  private closeIcon?: Phaser.GameObjects.Image;
  private buttonBaseScale: number;
  private buttonPaddingX: number;
  private buttonPaddingY: number;
  private closeIconPaddingX: number;
  private closeIconPaddingY: number;
  private onConfirmCallback?: () => void;
  private maxWidthPercent: number;
  private maxHeightPercent: number;

  constructor(config: MessageBoxConfig) {
    const {
      scene,
      x = 0,
      y = 0,
      backgroundTexture,
      buttonTexture,
      buttonPaddingX = 20,
      buttonPaddingY = 20,
      closeIconTexture,
      closeIconPaddingX = 10,
      closeIconPaddingY = 0,
      depth = 100,
      onConfirm,
      maxWidthPercent = 0.08,
      maxHeightPercent = 0.16,
    } = config;

    super(scene, x, y);

    // scene.add ensures the sprites enter the Scene input tree before being re-parented.
    this.background = scene.add.image(0, 0, backgroundTexture);
    this.background.setOrigin(0.5);
    this.background.setScrollFactor(0);
    this.background.disableInteractive();

    this.button = scene.add.image(0, 0, buttonTexture);
    this.button.setOrigin(0.5);
    this.button.setScrollFactor(0);
    this.buttonBaseScale = 1;

    // Store padding values
    this.buttonPaddingX = buttonPaddingX;
    this.buttonPaddingY = buttonPaddingY;
    this.closeIconPaddingX = closeIconPaddingX;
    this.closeIconPaddingY = closeIconPaddingY;

    // Store callback
    this.onConfirmCallback = onConfirm;

    // Store scaling constraints
    this.maxWidthPercent = maxWidthPercent;
    this.maxHeightPercent = maxHeightPercent;

    // Position button at bottom-right relative to background
    this.updateButtonPosition();
    if (closeIconTexture) {
      this.closeIcon = scene.add.image(0, 0, closeIconTexture);
      this.closeIcon.setOrigin(0.5);
      this.closeIcon.setScrollFactor(0);
      this.closeIcon.setInteractive({ useHandCursor: true });
      this.closeIcon.on("pointerdown", () => {
        if (this.onConfirmCallback) this.onConfirmCallback();
      });
    }
    this.updateCloseIconPosition();

    // Add both to container and register with scene before enabling input
    const elements: Array<Phaser.GameObjects.Image> = [
      this.background,
      this.button,
    ];
    if (this.closeIcon) elements.splice(1, 0, this.closeIcon);
    this.add(elements);
    this.updateCloseIconPosition();
    scene.add.existing(this);

    // Make button interactive
    this.button.setInteractive({ useHandCursor: true });
    this.buttonBaseScale = this.button.scale;

    // Button interactions
    this.button.on("pointerover", () => {
      this.button.setScale(this.buttonBaseScale * 1.1);
    });
    this.button.on("pointerout", () => {
      this.button.setScale(this.buttonBaseScale);
    });
    this.button.on("pointerdown", () => {
      console.log("[MessageBox] confirm button clicked");
      if (this.onConfirmCallback) this.onConfirmCallback();
    });

    // Make container screen-space (not affected by camera)
    this.setScrollFactor(0);
    this.setDepth(depth);
  }

  private updateButtonPosition(): void {
    // width/height ignore container scaling, which breaks hit areas after fitToScreen.
    const bgWidth = this.background.displayWidth;
    const bgHeight = this.background.displayHeight;
    const btnWidth = this.button.displayWidth;
    const btnHeight = this.button.displayHeight;

    // displayWidth/Height reflect the actual rendered pixels, keeping padding consistent.
    const buttonX = bgWidth / 2 - btnWidth / 2 - this.buttonPaddingX - 20;
    const buttonY = bgHeight / 2 - btnHeight / 2 - this.buttonPaddingY - 20;

    this.button.setPosition(buttonX, buttonY);
  }

  private updateCloseIconPosition(): void {
    if (!this.closeIcon) return;
    const bgWidth = this.background.displayWidth;
    const bgHeight = this.background.displayHeight;
    const iconWidth = this.closeIcon.displayWidth;
    const iconHeight = this.closeIcon.displayHeight;

    const iconX = bgWidth / 2 - iconWidth / 2 - this.closeIconPaddingX;
    const iconY = -bgHeight / 2 - iconHeight / 2 - this.closeIconPaddingY;

    this.closeIcon.setPosition(iconX, iconY);
  }

  show(): void {
    this.setVisible(true);
    this.button.setInteractive({ useHandCursor: true });
    if (this.closeIcon) {
      this.closeIcon.setInteractive({ useHandCursor: true });
    }
  }

  hide(): void {
    this.setVisible(false);
    this.button.disableInteractive();
    if (this.closeIcon) {
      this.closeIcon.disableInteractive();
    }
  }

  setButtonPadding(x: number, y: number): void {
    this.buttonPaddingX = x;
    this.buttonPaddingY = y;
    this.updateButtonPosition();
  }

  setCloseIconPadding(x: number, y: number): void {
    this.closeIconPaddingX = x;
    this.closeIconPaddingY = y;
    this.updateCloseIconPosition();
  }

  setOnConfirm(callback: () => void): void {
    this.onConfirmCallback = callback;
  }

  centerOnScreen(): void {
    const { width, height } = this.scene.scale;
    this.setPosition(width / 2, height / 2);
  }

  fitToScreen(): void {
    const { width: screenWidth, height: screenHeight } = this.scene.scale;
    const sourceWidth = this.background.width;
    const sourceHeight = this.background.height;

    // Calculate max dimensions based on percentage
    const maxWidth = screenWidth * this.maxWidthPercent;
    const maxHeight = screenHeight * this.maxHeightPercent;

    // Calculate scale factor to fit within max dimensions
    const scaleX = maxWidth / sourceWidth;
    const scaleY = maxHeight / sourceHeight;
    const scaleFactor = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

    this.setScale(scaleFactor);
    this.updateButtonPosition();
    this.updateCloseIconPosition();
  }

  destroy(): void {
    this.button.destroy();
    if (this.closeIcon) this.closeIcon.destroy();
    this.background.destroy();
    super.destroy();
  }
}
