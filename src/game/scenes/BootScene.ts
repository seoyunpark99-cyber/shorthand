import Phaser from 'phaser';
import { generatePlaceholders, queueManifest, type Manifest } from '../assets';
import { FONT_MONO, FONT_UI, SZ_UI, t, uiStyle } from '../tokens';

export class BootScene extends Phaser.Scene {
  private manifest: Manifest | null = null;
  constructor() {
    super('boot');
  }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
    this.load.once('filecomplete-json-manifest', () => {
      this.manifest = this.cache.json.get('manifest') as Manifest;
      queueManifest(this, this.manifest);
    });
    this.load.on('loaderror', () => {
      /* manifest 없으면 placeholder */
    });
  }

  async create() {
    const txt = this.add.text(640, 360, t('title.name'), uiStyle(SZ_UI.title)).setOrigin(0.5);
    // 글꼴 로드 완료 후 씬 시작 (dev.fonts)
    try {
      if (document.fonts) {
        await Promise.race([
          Promise.all([document.fonts.load(`28px ${FONT_MONO}`), document.fonts.load(`18px ${FONT_UI}`), document.fonts.load(`600 18px ${FONT_UI}`)]),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      }
    } catch {
      /* 시스템 글꼴 대체 */
    }
    generatePlaceholders(this);
    txt.destroy();
    this.scene.start('title');
  }
}
