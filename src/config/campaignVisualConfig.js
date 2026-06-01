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
  { x: 170, y: 312, scale: 0.82, labelY: 74 },
  { x: 300, y: 418, scale: 0.78, labelY: 70 },
  { x: 442, y: 326, scale: 0.82, labelY: 74 },
  { x: 586, y: 456, scale: 0.78, labelY: 70 },
  { x: 728, y: 318, scale: 0.82, labelY: 74 },
  { x: 866, y: 430, scale: 0.78, labelY: 70 },
  { x: 1010, y: 318, scale: 0.82, labelY: 74 },
  { x: 1110, y: 468, scale: 0.72, labelY: 68 },
  { x: 946, y: 548, scale: 0.76, labelY: 68 },
  { x: 704, y: 552, scale: 0.82, labelY: 74 }
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
