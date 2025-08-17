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
}

export interface GeneratedImageData {
  imageUrl: string;
  seed: string;
  prompt: string;
}