import Phaser from "phaser";

export interface NFTData {
  nftName: string;
  authorName: string;
  price: string;
  likes: string | number;
}

interface NFTCardConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  backgroundTexture: string;
  nftImageTexture: string;
  priceTagTexture: string;
  heartTexture: string;
  nftData?: NFTData;
  depth?: number;
  maxWidthPercent?: number;
  maxHeightPercent?: number;
}

export class NFTCard extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Image;
  private nftImage: Phaser.GameObjects.Image;
  private priceTag: Phaser.GameObjects.Image;
  private heart: Phaser.GameObjects.Image;
  private nftNameText: Phaser.GameObjects.Text;
  private authorNameText: Phaser.GameObjects.Text;
  private priceText: Phaser.GameObjects.Text;
  private likesText: Phaser.GameObjects.Text;
  private maxWidthPercent: number;
  private maxHeightPercent: number;
  private nftNameInput?: HTMLInputElement;
  private authorNameInput?: HTMLInputElement;
  private priceInput?: HTMLInputElement;
  private likesInput?: HTMLInputElement;
  private nftData: NFTData;

  constructor(config: NFTCardConfig) {
    const {
      scene,
      x = 0,
      y = 0,
      backgroundTexture,
      nftImageTexture,
      priceTagTexture,
      heartTexture,
      nftData,
      depth = 100,
      maxWidthPercent = 0.6,
      maxHeightPercent = 0.8,
    } = config;

    super(scene, x, y);

    // Initialize NFT data with defaults or provided data
    this.nftData = nftData || {
      nftName: "NFT Name #1",
      authorName: "Author Name",
      price: "$88.00",
      likes: "27",
    };

    this.maxWidthPercent = maxWidthPercent;
    this.maxHeightPercent = maxHeightPercent;

    // Create background
    this.background = scene.add.image(0, 0, backgroundTexture);
    this.background.setOrigin(0.5);
    this.background.setScrollFactor(0);
    this.background.disableInteractive();

    // Create NFT image (top section)
    this.nftImage = scene.add.image(0, 0, nftImageTexture);
    this.nftImage.setOrigin(0.5);
    this.nftImage.setScrollFactor(0);
    this.nftImage.disableInteractive();

    // Create price tag (bottom left)
    this.priceTag = scene.add.image(0, 0, priceTagTexture);
    this.priceTag.setOrigin(0.5);
    this.priceTag.setScrollFactor(0);
    this.priceTag.disableInteractive();

    // Create heart icon (bottom right)
    this.heart = scene.add.image(0, 0, heartTexture);
    this.heart.setOrigin(0.5);
    this.heart.setScrollFactor(0);
    this.heart.disableInteractive();

    // Create text objects
    const textStyle = {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "24px",
      color: "#333333",
      align: "center",
    };

    this.nftNameText = scene.add.text(0, 0, this.nftData.nftName, {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "24px",
      color: "#333333",
      align: "left",
      fontStyle: "bold",
    });
    this.nftNameText.setOrigin(0, 0.5);
    this.nftNameText.setScrollFactor(0);
    this.nftNameText.disableInteractive();

    this.authorNameText = scene.add.text(0, 0, this.nftData.authorName, {
      ...textStyle,
      fontSize: "18px",
      align: "left",
    });
    this.authorNameText.setOrigin(0, 0.5);
    this.authorNameText.setScrollFactor(0);
    this.authorNameText.disableInteractive();

    this.priceText = scene.add.text(0, 0, this.nftData.price, {
      ...textStyle,
      fontSize: "20px",
    });
    this.priceText.setOrigin(0.5);
    this.priceText.setScrollFactor(0);
    this.priceText.disableInteractive();

    const likesValue = String(this.nftData.likes);
    this.likesText = scene.add.text(0, 0, likesValue, {
      ...textStyle,
      fontSize: "20px",
    });
    this.likesText.setOrigin(0.5);
    this.likesText.setScrollFactor(0);
    this.likesText.disableInteractive();

    // Add all elements to container
    this.add([
      this.background,
      this.nftImage,
      this.priceTag,
      this.heart,
      this.nftNameText,
      this.authorNameText,
      this.priceText,
      this.likesText,
    ]);

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(depth);
    this.disableInteractive();

    // Setup text input handlers
    this.setupTextInputs();

    // Position all elements
    this.updateLayout();
  }

  private setupTextInputs(): void {
    // Create hidden input elements for text editing
    const canvas = this.scene.game.canvas;
    const container = canvas.parentElement;

    if (!container) return;

    // NFT Name Input
    this.nftNameInput = document.createElement("input");
    this.nftNameInput.type = "text";
    this.nftNameInput.value = this.nftData.nftName;
    this.nftNameInput.style.position = "absolute";
    this.nftNameInput.style.background = "transparent";
    this.nftNameInput.style.border = "2px solid #4a90e2";
    this.nftNameInput.style.borderRadius = "4px";
    this.nftNameInput.style.padding = "4px 8px";
    this.nftNameInput.style.fontSize = "24px";
    this.nftNameInput.style.fontFamily = "system-ui, sans-serif";
    this.nftNameInput.style.fontWeight = "bold";
    this.nftNameInput.style.color = "#333333";
    this.nftNameInput.style.textAlign = "left";
    this.nftNameInput.style.display = "none";
    this.nftNameInput.style.zIndex = "10000";
    container.appendChild(this.nftNameInput);

    // Author Name Input
    this.authorNameInput = document.createElement("input");
    this.authorNameInput.type = "text";
    this.authorNameInput.value = this.nftData.authorName;
    this.authorNameInput.style.position = "absolute";
    this.authorNameInput.style.background = "transparent";
    this.authorNameInput.style.border = "2px solid #4a90e2";
    this.authorNameInput.style.borderRadius = "4px";
    this.authorNameInput.style.padding = "4px 8px";
    this.authorNameInput.style.fontSize = "18px";
    this.authorNameInput.style.fontFamily = "system-ui, sans-serif";
    this.authorNameInput.style.color = "#333333";
    this.authorNameInput.style.textAlign = "left";
    this.authorNameInput.style.display = "none";
    this.authorNameInput.style.zIndex = "10000";
    container.appendChild(this.authorNameInput);

    // Price Input
    this.priceInput = document.createElement("input");
    this.priceInput.type = "text";
    this.priceInput.value = this.nftData.price;
    this.priceInput.style.position = "absolute";
    this.priceInput.style.background = "transparent";
    this.priceInput.style.border = "2px solid #4a90e2";
    this.priceInput.style.borderRadius = "4px";
    this.priceInput.style.padding = "4px 8px";
    this.priceInput.style.fontSize = "20px";
    this.priceInput.style.fontFamily = "system-ui, sans-serif";
    this.priceInput.style.color = "#333333";
    this.priceInput.style.textAlign = "center";
    this.priceInput.style.display = "none";
    this.priceInput.style.zIndex = "10000";
    container.appendChild(this.priceInput);

    // Likes Input
    this.likesInput = document.createElement("input");
    this.likesInput.type = "text";
    this.likesInput.value = String(this.nftData.likes);
    this.likesInput.style.position = "absolute";
    this.likesInput.style.background = "transparent";
    this.likesInput.style.border = "2px solid #4a90e2";
    this.likesInput.style.borderRadius = "4px";
    this.likesInput.style.padding = "4px 8px";
    this.likesInput.style.fontSize = "20px";
    this.likesInput.style.fontFamily = "system-ui, sans-serif";
    this.likesInput.style.color = "#333333";
    this.likesInput.style.textAlign = "center";
    this.likesInput.style.display = "none";
    this.likesInput.style.zIndex = "10000";
    container.appendChild(this.likesInput);

    // Click handlers removed - all elements are unclickable

    // Handle input blur to hide and update text
    this.nftNameInput.addEventListener("blur", () => {
      if (this.nftNameInput) {
        this.hideInput(this.nftNameInput, this.nftNameText);
      }
    });
    this.authorNameInput.addEventListener("blur", () => {
      if (this.authorNameInput) {
        this.hideInput(this.authorNameInput, this.authorNameText);
      }
    });
    this.priceInput.addEventListener("blur", () => {
      if (this.priceInput) {
        this.hideInput(this.priceInput, this.priceText);
      }
    });
    this.likesInput.addEventListener("blur", () => {
      if (this.likesInput) {
        this.hideInput(this.likesInput, this.likesText);
      }
    });

    // Handle Enter key to blur
    this.nftNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.nftNameInput) {
        this.nftNameInput.blur();
      }
    });
    this.authorNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.authorNameInput) {
        this.authorNameInput.blur();
      }
    });
    this.priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.priceInput) {
        this.priceInput.blur();
      }
    });
    this.likesInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.likesInput) {
        this.likesInput.blur();
      }
    });
  }

  private hideInput(
    input: HTMLInputElement,
    textObject: Phaser.GameObjects.Text
  ): void {
    input.style.display = "none";
    textObject.setText(input.value);

    // Update nftData based on which input was changed
    if (input === this.nftNameInput) {
      this.nftData.nftName = input.value;
    } else if (input === this.authorNameInput) {
      this.nftData.authorName = input.value;
    } else if (input === this.priceInput) {
      this.nftData.price = input.value;
    } else if (input === this.likesInput) {
      this.nftData.likes = input.value;
    }

    this.updateLayout();
  }

  private updateLayout(): void {
    const bgWidth = this.background.displayWidth;
    const bgHeight = this.background.displayHeight;

    // Position NFT image at top (centered horizontally, upper third vertically)
    const nftImageY = -bgHeight / 2 + bgHeight * 0.25 + 10;
    this.nftImage.setPosition(0, nftImageY);

    // Scale NFT image to fit within top section
    const maxNftHeight = bgHeight;
    const nftScale = Math.min(maxNftHeight / this.nftImage.height, 1);
    this.nftImage.setScale(nftScale);

    // Position NFT name text below image (left-aligned)
    const nftNameY = nftImageY + this.nftImage.displayHeight / 2 + 30;
    const nftNameX = -bgWidth / 2 + 20; // Left padding
    this.nftNameText.setPosition(nftNameX, nftNameY);

    // Position author name text below NFT name (left-aligned)
    const authorNameY = nftNameY + 35;
    this.authorNameText.setPosition(nftNameX, authorNameY);

    // Position price tag at bottom left
    const priceTagX = -bgWidth / 2 + bgWidth * 0.25 + 10;
    const priceTagY = bgHeight / 2 - bgHeight * 0.15;
    this.priceTag.setPosition(priceTagX, priceTagY);

    // Scale price tag appropriately
    const priceTagScale = Math.min((bgWidth * 0.5) / this.priceTag.width, 1);
    this.priceTag.setScale(priceTagScale);

    // Position price text on price tag
    this.priceText.setPosition(priceTagX, priceTagY);

    // Position heart at bottom right
    const heartX = bgWidth / 2 - bgWidth * 0.25;
    const heartY = bgHeight / 2 - bgHeight * 0.15;
    this.heart.setPosition(heartX, heartY);

    // Scale heart appropriately
    const heartScale = Math.min((bgWidth * 0.1) / this.heart.width, 1);
    this.heart.setScale(heartScale);

    // Position likes text next to heart
    const likesX = heartX + this.heart.displayWidth / 2 + 15;
    this.likesText.setPosition(likesX, heartY);
  }

  show(): void {
    this.setVisible(true);
    // All elements remain unclickable
  }

  hide(): void {
    this.setVisible(false);

    // Hide any open inputs
    if (this.nftNameInput) this.nftNameInput.style.display = "none";
    if (this.authorNameInput) this.authorNameInput.style.display = "none";
    if (this.priceInput) this.priceInput.style.display = "none";
    if (this.likesInput) this.likesInput.style.display = "none";
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
    this.updateLayout();
  }

  updateNFTData(nftData: NFTData): void {
    this.nftData = nftData;

    // Update text objects
    this.nftNameText.setText(nftData.nftName);
    this.authorNameText.setText(nftData.authorName);
    this.priceText.setText(nftData.price);
    this.likesText.setText(String(nftData.likes));

    // Update input values
    if (this.nftNameInput) this.nftNameInput.value = nftData.nftName;
    if (this.authorNameInput) this.authorNameInput.value = nftData.authorName;
    if (this.priceInput) this.priceInput.value = nftData.price;
    if (this.likesInput) this.likesInput.value = String(nftData.likes);

    this.updateLayout();
  }

  getNFTData(): NFTData {
    return { ...this.nftData };
  }

  destroy(): void {
    // Remove input elements
    if (this.nftNameInput && this.nftNameInput.parentElement) {
      this.nftNameInput.parentElement.removeChild(this.nftNameInput);
    }
    if (this.authorNameInput && this.authorNameInput.parentElement) {
      this.authorNameInput.parentElement.removeChild(this.authorNameInput);
    }
    if (this.priceInput && this.priceInput.parentElement) {
      this.priceInput.parentElement.removeChild(this.priceInput);
    }
    if (this.likesInput && this.likesInput.parentElement) {
      this.likesInput.parentElement.removeChild(this.likesInput);
    }

    this.background.destroy();
    this.nftImage.destroy();
    this.priceTag.destroy();
    this.heart.destroy();
    this.nftNameText.destroy();
    this.authorNameText.destroy();
    this.priceText.destroy();
    this.likesText.destroy();
    super.destroy();
  }
}
