
export enum ExamType {
  UPSC = 'UPSC',
  SSC = 'SSC',
  DELHI_POLICE = 'Delhi Police',
  STATE_POLICE = 'State Police',
  IBPS = 'IBPS',
  SBI = 'SBI',
  RRB = 'RRB',
  STATE_PCS = 'State PCS',
  TEACHING = 'Teaching',
  DEFENCE = 'Defence',
  RAILWAY = 'Railway',
  CUSTOM = 'Custom'
}

export enum Language {
  EN = 'English',
  HI = 'हिन्दी',
  BN = 'বাংলা',
  MR = 'मराठी',
  TE = 'తెలుగు',
  TA = 'தமிழ்'
}

export enum Theme {
  MIDNIGHT = 'Midnight',
  VIBRANT = 'Neon',
  DAYLIGHT = 'Daylight'
}

export interface DimensionRequirement {
  width: number;
  height: number;
  flexible?: boolean;
}

export interface SizeRequirement {
  minKB: number;
  maxKB: number;
}

export interface ExamRequirement {
  id: ExamType;
  photo: {
    size: SizeRequirement;
    dimensions: DimensionRequirement;
  };
  signature: {
    size: SizeRequirement;
    dimensions: DimensionRequirement;
  };
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
  rotate: number; // 0, 90, 180, 270
  fineRotate: number; // -45 to 45 degrees
  brightness: number; // 0 to 200 (100 is normal)
  contrast: number; // 0 to 200 (100 is normal)
}

export interface ImageFile {
  file: File;
  preview: string;
  type: 'photo' | 'signature';
  transform?: ImageTransform;
  processed?: Blob;
  processedPreview?: string;
  processedSizeKB?: number;
  processedDimensions?: { width: number; height: number };
  aiFeedback?: string;
  isAiValid?: boolean;
}
