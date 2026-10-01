import Phaser from 'phaser';

const T = 16;
type Draw = (g: Phaser.GameObjects.Graphics) => void;

const grass: Draw = (g) => { g.fillStyle(0x4c9a2a).fillRect(0, 0, T, T); g.fillStyle(0x5fb336).fillRect(3, 4, 2, 2).fillRect(11, 10, 2, 2); };
const water = (c = 0x2b6cb0): Draw => (g) => { g.fillStyle(c).fillRect(0, 0, T, T); g.fillStyle(0x90cdf4).fillRect(2, 5, 5, 1).fillRect(9, 11, 5, 1); };
const road: Draw = (g) => { g.fillStyle(0xd6bc8a).fillRect(0, 0, T, T); };
const island: Draw = (g) => { water()(g); g.fillStyle(0xf6e05e).fillCircle(8, 8, 6); };

const TILES: Record<string, Draw> = {
  '.': grass, '@': grass, '=': road,
  T: (g) => { grass(g); g.fillStyle(0x1f5e1a).fillCircle(8, 7, 6); g.fillStyle(0x6b3e1e).fillRect(7, 12, 2, 4); },
  '~': water(), L: water(0x3182ce),
  '^': (g) => { g.fillStyle(0x8b6b4a).fillTriangle(1, 15, 8, 1, 15, 15); g.fillStyle(0xffffff).fillTriangle(6, 5, 8, 1, 10, 5); },
  '#': (g) => { g.fillStyle(0x7a7a7a).fillRect(0, 0, T, T); g.lineStyle(1, 0x555555).strokeRect(0, 0, 8, 8).strokeRect(8, 8, 8, 8); },
  K: (g) => { g.fillStyle(0x8b6b4a).fillRect(0, 0, T, T); g.fillStyle(0xe2e8f0).fillRect(3, 5, 10, 10); g.fillStyle(0xc9a227).fillTriangle(3, 5, 8, 0, 13, 5); },
  '%': island,
  F: island,
  'F-flag': (g) => { island(g); g.fillStyle(0x333333).fillRect(7, 2, 1, 10); g.fillStyle(0xe53e3e).fillRect(8, 2, 5, 4); },
  B: (g) => { water()(g); g.fillStyle(0x8b5a2b).fillRect(0, 3, T, 10); g.lineStyle(1, 0x5a3a1a).lineBetween(4, 3, 4, 13).lineBetween(10, 3, 10, 13); },
  'B-closed': water(),
  G: road,
  'G-closed': (g) => { road(g); g.fillStyle(0x6b3e1e).fillRect(0, 4, T, 3).fillRect(0, 10, T, 3); g.fillStyle(0xc9a227).fillRect(6, 6, 4, 4); },
  P: road,
  'P-closed': (g) => { g.fillStyle(0x6b6b6b).fillCircle(5, 9, 5).fillCircle(11, 8, 5); },
  I: (g) => { grass(g); g.fillStyle(0xfdfbf6).fillRect(2, 7, 12, 9); g.fillStyle(0xc53030).fillTriangle(0, 8, 8, 1, 16, 8); g.fillStyle(0x6b3e1e).fillRect(7, 11, 3, 5); },
  S: (g) => { grass(g); g.fillStyle(0xfdfbf6).fillRect(2, 7, 12, 9); g.fillStyle(0x2b6cb0).fillTriangle(0, 8, 8, 1, 16, 8); g.fillStyle(0xc9a227).fillRect(6, 10, 4, 4); },
  C: (g) => { g.fillStyle(0x8b6b4a).fillRect(0, 0, T, T); g.fillStyle(0x111111).fillEllipse(8, 11, 10, 10); },
  N: (g) => { g.fillStyle(0xf6ad55).fillCircle(8, 5, 3); g.fillStyle(0x805ad5).fillRect(5, 8, 6, 7); },
  D: (g) => { road(g); g.fillStyle(0xc9a227).fillRect(3, 6, 10, 8); g.fillStyle(0x6b3e1e).fillRect(3, 9, 10, 1); },
  'D-closed': (g) => { g.fillStyle(0x7a7a7a).fillRect(0, 0, T, T); g.fillStyle(0x6b3e1e).fillRect(3, 2, 10, 14); g.fillStyle(0xc9a227).fillCircle(11, 9, 1); },
  player: (g) => { g.fillStyle(0xf6ad55).fillCircle(8, 5, 4); g.fillStyle(0x2c5282).fillRect(4, 9, 8, 7); g.fillStyle(0xc9a227).fillRect(3, 9, 2, 5); },
};

export function createTileTextures(scene: Phaser.Scene): void {
  for (const [key, draw] of Object.entries(TILES)) {
    const name = key === 'player' ? 'player' : `tile-${key}`;
    if (scene.textures.exists(name)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(name, T, T);
    g.destroy();
  }
}

export const TILE_SIZE = T;

/**
 * スプライトシート assets/tiles.png(Kenney「Tiny Town」tilemap_packed.png、CC0)のフレーム番号。
 * ここにないキー(水・山・人・橋など、Tiny Town にない絵)は手続き生成の絵を使う。
 */
export const TILE_FRAMES: Record<string, number> = {
  '.': 0, '@': 0, '=': 25, T: 16, '#': 126,
  I: 67, S: 63, C: 113,
  'D-closed': 86, 'G-closed': 45, G: 25, P: 25,
};
