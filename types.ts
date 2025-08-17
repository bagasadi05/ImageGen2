export interface Prompt {
  prompt: string;
  negative_prompt: string;
  // New state properties for individual card management
  isGenerating?: boolean;
  imageUrl?: string;
  seed?: string;
  error?: string;
  // Metadata generation state
  isGeneratingKeywords?: boolean;
  keywords?: string[];
  // Editable metadata fields for stock photo submission
  title?: string;
  description?: string;
}

export interface GeneratedImageData {
  imageUrl: string;
  seed: string;
  prompt: string;
}

export interface GenerationProgress {
  running: boolean;
  current: number;
  total: number;
  batch: number;
  totalBatches: number;
}
