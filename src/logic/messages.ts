import type { CompassResult } from './compass';
import type { StatusResult } from './status';

export function bandMessage(status: StatusResult | null, compass: CompassResult | null): string {
  if (!status) return '宿屋で冒険の書を作ろう';
  if (!status.ok) return '宿屋で毎月の生活費を入れてください';
  if (status.hp < status.maxHp) return 'まずは宿屋で体力(現金)を整えよう';
  if (compass?.pace === 'behind') return '霧が出ている。羅針盤を開いて、最初の誓いを思い出そう';
  if (compass && !compass.fit.ok) return '装備が職業らしさから離れている。装備屋で眺めてみよう';
  if (compass?.pace === 'ahead') return '予定より先を歩いている。この調子で一歩ずつ';
  return '今は大丈夫。一歩ずつ進もう';
}
