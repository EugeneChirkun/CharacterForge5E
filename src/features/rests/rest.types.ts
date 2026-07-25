import type { LandType } from '../characters/character.types';
export type RestType = 'short' | 'long';
export interface RestOptions {
  landType?: LandType;
}
export interface RestPreview {
  title: string;
  items: string[];
}
