import Phaser from 'phaser';
import { WorldScene, type WorldHooks } from './WorldScene';

export type { WorldHooks };

export function createGame(parent: HTMLElement, hooks: WorldHooks) {
  const scene = new WorldScene(hooks);
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b2545',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    scene,
  });
  return {
    refresh: () => { if (scene.sys.isActive()) scene.refresh(); },
    move: (dx: number, dy: number) => { if (scene.sys.isActive()) scene.move(dx, dy); },
  };
}
