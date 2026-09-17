import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { TitleScene } from './game/scenes/TitleScene';
import { RunScene } from './game/scenes/RunScene';
import { ResultScene } from './game/scenes/ResultScene';
import { RecordsScene } from './game/scenes/RecordsScene';
import { DESIGN_H, DESIGN_W, colHex } from './game/tokens';
import { loadProfile } from './game/save';

loadProfile();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: DESIGN_W,
  height: DESIGN_H,
  backgroundColor: colHex('bg.ink'),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, RunScene, ResultScene, RecordsScene],
  input: { keyboard: false }, // 키보드는 input.layer 가 DOM 에서 직접 받는다
});
