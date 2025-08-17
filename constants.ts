export interface StylePreset {
  name: string;
  keywords: string[];
  color: string; // Tailwind color class e.g., 'bg-sky-500 hover:bg-sky-400'
}

export const stylePresets: StylePreset[] = [
  { 
    name: 'Claymation', 
    keywords: ['claymation style', '3d render', 'soft studio lighting', 'cute', 'miniature'], 
    color: 'bg-orange-500 hover:bg-orange-400' 
  },
  { 
    name: 'Paper Cutout', 
    keywords: ['paper cutout style', 'layered paper', 'diorama', '2d vector', 'flat design'], 
    color: 'bg-rose-500 hover:bg-rose-400' 
  },
  { 
    name: 'Isometric 3D', 
    keywords: ['isometric 3d', 'low poly', 'blender render', 'simplified', 'clean design'], 
    color: 'bg-teal-500 hover:bg-teal-400' 
  },
  { 
    name: 'Gradient Art', 
    keywords: ['vibrant gradient', 'abstract shape', 'grainy texture', 'modern art', 'minimalist'], 
    color: 'bg-purple-500 hover:bg-purple-400' 
  },
   { 
    name: 'Photorealistic', 
    keywords: ['photorealistic', 'hyperdetailed', '8k', 'cinematic lighting', 'sharp focus'], 
    color: 'bg-blue-500 hover:bg-blue-400' 
  },
  { 
    name: 'Anime', 
    keywords: ['anime style', 'studio ghibli inspired', 'cel shaded', 'vibrant colors', 'detailed background'], 
    color: 'bg-red-500 hover:bg-red-400' 
  },
];


export const commonKeywords: string[] = [
    'ai generated',
    'concept',
    'abstract',
    'isolated',
    'background',
    'business',
    'technology',
    'illustration',
    '3d render',
    'vibrant color',
    'minimalist',
    'copy space'
];
