import React, { useState, useCallback, useRef, useEffect } from 'react';
import { artStyles } from './constants';
import { generateImage, generateKeywords, generateEnhancedPrompts } from './services/geminiService';
import type { Prompt } from './types';

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
    const [title, setTitle] = useState(promptData.prompt);
    const [isMetaVisible, setIsMetaVisible] = useState(false);

    useEffect(() => {
        setTitle(promptData.prompt);
    }, [promptData.prompt]);
    
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
        const metadataString = `Title: ${title}\n\nKeywords: ${promptData.keywords?.join(', ')}`;
        navigator.clipboard.writeText(metadataString).then(() => {
            setCopiedMeta(true);
            setTimeout(() => setCopiedMeta(false), 2500);
        });
    }, [title, promptData.keywords]);


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
                        <h3 className="text-sm font-semibold text-teal-400">Metadata for Publication</h3>
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
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor={`title-${index}`} className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                                        <input 
                                            type="text"
                                            id={`title-${index}`}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-slate-700/50 border border-slate-600 text-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                                                <span>Copy Title & Keywords</span>
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

            if (!Array.isArray(parsed)) {
                throw new Error("The root of the JSON must be an array.");
            }

            const validPrompts: Prompt[] = parsed.map((item: any, index: number) => {
                if (typeof item !== 'object' || item === null || typeof item.prompt !== 'string') {
                    throw new Error(`Item at index ${index} is invalid. Each item must be an object with a "prompt" property.`);
                }
                return {
                    prompt: item.prompt,
                    negative_prompt: typeof item.negative_prompt === 'string' ? item.negative_prompt : "blurry, low quality, watermark, signature, ugly, deformed, bad anatomy, text, logo",
                };
            });

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

    const handleGenerateSingleImage = useCallback(async (index: number) => {
        updatePromptState(index, { isGenerating: true, error: undefined, imageUrl: undefined, seed: undefined, keywords: undefined });
    
        try {
            const result = await generateImage(prompts[index].prompt);
            updatePromptState(index, { ...result, isGenerating: false, isGeneratingKeywords: true });
    
            // Now generate keywords
            try {
                const keywords = await generateKeywords(prompts[index].prompt);
                updatePromptState(index, { keywords, isGeneratingKeywords: false });
            } catch (keywordError) {
                console.error("Keyword generation failed:", keywordError);
                updatePromptState(index, { isGeneratingKeywords: false, error: "Image generated, but keyword generation failed." });
            }
    
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            updatePromptState(index, { isGenerating: false, error: errorMessage });
        }
    }, [prompts, updatePromptState]);
    

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleGeneratePrompts();
        }
    };

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
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="keywords" className="block text-sm font-medium text-slate-300 mb-2">
                                Enter Keywords (comma-separated)
                            </label>
                            <input 
                                type="text" 
                                id="keywords" 
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                onKeyUp={handleKeyPress}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors" 
                                placeholder="e.g., fantasy dragon, castle"
                            />
                        </div>
                        <div>
                            <label htmlFor="art-style" className="block text-sm font-medium text-slate-300 mb-2">
                                Pilih Gaya Gambar
                            </label>
                            <select 
                                id="art-style"
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1.5em 1.5em',
                                    paddingRight: '2.5rem',
                                }}
                            >
                                <option>Otomatis</option>
                                {artStyles.map(style => <option key={style} value={style}>{style}</option>)}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={handleGeneratePrompts}
                        disabled={isGeneratingPrompts}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-500/50 shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGeneratingPrompts ? (
                            <>
                                <Spinner className="!w-5 !h-5 !border-2 mr-2" />
                                Generating...
                            </>
                        ) : (
                           'Generate 10 Prompts'
                        )}
                    </button>
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
                    <h2 className="text-lg font-semibold mb-4 text-slate-200">Generated Prompts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {prompts.map((prompt, index) => (
                           <PromptCard 
                                key={index}
                                index={index} 
                                promptData={prompt}
                                onGenerate={() => handleGenerateSingleImage(index)}
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
