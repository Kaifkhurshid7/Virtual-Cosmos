import * as PIXI from 'pixi.js';

export class AvatarSprite extends PIXI.Container {
  private circle: PIXI.Graphics;
  private nameText: PIXI.Text;
  private glowRing: PIXI.Graphics;

  constructor(name: string, color: string) {
    super();

    // Glow Ring (for proximity highlight)
    this.glowRing = new PIXI.Graphics();
    this.glowRing
        .circle(0, 0, 40)
        .fill({ color: 0xffffff, alpha: 0.15 })
        .stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    this.glowRing.visible = false;
    this.addChild(this.glowRing);

    // Circle Avatar
    this.circle = new PIXI.Graphics();
    this.circle
        .circle(0, 0, 30)
        .fill({ color: color })
        .stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    this.addChild(this.circle);

    // Name Label
    this.nameText = new PIXI.Text({
        text: name,
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            fill: 0xffffff,
            align: 'center',
            fontWeight: '600'
        }
    });

    this.nameText.anchor.set(0.5, 0);
    this.nameText.position.set(0, 40);
    this.addChild(this.nameText);
  }

  public setProximity(active: boolean) {
    this.glowRing.visible = active;
    if (active) {
       // Animate pulse
       this.glowRing.alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    }
  }

  public updatePosition(x: number, y: number) {
     this.position.set(x, y);
  }
}
