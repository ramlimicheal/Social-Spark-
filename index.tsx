
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Brief, ClientProfile, CopyVariant, CampaignIdea, QueueItem, Creative, Platform, platformRatios, Quality, StylePreset, GenerationStatus } from './types';
import * as geminiService from './services/geminiService';
import { CreativeBoard } from './CreativeBoard';

declare const JSZip: any;

const initialBrief: Brief = {
  brandName: '',
  productDetails: '',
  campaignGoal: '',
  coreMessage: '',
  targetAudience: '',
  brandVoice: '',
  emotionalAppeal: '',
};

const Header: React.FC<{ onSave: () => void; onLoad: () => void; onClear: () => void }> = ({ onSave, onLoad, onClear }) => (
    <header className="text-center mb-8 animate-slide-in">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight gradient-text mb-3">SocialSpark Pro</h1>
        <p className="text-zinc-400 text-lg mb-6">AI-Powered Creative Studio • Black Edition V11</p>
        <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={onSave} className="btn-secondary px-4 py-2 rounded-lg font-medium text-sm transition-all">💾 Save Profile</button>
            <button onClick={onLoad} className="btn-secondary px-4 py-2 rounded-lg font-medium text-sm transition-all">📂 Load Profile</button>
            <button onClick={onClear} className="px-4 py-2 rounded-lg font-medium text-sm transition-all bg-red-950 text-red-400 border border-red-900 hover:bg-red-900">🗑️ Clear All</button>
        </div>
    </header>
);

const BriefForm: React.FC<{ brief: Brief; setBrief: (b: Brief) => void; onAutoFill: () => void; isAutoFilling: boolean }> = ({ brief, setBrief, onAutoFill, isAutoFilling }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setBrief({ ...brief, [e.target.id]: e.target.value });
    };

    return (
        <section className="glass-card p-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-6"><span className="badge badge-green">Step 1</span><h2 className="text-xl font-bold">Campaign Brief</h2></div>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-2 text-zinc-300">Brand Name *</label><input type="text" id="brandName" value={brief.brandName} onChange={handleChange} placeholder="Enter brand name..." className="w-full" /></div>
                <div><label className="block text-sm font-medium mb-2 text-zinc-300">Product/Service Details *</label><textarea id="productDetails" value={brief.productDetails} onChange={handleChange} rows={3} placeholder="Describe the product or service..." className="w-full resize-none"></textarea></div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Campaign Objective *</label><textarea id="campaignGoal" value={brief.campaignGoal} onChange={handleChange} rows={3} placeholder="What's your goal?" className="w-full resize-none"></textarea>
                    <button onClick={onAutoFill} disabled={isAutoFilling || !brief.brandName || !brief.campaignGoal} className="mt-2 btn-secondary w-full px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isAutoFilling && <div className="small-loader"></div>}<span>🤖 Auto-fill Brief Details</span>
                    </button>
                </div>
                <div><label className="block text-sm font-medium mb-2 text-zinc-300">Core Message *</label><textarea id="coreMessage" value={brief.coreMessage} onChange={handleChange} rows={3} placeholder="Main message or value proposition..." className="w-full resize-none"></textarea></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-2 text-zinc-300">Target Audience</label><input type="text" id="targetAudience" value={brief.targetAudience} onChange={handleChange} placeholder="e.g., Gen-Z, Professionals" className="w-full" /></div>
                    <div><label className="block text-sm font-medium mb-2 text-zinc-300">Brand Voice</label><input type="text" id="brandVoice" value={brief.brandVoice} onChange={handleChange} placeholder="e.g., Bold, Playful" className="w-full" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2 text-zinc-300">Emotional Appeal</label><input type="text" id="emotionalAppeal" value={brief.emotionalAppeal} onChange={handleChange} placeholder="e.g., FOMO, Trust, Joy" className="w-full" /></div>
            </div>
        </section>
    );
};

