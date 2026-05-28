import Phaser from 'phaser';
import './styles.css';
import { gameConfig } from './config/gameConfig.js';

window.addEventListener('load', () => {
  const game = new Phaser.Game(gameConfig);

  if (import.meta.env.DEV) {
    window.__PIRATE_GAME__ = game;
    window.addEventListener('pirate:qa:start-scene', (event) => {
      const { scene, data = {} } = event.detail ?? {};
      if (scene) {
        game.scene.start(scene, data);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const qaScene = params.get('qaScene');
    if (qaScene) {
      window.setTimeout(() => {
        game.scene.start(qaScene, {
          from: 'MenuScene',
          levelId: Number(params.get('levelId') ?? 1),
          victory: params.get('victory') !== '0',
          rewardGold: Number(params.get('rewardGold') ?? 120),
          rewardXp: Number(params.get('rewardXp') ?? 70),
          chestGold: Number(params.get('chestGold') ?? 60),
          battleGold: Number(params.get('battleGold') ?? 0)
        });
      }, 900);
    }
  }
});
