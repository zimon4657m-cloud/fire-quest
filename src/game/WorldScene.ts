import Phaser from 'phaser';
import { MAP_H, MAP_W, findPath, interactionAt, isWalkable, tileAt, type Interaction, type WorldState } from '../logic/world';
import { createTileTextures, TILE_FRAMES, TILE_SIZE } from './textures';

export type WorldHooks = {
  getState(): WorldState;
  start: { x: number; y: number };
  onInteract(i: Interaction): void;
  onMoved(x: number, y: number): void;
  /** 画面(宿屋など)を開いている間は true。マップの操作を止める */
  isBlocked(): boolean;
};

const GATES = new Set(['B', 'G', 'P']);
const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class WorldScene extends Phaser.Scene {
  private hooks: WorldHooks;
  private tiles: Phaser.GameObjects.Image[][] = [];
  private player!: Phaser.GameObjects.Image;
  private pos = { x: 0, y: 0 };
  private moving = false;
  private queue: { x: number; y: number }[] = [];
  private bumpAfterQueue: { x: number; y: number } | null = null;

  constructor(hooks: WorldHooks) {
    super('world');
    this.hooks = hooks;
  }

  preload(): void {
    this.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    createTileTextures(this);
    for (let y = 0; y < MAP_H; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        // 素材の木や屋根は背景が透明なので、下に草を敷く
        this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'tiles', 0).setOrigin(0);
        this.tiles[y][x] = this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'tile-.').setOrigin(0);
      }
    }
    this.refresh();
    this.pos = { ...this.hooks.start };
    this.player = this.add.image(this.pos.x * TILE_SIZE, this.pos.y * TILE_SIZE, 'player').setOrigin(0);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE_SIZE, MAP_H * TILE_SIZE);
    cam.setZoom(3);
    cam.startFollow(this.player, true);
    cam.roundPixels = true;

    const keys = this.input.keyboard?.createCursorKeys();
    keys?.left.on('down', () => this.move(-1, 0));
    keys?.right.on('down', () => this.move(1, 0));
    keys?.up.on('down', () => this.move(0, -1));
    keys?.down.on('down', () => this.move(0, 1));
    // 入力欄で矢印キーが効くように、ページ全体の矢印キーを横取りしない
    this.input.keyboard?.disableGlobalCapture();
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wp = cam.getWorldPoint(p.x, p.y);
      this.walkTo(Math.floor(wp.x / TILE_SIZE), Math.floor(wp.y / TILE_SIZE));
    });
  }

  /** 門・扉・旗の見た目を今の状態に合わせる */
  refresh(): void {
    const s = this.hooks.getState();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = tileAt(x, y);
        let key = `tile-${t}`;
        if ((GATES.has(t) || t === 'D') && !isWalkable(x, y, s)) key = `tile-${t}-closed`;
        if (t === 'F' && s.sideIncomeFlag) key = 'tile-F-flag';
        const frameKey = key.replace('tile-', '');
        if (frameKey in TILE_FRAMES) this.tiles[y][x].setTexture('tiles', TILE_FRAMES[frameKey]);
        else this.tiles[y][x].setTexture(key);
      }
    }
  }

  move(dx: number, dy: number): void {
    if (this.hooks.isBlocked()) return;
    this.queue = [];
    this.bumpAfterQueue = null;
    this.step(dx, dy);
  }

  private step(dx: number, dy: number): void {
    if (this.moving) return;
    const nx = this.pos.x + dx, ny = this.pos.y + dy;
    const s = this.hooks.getState();
    if (!isWalkable(nx, ny, s)) {
      const i = interactionAt(nx, ny, s);
      if (i) this.hooks.onInteract(i);
      return;
    }
    this.moving = true;
    this.pos = { x: nx, y: ny };
    this.tweens.add({
      targets: this.player, x: nx * TILE_SIZE, y: ny * TILE_SIZE, duration: 140,
      onComplete: () => {
        this.moving = false;
        this.hooks.onMoved(nx, ny);
        const i = interactionAt(nx, ny, s);
        if (i?.kind === 'chest') this.hooks.onInteract(i);
        this.next();
      },
    });
  }

  private next(): void {
    const n = this.queue.shift();
    if (n) return this.step(n.x - this.pos.x, n.y - this.pos.y);
    if (this.bumpAfterQueue) {
      const b = this.bumpAfterQueue;
      this.bumpAfterQueue = null;
      this.step(b.x - this.pos.x, b.y - this.pos.y);
    }
  }

  /** タップしたマスへ歩く。歩けないマス(建物・人・閉じた門)なら隣まで歩いて体当たりする */
  private walkTo(tx: number, ty: number): void {
    if (this.moving || this.hooks.isBlocked()) return;
    const s = this.hooks.getState();
    if (isWalkable(tx, ty, s)) {
      this.queue = findPath(this.pos, { x: tx, y: ty }, s) ?? [];
      this.bumpAfterQueue = null;
      return this.next();
    }
    if (!interactionAt(tx, ty, s)) return;
    let best: { x: number; y: number }[] | null = null;
    for (const [dx, dy] of DIRS) {
      const nx = tx + dx, ny = ty + dy;
      const path = nx === this.pos.x && ny === this.pos.y ? [] : findPath(this.pos, { x: nx, y: ny }, s);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return;
    this.queue = best;
    this.bumpAfterQueue = { x: tx, y: ty };
    this.next();
  }
}