const VisualsForm: React.FC<{
    onFileChange: (file: File | null) => void;
    conceptFile: File | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    palette: string[];
    onAddColor: (color: string) => void;
    onRemoveColor: (index: number) => void;
}> = ({ onFileChange, conceptFile, isAnalyzing, onAnalyze, palette, onAddColor, onRemoveColor }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [color, setColor] = useState('#22c55e');

    useEffect(() => {
        if (!conceptFile) {
            setPreview(null);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(conceptFile);
    }, [conceptFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        onFileChange(file || null);
    };

    const handleAddColor = () => onAddColor(color);

    return (
        <section className="glass-card p-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-6"><span className="badge badge-green">Step 2</span><h2 className="text-xl font-bold">Visual Reference</h2></div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Primary Concept Image</label>
                    <label htmlFor="conceptFileInput" className="cursor-pointer group flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-zinc-800 hover:border-green-500 transition-all">
                        {preview ? <img src={preview} alt="Preview" className="max-h-full max-w-full rounded-lg" /> :
                            <div className="text-center">
                                <svg className="h-12 w-12 mx-auto text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-zinc-400 font-medium">Upload Concept Image</span><p className="text-xs text-zinc-600 mt-1">PNG, JPG up to 10MB</p>
                            </div>
                        }
                    </label>
                    <input type="file" id="conceptFileInput" accept="image/*" onChange={handleFileChange} className="hidden" />
                    {conceptFile && <button onClick={onAnalyze} disabled={isAnalyzing} className="mt-3 btn-primary w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isAnalyzing && <div className="small-loader"></div>}<span>🔍 Analyze Layout & Style</span>
                    </button>}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Brand Palette</label>
                    <div className="p-4 rounded-lg border-2 border-dashed border-zinc-800 hover:border-green-500 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                            <input type="text" value={color} onChange={e => setColor(e.target.value)} className="flex-grow" placeholder="#HEX" />
                            <button onClick={handleAddColor} className="btn-secondary px-4 py-2 rounded-lg font-medium text-sm">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-black/30 rounded-lg">
                            {palette.length === 0 ? <p className="text-xs text-zinc-600 self-center">Add brand colors</p> :
                                palette.map((c, i) => (
                                    <div key={`${c}-${i}`} className="color-swatch" style={{ backgroundColor: c }}>
                                        <button onClick={() => onRemoveColor(i)} className="delete-btn">×</button>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


const AIGeneration: React.FC<{
  onGenerateCopy: () => void; isGeneratingCopy: boolean; copyVariants: CopyVariant[];
  selectedCopy: CopyVariant | null; onSelectCopy: (c: CopyVariant) => void;
  onGenerateIdeas: () => void; isGeneratingIdeas: boolean; campaignIdeas: CampaignIdea[];
  selectedIdea: CampaignIdea | null; onSelectIdea: (i: CampaignIdea) => void;
  isBriefComplete: boolean;
}> = ({
  onGenerateCopy, isGeneratingCopy, copyVariants, selectedCopy, onSelectCopy,
  onGenerateIdeas, isGeneratingIdeas, campaignIdeas, selectedIdea, onSelectIdea,
  isBriefComplete
}) => (
    <section className="glass-card p-6 animate-slide-in">
        <div className="flex items-center gap-3 mb-6"><span className="badge badge-green">Step 3</span><h2 className="text-xl font-bold">AI Generation</h2></div>
        <div className="space-y-4">
            <button onClick={onGenerateCopy} disabled={!isBriefComplete || isGeneratingCopy} className="btn-secondary w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingCopy && <div className="small-loader"></div>}<span>✨ Generate Copy Variants</span>
            </button>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {isGeneratingCopy && <div className="flex justify-center p-4"><div className="small-loader"></div></div>}
                {copyVariants.map(variant => (
                    <div key={variant.index} onClick={() => onSelectCopy(variant)} className={`copy-variant ${selectedCopy?.index === variant.index ? 'selected' : ''}`}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold text-sm">{variant.index}</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm mb-2 text-green-400">{variant.angle}</h3>
                                <div className="space-y-2 text-xs text-zinc-300">
                                    <div><strong>Headline:</strong> {variant.headline}</div>
                                    {variant.body && <div><strong>Body:</strong> {variant.body}</div>}
                                    {variant.cta && <div><strong>CTA:</strong> {variant.cta}</div>}
                                    {variant.why && <div className="text-zinc-500 italic mt-2">{variant.why}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={onGenerateIdeas} disabled={!isBriefComplete || isGeneratingIdeas} className="btn-secondary w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingIdeas && <div className="small-loader"></div>}<span>💡 Generate Creative Concepts</span>
            </button>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {isGeneratingIdeas && <div className="flex justify-center p-4"><div className="small-loader"></div></div>}
                {campaignIdeas.map(idea => (
                    <div key={idea.index} onClick={() => onSelectIdea(idea)} className={`concept-card ${selectedIdea?.index === idea.index ? 'selected' : ''}`}>
                         <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold text-sm">{idea.index}</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm mb-2">{idea.headline}</h3>
                                <p className="text-xs text-zinc-400 whitespace-pre-line">{idea.fullDescription}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);


const PlatformSettings: React.FC<{
    selectedPlatform: Platform; onPlatformChange: (p: Platform) => void;
    quality: Quality; onQualityChange: (q: Quality) => void;
    stylePreset: StylePreset; onStyleChange: (s: StylePreset) => void;
}> = ({ selectedPlatform, onPlatformChange, quality, onQualityChange, stylePreset, onStyleChange }) => {
    const platforms = Object.keys(platformRatios) as Platform[];
    return (
        <section className="glass-card p-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-6"><span className="badge badge-green">Step 4</span><h2 className="text-xl font-bold">Platform & Format</h2></div>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-3 text-zinc-300">Platform</label>
                    <div className="grid grid-cols-3 gap-2">
                        {platforms.map(p => (
                            <button key={p} onClick={() => onPlatformChange(p)} className={`platform-btn ${selectedPlatform === p ? 'active' : ''}`}>
                                <div className="font-semibold text-sm capitalize">{p.replace('-', ' ')}</div>
                                <div className="text-xs text-zinc-500">{platformRatios[p]}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Quality</label>
                        <select id="resolution" value={quality} onChange={e => onQualityChange(e.target.value as Quality)} className="w-full">
                            <option value="standard">Standard</option><option value="hd">HD</option><option value="4k">Ultra HD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-zinc-300">Style</label>
                        <select id="stylePreset" value={stylePreset} onChange={e => onStyleChange(e.target.value as StylePreset)} className="w-full">
                            <option value="match">Match Concept</option><option value="minimalist">Minimalist</option><option value="bold">Bold</option><option value="elegant">Elegant</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
};

const GenerationQueue: React.FC<{ queue: QueueItem[] }> = ({ queue }) => {
    const statusStyles: Record<QueueItem['status'], string> = {
        pending: 'bg-zinc-800 text-zinc-400',
        generating: 'bg-blue-950 text-blue-400 animate-pulse',
        done: 'bg-green-950 text-green-400',
        failed: 'bg-red-950 text-red-400',
    };
    return (
        <aside className="glass-card p-6 sticky top-6 animate-slide-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>⚡</span> Generation Queue</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {queue.length === 0 ? <p className="text-zinc-500 text-sm">Your jobs will appear here</p> :
                    [...queue].slice(-5).reverse().map(item => (
                        <div key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${item.status === 'done' ? 'bg-green-950/20' : item.status === 'failed' ? 'bg-red-950/20' : 'bg-zinc-900/50'}`}>
                            <div className="flex-1 min-w-0"><span className="font-medium text-sm capitalize">{item.platform.replace('-', ' ')}</span><span className="text-xs text-zinc-500 block truncate">{item.concept}</span></div>
                            <span className={`text-xs py-1 px-2 rounded-full ml-2 ${statusStyles[item.status]}`}>{item.status}</span>
                        </div>
                    ))}
            </div>
        </aside>
    );
};

const CreativeCard: React.FC<{ 
    creative: Creative; 
    status?: QueueItem['status']; 
    onDownload: (url: string, name: string) => void;
    onRevise: (jobId: string) => void;
    onRetry: (jobId: string) => void;
    error?: string;
}> = ({ creative, status, onDownload, onRevise, onRetry, error }) => {
    const { jobId, url, platform, label, concept } = creative;

    if (status === 'generating' || status === 'pending') {
        return (
            <div className="preview-card p-4 animate-slide-in" id={`card-${jobId}`}>
                <div className="w-full aspect-square bg-zinc-900 rounded-lg flex items-center justify-center mb-3"><div className="loader"></div></div>
                <div>
                    <div className="font-semibold text-sm capitalize">{platform.replace('-', ' ')} <span className="text-zinc-400">({label})</span></div>
                    <div className="text-xs text-zinc-500">Generating...</div>
                </div>
            </div>
        );
    }
    if (status === 'failed') {
         return (
            <div className="preview-card p-4 animate-slide-in" id={`card-${jobId}`}>
                <div className="w-full aspect-square bg-red-950/20 border border-red-900/30 rounded-lg flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold text-red-400">Generation Failed</p>
                    {error && <p className="text-xs text-zinc-500 mt-1 text-center">{error}</p>}
                    <button onClick={() => onRetry(jobId)} className="mt-3 btn-secondary px-3 py-2 rounded-lg text-xs">Try Again</button>
                </div>
            </div>
        );
    }
    return (
        <div className="preview-card p-4 animate-slide-in" id={`card-${jobId}`}>
            <div className="w-full aspect-square bg-zinc-900 rounded-lg overflow-hidden mb-3"><img src={url} className="w-full h-full object-contain" alt="Creative"/></div>
            <div className="mb-3">
                <div className="font-semibold text-sm capitalize">{platform.replace('-', ' ')} <span className="text-zinc-400">({label})</span></div>
                <div className="text-xs text-zinc-500">{concept}</div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => onDownload(url, jobId)} className="flex-1 btn-primary px-3 py-2 rounded-lg text-xs font-medium">Download</button>
                <button onClick={() => onRevise(jobId)} className="btn-secondary px-3 py-2 rounded-lg text-xs font-medium">✏️ Revise</button>
            </div>
        </div>
    );
};

const ResultsGrid: React.FC<{ 
    creatives: Map<string, Creative>;
    queue: QueueItem[];
    onDownload: (url: string, name: string) => void;
    onRevise: (jobId: string) => void;
    onRetry: (jobId: string) => void;
    onDownloadAll: () => void;
}> = ({ creatives, queue, onDownload, onRevise, onRetry, onDownloadAll }) => {
    
    const displayItems = useMemo(() => {
        const items = new Map<string, { creative: Creative, status?: GenerationStatus, error?: string }>();
        queue.forEach(q => {
            if (creatives.has(q.id)) {
                 items.set(q.id, { creative: creatives.get(q.id)!, status: q.status, error: q.error });
            } else if (q.status !== 'done') {
                // For pending/generating/failed items not yet in creatives map
                const placeholderCreative: Creative = {
                    jobId: q.id,
                    url: '',
                    platform: q.platform,
                    label: q.concept.includes('With Text') ? 'With Text' : 'No Text',
                    concept: q.concept,
                    copy: null,
                    brand: '',
                    prompt: '',
                };
                items.set(q.id, { creative: placeholderCreative, status: q.status, error: q.error });
            }
        });
        
        return Array.from(items.values());
    }, [creatives, queue]);

    return (
        <section className="glass-card p-6 min-h-[600px] animate-slide-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><span>🖼️</span> Generated Creatives</h2>
                {creatives.size > 0 && <button onClick={onDownloadAll} className="btn-primary px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Download All</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayItems.length === 0 ? <p className="text-zinc-500 text-sm col-span-full text-center py-20">Your creatives will appear here</p> :
                    displayItems.map(({ creative, status, error }) => <CreativeCard key={creative.jobId} creative={creative} status={status} error={error} onDownload={onDownload} onRevise={onRevise} onRetry={onRetry} />)}
            </div>
        </section>
    );
};

const Toast: React.FC<{ message: string; show: boolean }> = ({ message, show }) => {
    if (!show) return null;
    return (
        <div className="fixed top-5 right-5 bg-[#18181b] border border-[#27272a] rounded-lg py-4 px-6 shadow-lg z-[9999] animate-slide-in">
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode; active: boolean; }> = ({ children, active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center animation-fade-in">
            {children}
        </div>
    );
};


function App() {
    // State
    const [brief, setBrief] = useState<Brief>(initialBrief);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    
    const [conceptFile, setConceptFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    const [palette, setPalette] = useState<string[]>([]);

    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
    const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);
    const [selectedCopy, setSelectedCopy] = useState<CopyVariant | null>(null);

    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
    const [campaignIdeas, setCampaignIdeas] = useState<CampaignIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<CampaignIdea | null>(null);

    const [platform, setPlatform] = useState<Platform>('instagram');
    const [quality, setQuality] = useState<Quality>('hd');
    const [stylePreset, setStylePreset] = useState<StylePreset>('match');

    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [creatives, setCreatives] = useState<Map<string, Creative>>(new Map());

    const [toast, setToast] = useState({ show: false, message: '' });

    const [modals, setModals] = useState({ revision: false, loadProfile: false, confirmClear: false });
    const [currentRevisionId, setCurrentRevisionId] = useState<string | null>(null);
    const [revisionFeedback, setRevisionFeedback] = useState('');
    const [profiles, setProfiles] = useState<Record<string, ClientProfile>>({});
    
    const [activeTab, setActiveTab] = useState<'campaign' | 'creative-board'>('campaign');

    // Derived State & Memos
    // FIX: The logical AND (&&) operator was returning the last string value, not a boolean. Coerce to boolean with `!!`.
    const isBriefComplete = useMemo(() => !!(brief.brandName.trim() && brief.productDetails.trim() && brief.campaignGoal.trim() && brief.coreMessage.trim()), [brief]);
    // FIX: Same issue - the logical AND operator returns the last value, not a boolean. Coerce to boolean with `!!`.
    const canGenerate = useMemo(() => !!(isBriefComplete && conceptFile && selectedIdea && selectedCopy), [isBriefComplete, conceptFile, selectedIdea, selectedCopy]);

    // Effects
    useEffect(() => {
        try {
            const savedProfiles = JSON.parse(localStorage.getItem('clientProfiles') || '{}');
            setProfiles(savedProfiles);
        } catch {
            setProfiles({});
        }
        showToast('🚀 Welcome to SocialSpark Pro - Black Edition', 4000);
    }, []);

    // Functions
    const showToast = (message: string, duration = 3000) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), duration);
    };

    const handleAutoFill = useCallback(async () => {
        if (!brief.brandName || !brief.campaignGoal) {
            return showToast('Fill in Brand Name and Campaign Objective first');
        }
        setIsAutoFilling(true);
        try {
            const result = await geminiService.autoFillBrief(brief.brandName, brief.campaignGoal, brief.productDetails);
            setBrief(b => ({ ...b, ...result }));
            showToast('✅ Brief auto-generated!');
        } catch (e) {
            console.error(e);
            showToast('❌ Failed to generate brief');
        } finally {
            setIsAutoFilling(false);
        }
    }, [brief]);

    const handleAnalyze = useCallback(async () => {
        if (!conceptFile) return;
        setIsAnalyzing(true);
        setAnalysisResult('');
        try {
            const result = await geminiService.analyzeImage(conceptFile);
            setAnalysisResult(result);
            showToast('✅ Analysis complete!');
        } catch (e) {
            console.error(e);
            setAnalysisResult('Analysis failed');
            showToast('❌ Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    }, [conceptFile]);
    
    const handleAddColor = (color: string) => {
        if (palette.length < 10) {
            setPalette(p => [...p, color]);
        } else {
            showToast('❌ Max 10 colors');
        }
    };
    const handleRemoveColor = (index: number) => setPalette(p => p.filter((_, i) => i !== index));

    const parseAndSetCopyVariants = (text: string) => {
        const variantBlocks = text.split(/\*\*Variant \d+:/).filter(b => b.trim());
        const variants: CopyVariant[] = variantBlocks.map((variant, index) => {
            const lines = variant.trim().split('\n').filter(l => l.trim());
            const angle = lines[0] ? lines[0].replace(/\*\*/g, '').trim() : 'Unknown';
            let headline = '', body = '', cta = '', why = '';
            lines.forEach(line => {
                const lower = line.toLowerCase();
                if (lower.startsWith('headline:')) headline = line.substring(9).trim();
                else if (lower.startsWith('body:')) body = line.substring(5).trim();
                else if (lower.startsWith('cta:')) cta = line.substring(4).trim();
                else if (lower.startsWith('why it works:')) why = line.substring(13).trim();
            });
            return { angle, headline, body, cta, why, index: index + 1 };
        });
        setCopyVariants(variants);
    };

    const handleGenerateCopy = useCallback(async () => {
        if (!isBriefComplete) return;
        setIsGeneratingCopy(true);
        setCopyVariants([]);
        try {
            const result = await geminiService.generateCopy(brief, platform);
            parseAndSetCopyVariants(result);
            showToast('✅ Copy variants generated!');
        } catch (e) {
            console.error(e);
            showToast('❌ Copy generation failed');
        } finally {
            setIsGeneratingCopy(false);
        }
    }, [brief, platform, isBriefComplete]);

    const parseAndSetCampaignIdeas = (text: string) => {
        const conceptBlocks = text.split(/\*\*Concept \d+:/).filter(b => b.trim());
        const ideas: CampaignIdea[] = conceptBlocks.map((concept, index) => {
            const lines = concept.trim().split('\n').filter(l => l.trim());
            const headline = lines[0]?.replace(/\*\*/g, '').trim() || 'Untitled Concept';
            const fullDescription = lines.slice(1).join('\n');
            const visualMatch = fullDescription.match(/Visual:\s*([^\n]+)/i);
            const visualDescription = visualMatch?.[1]?.trim() || headline;
            return { headline, fullDescription, visualDescription, index: index + 1 };
        });
        setCampaignIdeas(ideas);
    };

    const handleGenerateIdeas = useCallback(async () => {
        if (!isBriefComplete) return;
        setIsGeneratingIdeas(true);
        setCampaignIdeas([]);
        try {
            const result = await geminiService.generateConcepts(brief, analysisResult);
            parseAndSetCampaignIdeas(result);
            showToast('✅ Concepts generated!');
        } catch (e) {
            console.error(e);
            showToast('❌ Concept generation failed');
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, [brief, analysisResult, isBriefComplete]);
    
    const buildCreativePrompt = (noText = false): string => {
        if (!selectedIdea || !selectedCopy) return "";
        let qualityString = "high quality, sharp details";
        if (quality === '4k') qualityString = "ultra-HD 4K, photorealistic";

        let styleDirection = "Match the reference concept style";
        if (stylePreset !== 'match') styleDirection = `Use ${stylePreset} design style`;

        const paletteDirective = palette.length > 0 ? `\nBrand Colors: ${palette.join(', ')}` : '';
        const ratio = platformRatios[platform];

        if (noText) {
            return `Create a professional social media creative background image with absolutely NO text, NO headlines, NO logos, NO copy.

            BRIEF:
            - Brand: ${brief.brandName}
            - Product: ${brief.productDetails}
            ${paletteDirective}

            CONCEPT (Visuals ONLY):
            ${selectedIdea.visualDescription}

            DESIGN:
            - Style: ${styleDirection}
            - Platform: ${platform}
            - Aspect Ratio: ${ratio}
            - Quality: ${qualityString}

            CRITICAL: This should be a clean background image with NO text overlays whatsoever. Pure visual design only, optimized for ${platform}.`;
        }

        return `Create a professional social media creative.

        BRIEF:
        - Brand: ${brief.brandName}
        - Product: ${brief.productDetails}
        ${paletteDirective}

        CONCEPT:
        ${selectedIdea.headline}
        ${selectedIdea.fullDescription}

        COPY (use exactly, embed legibly):
        Headline: ${selectedCopy.headline}
        ${selectedCopy.body ? `Body: ${selectedCopy.body}` : ''}
        ${selectedCopy.cta ? `CTA: ${selectedCopy.cta}` : ''}

        DESIGN:
        - Style: ${styleDirection}
        - Platform: ${platform}
        - Aspect Ratio: ${ratio}
        - Quality: ${qualityString}

        Requirements: Professional layout, legible text, on-brand colors, ${platform}-optimized.`;
    };

    const processGenerationJob = useCallback(async (jobId: string, prompt: string, label: string, conceptHeadline: string, copyVariant: CopyVariant | null) => {
        setQueue(q => q.map(item => item.id === jobId ? { ...item, status: 'generating' } : item));
        try {
            const imageUrl = await geminiService.generateImage(prompt);
            const creativeData: Creative = {
                url: imageUrl, platform, concept: conceptHeadline, copy: copyVariant,
                brand: brief.brandName, jobId, label, prompt
            };
            setCreatives(c => new Map(c).set(jobId, creativeData));
            setQueue(q => q.map(item => item.id === jobId ? { ...item, status: 'done' } : item));
            showToast(`✅ Creative generated (${label})!`);
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            setQueue(q => q.map(item => item.id === jobId ? { ...item, status: 'failed', error: errorMessage } : item));
            showToast(`❌ Generation failed (${label})`);
        }
    }, [brief.brandName, platform]);

    const handleStartGeneration = useCallback(async () => {
        if (!canGenerate || !selectedIdea || !selectedCopy) return;
        const timestamp = Date.now();
        const jobIdText = `${timestamp}-${platform}-text`;
        const jobIdNoText = `${timestamp}-${platform}-notext`;

        const newQueueItems: QueueItem[] = [
            { id: jobIdText, platform, concept: `${selectedIdea.headline} (With Text)`, status: 'pending' },
            { id: jobIdNoText, platform, concept: `${selectedIdea.headline} (No Text)`, status: 'pending' },
        ];
        setQueue(q => [...q, ...newQueueItems]);
        
        processGenerationJob(jobIdText, buildCreativePrompt(false), "With Text", selectedIdea.headline, selectedCopy);
        processGenerationJob(jobIdNoText, buildCreativePrompt(true), "No Text", selectedIdea.headline, null);
    }, [canGenerate, platform, selectedIdea, selectedCopy, processGenerationJob, buildCreativePrompt]);

    const handleRetry = (jobId: string) => {
        const queueItem = queue.find(item => item.id === jobId);
        if (!queueItem) {
             showToast(`❌ Could not find original data for job ${jobId}`);
             return;
        }

        const originalCreativeData = creatives.get(jobId);
        
        if (!originalCreativeData) {
             // This can happen if the job failed before creative data was ever created.
             // We need to reconstruct the prompt.
            if (!selectedIdea || !selectedCopy) {
                showToast(`❌ Cannot retry: Missing selected concept or copy.`);
                return;
            }
             const isText = queueItem.concept.includes('With Text');
             const prompt = buildCreativePrompt(!isText);
             const copy = isText ? selectedCopy : null;
             
             setQueue(q => q.map(item => item.id === jobId ? {...item, status: 'pending', error: undefined} : item));
             processGenerationJob(jobId, prompt, isText ? 'With Text' : 'No Text', selectedIdea.headline, copy);

        } else {
            setQueue(q => q.map(item => item.id === jobId ? {...item, status: 'pending', error: undefined} : item));
            processGenerationJob(jobId, originalCreativeData.prompt, originalCreativeData.label, originalCreativeData.concept, originalCreativeData.copy);
        }
    };

    const handleSubmitRevision = useCallback(async () => {
        if (!currentRevisionId || !revisionFeedback.trim()) return;
        const originalCreative = creatives.get(currentRevisionId);
        if (!originalCreative) return;
        
        setModals(m => ({...m, revision: false}));
        setQueue(q => q.map(item => item.id === currentRevisionId ? {...item, status: 'generating', error: undefined} : item));
        
        try {
            const revisionPrompt = `${originalCreative.prompt}\n\nREVISION REQUEST:\n${revisionFeedback}`;
            const newImageUrl = await geminiService.generateImage(revisionPrompt);
            const revisedCreative: Creative = { ...originalCreative, url: newImageUrl, prompt: revisionPrompt };
            setCreatives(c => new Map(c).set(currentRevisionId, revisedCreative));
            setQueue(q => q.map(item => item.id === currentRevisionId ? { ...item, status: 'done' } : item));
            showToast('✅ Creative revised!');
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            setQueue(q => q.map(item => item.id === currentRevisionId ? { ...item, status: 'failed', error: errorMessage } : item));
            showToast('❌ Revision failed');
        } finally {
            setRevisionFeedback('');
            setCurrentRevisionId(null);
        }
    }, [currentRevisionId, revisionFeedback, creatives]);
    
    const handleDownload = (url: string, name: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${brief.brandName || 'socialspark'}-${name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadAll = async () => {
        if (creatives.size === 0) return showToast("❌ No creatives to download");
        showToast("📦 Preparing download...");
        const zip = new JSZip();
        let count = 0;
        
        const promises = Array.from(creatives.values()).map(async (data: Creative) => {
            try {
                const response = await fetch(data.url);
                const blob = await response.blob();
                zip.file(`${data.brand}-${data.platform}-${data.jobId}.png`, blob);
                count++;
            } catch (e) {
                console.error(`Failed to fetch ${data.jobId}:`, e);
            }
        });

        await Promise.all(promises);

        if (count === 0) return showToast("❌ No images could be added to the zip");
        
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${brief.brandName || 'socialspark'}-creatives.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast("✅ Downloaded all creatives!");
    };
    
    const handleSaveProfile = () => {
        if (!brief.brandName) return showToast('❌ Enter a brand name first');
        const profile: ClientProfile = { ...brief, brandPalette: palette, savedAt: new Date().toISOString() };
        const updatedProfiles = { ...profiles, [brief.brandName]: profile };
        localStorage.setItem('clientProfiles', JSON.stringify(updatedProfiles));
        setProfiles(updatedProfiles);
        showToast(`✅ Profile saved: ${brief.brandName}`);
    };

    const handleLoadProfile = (profile: ClientProfile) => {
        setBrief({
            brandName: profile.brandName,
            productDetails: profile.productDetails,
            campaignGoal: profile.campaignGoal,
            coreMessage: profile.coreMessage,
            targetAudience: profile.targetAudience,
            brandVoice: profile.brandVoice,
            emotionalAppeal: profile.emotionalAppeal,
        });
        setPalette(profile.brandPalette || []);
        setModals(m => ({ ...m, loadProfile: false }));
        showToast(`✅ Loaded: ${profile.brandName}`);
    };

    const handleClearAll = () => {
        setBrief(initialBrief);
        setConceptFile(null);
        setAnalysisResult(null);
        setPalette([]);
        setCopyVariants([]);
        setSelectedCopy(null);
        setCampaignIdeas([]);
        setSelectedIdea(null);
        setQueue([]);
        setCreatives(new Map());
        setModals(m => ({ ...m, confirmClear: false }));
        showToast('✅ All data cleared!');
    };

    return (
        <div className="max-w-[1920px] mx-auto p-4 md:p-6">
            <Toast message={toast.message} show={toast.show} />
            
            <Modal active={modals.revision}>
                <div className="modal-content w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-xl p-8 animate-slide-in">
                    <h3 className="text-2xl font-bold mb-4">Request Revision</h3>
                    <textarea value={revisionFeedback} onChange={e => setRevisionFeedback(e.target.value)} rows={5} placeholder="Describe the changes you need..." className="w-full mb-4"></textarea>
                    <div className="flex gap-3">
                        <button onClick={handleSubmitRevision} className="flex-1 btn-primary px-4 py-3 rounded-lg font-medium">Submit Revision</button>
                        <button onClick={() => setModals(m => ({...m, revision: false}))} className="btn-secondary px-4 py-3 rounded-lg font-medium">Cancel</button>
                    </div>
                </div>
            </Modal>
            
            <Modal active={modals.loadProfile}>
                <div className="modal-content w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-xl p-8 animate-slide-in">
                    <h3 className="text-2xl font-bold mb-4">Load Client Profile</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                        {Object.keys(profiles).length === 0 ? <p className="text-zinc-500 text-sm">No saved profiles</p> :
                        Object.values(profiles).map((p: ClientProfile) => (
                            <div key={p.brandName} onClick={() => handleLoadProfile(p)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-green-500 cursor-pointer transition-all">
                                <div className="font-semibold text-sm">{p.brandName}</div>
                                <div className="text-xs text-zinc-500">Saved: {new Date(p.savedAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setModals(m => ({...m, loadProfile: false}))} className="btn-secondary w-full px-4 py-3 rounded-lg font-medium">Close</button>
                </div>
            </Modal>

            <Modal active={modals.confirmClear}>
                 <div className="modal-content max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-8 animate-slide-in">
                    <h3 className="text-2xl font-bold mb-2">Clear Everything?</h3>
                    <p className="text-zinc-400 text-sm mb-6">This will reset all inputs and delete generated creatives.</p>
                    <div className="flex gap-3">
                        <button onClick={handleClearAll} className="flex-1 px-4 py-3 rounded-lg font-medium bg-red-950 text-red-400 border border-red-900 hover:bg-red-900">Yes, Clear All</button>
                        <button onClick={() => setModals(m => ({...m, confirmClear: false}))} className="flex-1 btn-secondary px-4 py-3 rounded-lg font-medium">Cancel</button>
                    </div>
                </div>
            </Modal>

            <Header onSave={handleSaveProfile} onLoad={() => setModals(m => ({...m, loadProfile: true}))} onClear={() => setModals(m => ({...m, confirmClear: true}))} />

             <nav className="glass-card p-2 mb-6 animate-slide-in">
                <div className="flex gap-2">
                    <button className={`tab-btn ${activeTab === 'campaign' ? 'active' : ''}`} onClick={() => setActiveTab('campaign')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Campaign Studio
                    </button>
                    <button className={`tab-btn ${activeTab === 'creative-board' ? 'active' : ''}`} onClick={() => setActiveTab('creative-board')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        Creative Board
                    </button>
                </div>
            </nav>

            <div className={`tab-content ${activeTab === 'campaign' ? 'active' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <BriefForm brief={brief} setBrief={setBrief} onAutoFill={handleAutoFill} isAutoFilling={isAutoFilling} />
                        <VisualsForm onFileChange={setConceptFile} conceptFile={conceptFile} isAnalyzing={isAnalyzing} onAnalyze={handleAnalyze} palette={palette} onAddColor={handleAddColor} onRemoveColor={handleRemoveColor} />
                        {analysisResult !== null && <section className="glass-card p-6 animate-slide-in">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>📊</span> Concept Analysis</h2>
                            {isAnalyzing ? <div className="flex justify-center p-4"><div className="loader"></div></div> :
                            <div className="text-sm text-zinc-300 leading-relaxed p-4 bg-black/30 rounded-lg" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-400 block mt-3 mb-1">$1</strong>').replace(/\n/g, '<br />') }}></div>}
                        </section>}
                        <AIGeneration 
                            isBriefComplete={isBriefComplete}
                            onGenerateCopy={handleGenerateCopy} isGeneratingCopy={isGeneratingCopy} copyVariants={copyVariants} selectedCopy={selectedCopy} onSelectCopy={setSelectedCopy}
                            onGenerateIdeas={handleGenerateIdeas} isGeneratingIdeas={isGeneratingIdeas} campaignIdeas={campaignIdeas} selectedIdea={selectedIdea} onSelectIdea={setSelectedIdea}
                        />
                        <PlatformSettings selectedPlatform={platform} onPlatformChange={setPlatform} quality={quality} onQualityChange={setQuality} stylePreset={stylePreset} onStyleChange={setStylePreset} />
                        <button onClick={handleStartGeneration} disabled={!canGenerate} title={!canGenerate ? `Missing: ${!isBriefComplete ? 'Brief, ' : ''}${!conceptFile ? 'Image, ' : ''}${!selectedCopy ? 'Copy, ' : ''}${!selectedIdea ? 'Concept' : ''}`.replace(/,\s*$/, '') : ''} className="btn-primary w-full px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-6 z-10">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Generate Creative
                        </button>
                    </div>
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <GenerationQueue queue={queue} />
                        <ResultsGrid 
                            creatives={creatives}
                            queue={queue}
                            onDownload={handleDownload}
                            onRevise={(jobId) => { setCurrentRevisionId(jobId); setModals(m => ({...m, revision: true})); }}
                            onRetry={handleRetry}
                            onDownloadAll={handleDownloadAll}
                        />
                    </div>
                </div>
            </div>
             <div className={`tab-content ${activeTab === 'creative-board' ? 'active' : ''}`}>
                <CreativeBoard showToast={showToast} />
            </div>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
