import { AssetKeys } from './assetKeys.js';

export const CAMPAIGN_CHAPTER_TITLES = [
  'Начало пути',
  'Опасные воды',
  'Тени прошлого',
  'Огненный архипелаг',
  'Карта Сокровищ'
];

export const CAMPAIGN_ISLAND_FILES = {
  trainingBay: '01_island_training_bay.png',
  tropicalSmall: '02_island_tropical_small.png',
  tropicalLarge: '03_island_tropical_large.png',
  reef: '04_island_reef.png',
  port: '05_island_port.png',
  fort: '06_island_fort.png',
  fog: '07_island_fog.png',
  shipwreck: '08_island_shipwreck.png',
  skull: '09_island_skull.png',
  volcano: '10_island_volcano.png',
  crystal: '11_island_crystal.png',
  citadel: '12_island_citadel.png',
  bossFortress: '13_island_boss_fortress.png'
};

export const CAMPAIGN_ISLAND_KEYS = {
  trainingBay: AssetKeys.CampaignIslands.TrainingBay,
  tropicalSmall: AssetKeys.CampaignIslands.TropicalSmall,
  tropicalLarge: AssetKeys.CampaignIslands.TropicalLarge,
  reef: AssetKeys.CampaignIslands.Reef,
  port: AssetKeys.CampaignIslands.Port,
  fort: AssetKeys.CampaignIslands.Fort,
  fog: AssetKeys.CampaignIslands.Fog,
  shipwreck: AssetKeys.CampaignIslands.Shipwreck,
  skull: AssetKeys.CampaignIslands.Skull,
  volcano: AssetKeys.CampaignIslands.Volcano,
  crystal: AssetKeys.CampaignIslands.Crystal,
  citadel: AssetKeys.CampaignIslands.Citadel,
  bossFortress: AssetKeys.CampaignIslands.BossFortress
};

export const CHAPTER_ISLANDS = [
  ['trainingBay', 'tropicalSmall', 'reef', 'port', 'fort'],
  ['tropicalSmall', 'tropicalLarge', 'reef', 'shipwreck', 'fort'],
  ['fog', 'shipwreck', 'skull', 'crystal', 'citadel'],
  ['volcano', 'fort', 'crystal', 'skull', 'bossFortress'],
  ['citadel', 'skull', 'crystal', 'volcano', 'bossFortress']
];

export const CAMPAIGN_NODE_POSITIONS = [
  { x: 152, y: 286, scale: 0.94, labelY: 66, curve: 18 },
  { x: 292, y: 386, scale: 0.86, labelY: 62, curve: -24 },
  { x: 432, y: 286, scale: 0.94, labelY: 66, curve: 24 },
  { x: 570, y: 410, scale: 0.86, labelY: 62, curve: -22 },
  { x: 710, y: 292, scale: 0.94, labelY: 66, curve: 26 },
  { x: 846, y: 414, scale: 0.86, labelY: 62, curve: -18 },
  { x: 986, y: 292, scale: 0.94, labelY: 66, curve: 22 },
  { x: 1112, y: 404, scale: 0.82, labelY: 60, curve: -24 },
  { x: 940, y: 508, scale: 0.86, labelY: 58, curve: 20 },
  { x: 704, y: 502, scale: 0.94, labelY: 60, curve: -18 }
];

export const STAR_REWARD_THRESHOLDS = [
  { stars: 10, chestKey: AssetKeys.StyleChests.DailyClosed, label: '10' },
  { stars: 20, chestKey: AssetKeys.StyleChests.EpicClosed, label: '20' },
  { stars: 30, chestKey: AssetKeys.StyleChests.NavalClosed, label: '30' },
  { stars: 40, chestKey: AssetKeys.StyleChests.DailyClosed, label: '40' },
  { stars: 50, chestKey: AssetKeys.StyleChests.EpicClosed, label: '50' }
];

export function getIslandKey(chapterIndex, levelInChapter) {
  const islands = CHAPTER_ISLANDS[chapterIndex] ?? CHAPTER_ISLANDS[0];
  const islandId = islands[levelInChapter % islands.length];
  if (levelInChapter === 9) {
    return CAMPAIGN_ISLAND_KEYS.bossFortress;
  }
  return CAMPAIGN_ISLAND_KEYS[islandId] ?? CAMPAIGN_ISLAND_KEYS.tropicalSmall;
}
