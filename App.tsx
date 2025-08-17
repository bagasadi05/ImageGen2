import React, { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { stylePresets, commonKeywords } from './constants';
import type { StylePreset } from './constants';
import { generateImage, generateKeywords, generateEnhancedPrompts } from './services/geminiService';
import type { Prompt, GenerationProgress } from './types';

// --- Zod Schemas for Validation ---
const promptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  negative_prompt: z.string().optional(),
});
const promptsSchema = z.array(promptSchema).min(1, "JSON array cannot be empty.");


// --- Helper Components ---

const Spinner: React.FC<{className?: string}> = ({ className = '!w-6 !h-6 !border-2' }) => (
  <div className={`spinner ${className}`} role="status">
    <span className="sr-only">Loading...</span>
  </div>
);

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);


const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25H9a2.25 2.25 0 0 1-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

interface PromptCardProps {
    promptData: Prompt;
    onGenerate: () => void;
    onUpdatePrompt: (index: number, updatedPrompt: Partial<Prompt>) => void;
    index: number;
}

const PromptCard: React.FC<PromptCardProps> = ({ promptData, onGenerate, onUpdatePrompt, index }) => {
    const [copiedSeed, setCopiedSeed] = useState(false);
    const [copiedMeta, setCopiedMeta] = useState(false);
    const [isMetaVisible, setIsMetaVisible] = useState(false);
    
    useEffect(() => {
        if(promptData.keywords && promptData.keywords.length > 0) {
            setIsMetaVisible(true);
        }
    }, [promptData.keywords]);

    const handleCopySeed = useCallback(() => {
        if (!promptData.seed || promptData.seed === 'N/A') return;
        navigator.clipboard.writeText(promptData.seed).then(() => {
            setCopiedSeed(true);
            setTimeout(() => setCopiedSeed(false), 2000);
        });
    }, [promptData.seed]);
    
    const handleCopyMetadata = useCallback(() => {
        const metadataString = `Title: ${promptData.title || ''}\n\nDescription: ${promptData.description || ''}\n\nKeywords: ${promptData.keywords?.join(', ')}`;
        navigator.clipboard.writeText(metadataString).then(() => {
            setCopiedMeta(true);
            setTimeout(() => setCopiedMeta(false), 2500);
        });
    }, [promptData.title, promptData.description, promptData.keywords]);


    const handleDownload = () => {
        if (!promptData.imageUrl) return;
        const link = document.createElement('a');
        link.href = promptData.imageUrl;
        link.download = `generated-image-${promptData.seed || Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRemoveKeyword = (keywordToRemove: string) => {
        const updatedKeywords = promptData.keywords?.filter(k => k !== keywordToRemove);
        onUpdatePrompt(index, { keywords: updatedKeywords });
    };
    
    const handleAddCommonKeyword = (keywordToAdd: string) => {
        const currentKeywords = promptData.keywords || [];
        if (!currentKeywords.includes(keywordToAdd)) {
            onUpdatePrompt(index, { keywords: [...currentKeywords, keywordToAdd] });
        }
    };

    return (
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/80 shadow-lg hover:border-slate-600 hover:shadow-purple-500/5 transition-all duration-300 flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
                 <p className="text-slate-300 text-sm leading-relaxed flex-1">{promptData.prompt}</p>
                 {!promptData.isGenerating && !promptData.imageUrl && (
                    <button 
                        onClick={onGenerate}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-purple-500/40 whitespace-nowrap">
                        Generate
                    </button>
                 )}
                 {promptData.isGenerating && <Spinner className="!w-7 !h-7 !border-2"/>}
            </div>

            {promptData.error && (
                <div className="text-sm text-red-400 bg-red-900/40 p-3 rounded-lg border border-red-800">
                    <p><b>Error:</b> {promptData.error}</p>
                </div>
            )}
            
            {promptData.imageUrl && (
                <div className="group relative overflow-hidden rounded-lg aspect-square">
                    <img 
                        src={promptData.imageUrl} 
                        alt={`Generated image for prompt: ${promptData.prompt}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                       <div className="w-full flex items-center justify-between text-xs text-slate-300 p-3">
                          <p className="font-mono truncate bg-black/30 px-2 py-1 rounded-md">
                            Seed: <span className="font-semibold text-slate-100">{promptData.seed}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            {promptData.seed !== 'N/A' && (
                                <button 
                                onClick={handleCopySeed} 
                                className="bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2 rounded-full transition-colors"
                                aria-label={copiedSeed ? "Seed copied" : "Copy seed"}
                                >
                                {copiedSeed ? (
                                    <CheckIcon className="w-4 h-4 text-teal-400" /> 
                                ) : (
                                    <ClipboardIcon className="w-4 h-4 text-slate-300" />
                                )}
                                </button>
                            )}
                             <button 
                                onClick={handleDownload} 
                                className="bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2 rounded-full transition-colors"
                                aria-label="Download image"
                                >
                                <DownloadIcon className="w-4 h-4 text-slate-300" />
                            </button>
                          </div>
                       </div>
                    </div>
                </div>
            )}

            {(promptData.isGeneratingKeywords || promptData.keywords) && (
                <div className="border-t border-slate-700 pt-4">
                    <button onClick={() => setIsMetaVisible(!isMetaVisible)} className="w-full flex justify-between items-center text-left">
                        <h3 className="text-sm font-semibold text-teal-400">Stock Photo Metadata</h3>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMetaVisible ? 'rotate-180' : ''}`} />
                    </button>

                    {isMetaVisible && (
                        <div className="mt-4 space-y-4 animate-[fadeIn_0.5s_ease-out]">
                            {promptData.isGeneratingKeywords ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Spinner className="!w-4 !h-4 !border-2" />
                                <span>Generating keywords...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor={`title-${index}`} className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                                        <input 
                                            type="text"
                                            id={`title-${index}`}
                                            value={promptData.title || ''}
                                            onChange={(e) => onUpdatePrompt(index, { title: e.target.value })}
                                            className="w-full bg-slate-700/50 border border-slate-600 text-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`description-${index}`} className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                        <textarea
                                            id={`description-${index}`}
                                            rows={3}
                                            value={promptData.description || ''}
                                            onChange={(e) => onUpdatePrompt(index, { description: e.target.value })}
                                            className="w-full bg-slate-700/50 border border-slate-600 text-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                            placeholder="Factual description of image content, e.g., 'A cute robot made of clay is holding a red skateboard on a white background.'"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Keywords ({promptData.keywords?.length || 0})</label>
                                        <div className="flex flex-wrap gap-2 bg-slate-900/50 border border-slate-700 p-2 rounded-lg max-h-32 overflow-y-auto">
                                            {promptData.keywords?.map((keyword) => (
                                                <span key={keyword} className="flex items-center bg-slate-700 text-slate-300 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full">
                                                    {keyword}
                                                    <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded-full w-4 h-4 flex items-center justify-center transition-colors">&times;</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                     <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Common Keywords</label>
                                        <div className="flex flex-wrap gap-2">
                                            {commonKeywords.map(keyword => (
                                                <button key={keyword} onClick={() => handleAddCommonKeyword(keyword)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full transition-colors">+ {keyword}</button>
                                            ))}
                                        </div>
                                    </div>
                                     <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                        <h4 className="text-xs font-semibold text-slate-300 mb-2">Quality Control Checklist</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                                            <li>Image meets 4MP minimum for stock sites. (Note: Standard generation may be lower).</li>
                                            <li>Image is tagged as "Generative AI" on upload.</li>
                                            <li>Image is free of any logos, text, or trademarks.</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={handleCopyMetadata}
                                        className="w-full flex items-center justify-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-3 rounded-lg transition-colors"
                                    >
                                        {copiedMeta ? (
                                            <>
                                                <CheckIcon className="w-5 h-5 text-teal-400" />
                                                <span className="text-teal-300">Copied to Clipboard!</span>
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardIcon className="w-5 h-5" />
                                                <span>Copy All Metadata</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const [keywords, setKeywords] = useState<string>('');
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [activeTab, setActiveTab] = useState<'generate' | 'custom'>('generate');
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string>('Otomatis');
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState<boolean>(false);
    const generationAbortController = useRef<AbortController | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
        running: false, current: 0, total: 0, batch: 0, totalBatches: 0
    });

    const BATCH_SIZE = 3;

    const handleStartOver = () => {
        setPrompts([]);
        setKeywords('');
        setSelectedStyle('Otomatis');
        setGenerationProgress({ running: false, current: 0, total: 0, batch: 0, totalBatches: 0 });
        if (generationAbortController.current) {
            generationAbortController.current.abort();
            generationAbortController.current = null;
        }
    };

    const handleGeneratePrompts = useCallback(async () => {
        if (!keywords.trim() || isGeneratingPrompts) {
            return;
        }
        
        setIsGeneratingPrompts(true);
        setPrompts([]); // Clear old prompts immediately
        try {
            const generatedPrompts = await generateEnhancedPrompts(keywords, selectedStyle);
            const newPrompts: Prompt[] = generatedPrompts.map(p => ({
                prompt: p,
                negative_prompt: "blurry, low quality, watermark, signature, ugly, deformed, bad anatomy, text, logo, worst quality, lowres",
                title: p,
                description: '',
            }));
            setPrompts(newPrompts);
        } catch (error) {
            console.error("Failed to generate prompts:", error);
            // Optionally, set an error state to show in the UI
        } finally {
            setIsGeneratingPrompts(false);
        }
    }, [keywords, selectedStyle, isGeneratingPrompts]);

    const handleLoadFromJson = useCallback(() => {
        setJsonError(null);
        if (!jsonInput.trim()) {
            setJsonError("JSON input cannot be empty.");
            return;
        }

        try {
            const parsed = JSON.parse(jsonInput);
            const validationResult = promptsSchema.safeParse(parsed);

            if (!validationResult.success) {
                // Format Zod errors into a user-friendly message
                const formattedErrors = validationResult.error.issues.map(err => `[${err.path.join('.')}]: ${err.message}`).join('; ');
                throw new Error(formattedErrors);
            }
            
            const validPrompts: Prompt[] = validationResult.data.map(item => ({
                prompt: item.prompt,
                negative_prompt: item.negative_prompt || "blurry, low quality, watermark, signature, ugly, deformed, bad anatomy, text, logo",
                title: item.prompt,
                description: '',
            }));

            setPrompts(validPrompts);

        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown parsing error occurred.";
            setJsonError(`Invalid JSON: ${message}`);
            setPrompts([]);
        }
    }, [jsonInput]);

    const updatePromptState = useCallback((index: number, updatedPrompt: Partial<Prompt>) => {
        setPrompts(currentPrompts => {
            const newPrompts = [...currentPrompts];
            newPrompts[index] = { ...newPrompts[index], ...updatedPrompt };
            return newPrompts;
        });
    }, []);
    
    const handleGenerateSingleImage = useCallback(async (index: number, signal?: AbortSignal) => {
        if (signal?.aborted) return;
        updatePromptState(index, { isGenerating: true, error: undefined, imageUrl: undefined, seed: undefined, keywords: undefined });
    
        try {
            const result = await generateImage(prompts[index].prompt, '1:1', signal);
            if (signal?.aborted) return;
            updatePromptState(index, { ...result, isGenerating: false, isGeneratingKeywords: true });
    
            // Now generate keywords
            try {
                const keywords = await generateKeywords(prompts[index].prompt);
                 if (signal?.aborted) return;
                updatePromptState(index, { keywords, isGeneratingKeywords: false });
            } catch (keywordError) {
                console.error("Keyword generation failed:", keywordError);
                updatePromptState(index, { isGeneratingKeywords: false, error: "Image generated, but keyword generation failed." });
            }
    
        } catch (error) {
            if (signal?.aborted) {
                 updatePromptState(index, { isGenerating: false, error: "Generation cancelled." });
                 return;
            }
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            updatePromptState(index, { isGenerating: false, error: errorMessage });
        }
    }, [prompts, updatePromptState]);
    

    const handleGenerateAllImages = useCallback(async () => {
        generationAbortController.current = new AbortController();
        const signal = generationAbortController.current.signal;
        const totalImages = prompts.length;
        const totalBatches = Math.ceil(totalImages / BATCH_SIZE);

        setGenerationProgress({ running: true, current: 0, total: totalImages, batch: 1, totalBatches });

        for (let i = 0; i < totalImages; i += BATCH_SIZE) {
            if (signal.aborted) {
                console.log("Batch generation cancelled.");
                break;
            }
            
            const currentBatchNumber = (i / BATCH_SIZE) + 1;
            setGenerationProgress(p => ({ ...p, batch: currentBatchNumber }));

            const batch = prompts.slice(i, i + BATCH_SIZE);
            const promises = batch.map((_, j) => 
                handleGenerateSingleImage(i + j, signal).then(() => {
                    if (!signal.aborted) {
                        setGenerationProgress(p => ({...p, current: p.current + 1}));
                    }
                })
            );
            await Promise.all(promises);
        }

        setGenerationProgress({ running: false, current: 0, total: 0, batch: 0, totalBatches: 0 });

    }, [prompts, handleGenerateSingleImage]);
    
    const handleCancelGeneration = () => {
        if (generationAbortController.current) {
            generationAbortController.current.abort();
        }
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleGeneratePrompts();
        }
    };
    
    const handleStyleSelect = (style: StylePreset) => {
        setSelectedStyle(style.name);
        const currentKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
        const newKeywordsSet = new Set([...currentKeywords, ...style.keywords]);
        setKeywords(Array.from(newKeywordsSet).join(', '));
    };

    // --- Render Logic for Action Button Area ---
    const renderActionArea = () => {
        if (generationProgress.running) {
            const percentage = Math.round((generationProgress.current / generationProgress.total) * 100);
            return (
                <div className="flex items-center gap-4 w-full">
                    <div className="w-full bg-slate-700 rounded-full h-10 shadow-inner overflow-hidden relative flex items-center justify-center">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        ></div>
                        <span className="relative text-white font-semibold text-sm z-10">
                            Generating... (Batch {generationProgress.batch}/{generationProgress.totalBatches}) - {generationProgress.current}/{generationProgress.total} Complete
                        </span>
                    </div>
                    <button
                        onClick={handleCancelGeneration}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors whitespace-nowrap"
                    >
                        Cancel
                    </button>
                </div>
            );
        }
        
        if (prompts.length > 0) {
             return (
                 <button 
                    onClick={handleGenerateAllImages}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-500/50 shadow-lg hover:shadow-cyan-500/30">
                    Generate All Images (Batch)
                 </button>
            );
        }
        
        return (
             <button 
                onClick={handleGeneratePrompts}
                disabled={isGeneratingPrompts}
                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingPrompts ? (
                    <>
                        <Spinner className="!w-5 !h-5 !border-2 mr-2" />
                        Generating Prompts...
                    </>
                ) : (
                   'Generate 10 Prompts'
                )}
            </button>
        );
    }

    return (
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl shadow-black/30 w-full max-w-5xl">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mb-8">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                   <PaintBrushIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                        AI Asset Factory
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">
                        Generate prompts, create images, and prepare metadata for publication.
                    </p>
                </div>
            </div>

            <div className="bg-slate-800/60 p-1.5 rounded-xl flex space-x-2 mb-6">
                <button 
                    onClick={() => setActiveTab('generate')} 
                    className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${activeTab === 'generate' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
                    aria-current={activeTab === 'generate' ? 'page' : undefined}
                >
                    Generate Prompts
                </button>
                <button 
                    onClick={() => setActiveTab('custom')} 
                    className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${activeTab === 'custom' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
                    aria-current={activeTab === 'custom' ? 'page' : undefined}
                >
                    Use Custom JSON
                </button>
            </div>

            {activeTab === 'generate' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="keywords" className="block text-sm font-medium text-slate-300 mb-2">
                                Enter Keywords
                            </label>
                            <input 
                                type="text" 
                                id="keywords" 
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                onKeyUp={handleKeyPress}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                                placeholder="e.g., fantasy dragon, castle"
                                disabled={isGeneratingPrompts || prompts.length > 0 || generationProgress.running}
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="block text-sm font-medium text-slate-300">
                                Select a Style Preset
                            </label>
                            <div className="flex flex-wrap gap-2">
                                 <button onClick={() => setSelectedStyle('Otomatis')} disabled={isGeneratingPrompts || prompts.length > 0 || generationProgress.running} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${selectedStyle === 'Otomatis' ? 'bg-purple-600 text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-purple-500' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                                    Otomatis
                                </button>
                                {stylePresets.map(preset => (
                                    <button 
                                        key={preset.name} 
                                        onClick={() => handleStyleSelect(preset)} 
                                        disabled={isGeneratingPrompts || prompts.length > 0 || generationProgress.running}
                                        className={`px-3 py-1.5 text-xs font-semibold text-white rounded-full transition-all duration-200 ${preset.color} ${selectedStyle === preset.name ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : 'opacity-80 hover:opacity-100'}`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {renderActionArea()}
                </div>
            )}

            {activeTab === 'custom' && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="json-input" className="block text-sm font-medium text-slate-300 mb-2">
                            Paste your prompt JSON here
                        </label>
                        <textarea
                            id="json-input"
                            rows={8}
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder={`[
  {
    "prompt": "a majestic lion in the savannah, cinematic lighting",
    "negative_prompt": "cartoon, blurry"
  },
  {
    "prompt": "a futuristic city skyline at night, cyberpunk style"
  }
]`}
                        />
                    </div>
                    {jsonError && (
                        <p className="text-red-400 text-sm bg-red-900/40 p-3 rounded-lg border border-red-800">{jsonError}</p>
                    )}
                    <button
                        onClick={handleLoadFromJson}
                         className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg hover:shadow-purple-500/30">
                        Load Prompts from JSON
                    </button>
                </div>
            )}


            {prompts.length > 0 && (
                <div className="mt-8">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Generated Prompts ({prompts.filter(p=>p.imageUrl).length}/{prompts.length})</h2>
                        <button
                         onClick={handleStartOver}
                         className="text-sm text-slate-400 hover:text-white hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors"
                        >
                            Start Over
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {prompts.map((prompt, index) => (
                           <PromptCard 
                                key={index}
                                index={index} 
                                promptData={prompt}
                                onGenerate={() => handleGenerateSingleImage(index, generationAbortController.current?.signal)}
                                onUpdatePrompt={updatePromptState}
                            />
                       ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
