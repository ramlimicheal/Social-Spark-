
import React, { useState, useMemo, useCallback } from 'react';
import { CreativeBoardBrief, TeamConcept } from './types';
import { CREATIVE_TEAM } from './constants';
import * as geminiService from './services/geminiService';

const initialBrief: CreativeBoardBrief = {
    brand: '',
    industry: '',
    objective: 'awareness',
    details: '',
    budget: '',
};

const TeamConceptCard: React.FC<{
    concept: TeamConcept;
    index: number;
    onExpand: (index: number) => void;
    onRefine: (index: number) => void;
    onCopy: (index: number) => void;
}> = ({ concept, index, onExpand, onRefine, onCopy }) => {
    const { member, content, expansion, isExpanding } = concept;

    const formatContent = (text: string | undefined, isExpansion: boolean): string => {
        if (!text) return '';

        const escapeHtml = (unsafe: string) =>
            unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const lines = text.split('\n').filter(line => line.trim() !== '');
        const htmlBlocks: string[] = [];
        let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

        const flushList = () => {
            if (currentList) {
                const liClass = isExpansion ? 'ml-4 text-sm' : 'ml-4';
                // Items are already escaped when pushed
                const listItems = currentList.items.map(item => `<li class="${liClass}">${item}</li>`).join('');
                const listTag = currentList.type;
                const listClass = listTag === 'ul' ? 'list-disc pl-5' : 'list-decimal pl-5';
                htmlBlocks.push(`<${listTag} class="${listClass}">${listItems}</${listTag}>`);
                currentList = null;
            }
        };

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                flushList();
                const headerClass = isExpansion ? 'text-sm font-bold text-green-400 mt-3 mb-2' : 'text-base font-bold text-zinc-100 mt-4 mb-2';
                const headerContent = escapeHtml(trimmedLine.slice(2, -2).trim());
                htmlBlocks.push(`<h4 class="${headerClass}">${headerContent}</h4>`);
                continue;
            }
            
            const ulMatch = trimmedLine.match(/^[•*-]\s+(.*)/);
            if (ulMatch) {
                if (currentList?.type !== 'ul') flushList();
                if (!currentList) currentList = { type: 'ul', items: [] };
                currentList.items.push(escapeHtml(ulMatch[1].trim()));
                continue;
            }

            const olMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
            if (olMatch) {
                if (currentList?.type !== 'ol') flushList();
                if (!currentList) currentList = { type: 'ol', items: [] };
                currentList.items.push(escapeHtml(olMatch[1].trim()));
                continue;
            }

            flushList();
            const pClass = isExpansion ? 'text-sm' : '';
            const pContent = escapeHtml(trimmedLine);
            htmlBlocks.push(`<p class="${pClass}">${pContent}</p>`);
        }

        flushList();

        return htmlBlocks.join('');
    };

    const htmlContent = formatContent(content, false);
    const expansionHtml = formatContent(expansion, true);

    return (
        <div className="team-concept animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-lg text-white">
                        {member.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <span className={`role-badge ${member.badge}`}>{member.role}</span>
                    </div>
                </div>
                <button onClick={() => onCopy(index)} className="btn-secondary px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-green-950 hover:text-green-400 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy
                </button>
            </div>

            <div className="concept-section">
                <div className="text-sm text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
            
            {isExpanding && <div className="mt-4 flex justify-center"><div className="loader"></div></div>}

            {expansion && (
                 <div className="expansion-section concept-section mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <strong className="text-green-400 text-sm">Expanded Details</strong>
                    </div>
                    <div className="text-sm text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: expansionHtml! }}/>
                 </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-500"><strong className="text-zinc-400">Specialty:</strong> {member.specialty}</div>
                <div className="flex gap-2">
                    <button onClick={() => onExpand(index)} className="text-xs text-green-400 hover:text-green-300 font-medium" disabled={isExpanding}>💬 Expand</button>
                    <button onClick={() => onRefine(index)} className="text-xs text-blue-400 hover:text-blue-300 font-medium" disabled={isExpanding}>✨ Refine</button>
                </div>
            </div>
        </div>
    );
}

export const CreativeBoard: React.FC<{ showToast: (msg: string, duration?: number) => void }> = ({ showToast }) => {
    const [brief, setBrief] = useState<CreativeBoardBrief>(initialBrief);
    const [inspirationFile, setInspirationFile] = useState<File | null>(null);
    const [teamConcepts, setTeamConcepts] = useState<TeamConcept[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string[]>([]);
    
    const canGenerate = useMemo(() => brief.brand.trim() && brief.industry.trim() && brief.objective, [brief]);

    const handleBriefChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setBrief({ ...brief, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setInspirationFile(file || null);
    };

    const handleGenerateConcepts = useCallback(async () => {
        setIsGenerating(true);
        setTeamConcepts([]);
        setGenerationStatus([]);

        try {
            const concepts: TeamConcept[] = [];
            for (let i = 0; i < CREATIVE_TEAM.length; i++) {
                const member = CREATIVE_TEAM[i];
                const statuses = CREATIVE_TEAM.map((m, idx) => {
                    if (idx < i) return '✅ Complete';
                    if (idx === i) return '⚡ Working...';
                    return '⏳ Waiting';
                });
                setGenerationStatus(statuses);

                const conceptText = await geminiService.generateTeamConcept(member, brief, inspirationFile);
                const newConcept: TeamConcept = {
                    member,
                    content: conceptText,
                    timestamp: new Date().toISOString()
                };
                concepts.push(newConcept);
                setTeamConcepts([...concepts]);
            }
            showToast('✅ 5 world-class concepts generated!');
        } catch (error) {
            console.error(error);
            showToast('❌ Failed to generate concepts', 4000);
        } finally {
            setIsGenerating(false);
            setGenerationStatus([]);
        }
    }, [brief, inspirationFile, showToast]);
    
    const handleExpand = useCallback(async (index: number) => {
        const concept = teamConcepts[index];
        setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, isExpanding: true } : c));
        showToast('🔄 Expanding concept...');
        try {
            const expansion = await geminiService.expandOrRefineConcept(concept.content, concept.member, brief, 'expand');
            setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, expansion, isExpanding: false } : c));
            showToast('✅ Concept expanded!');
        } catch (e) {
            console.error(e);
            showToast('❌ Expansion failed');
            setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, isExpanding: false } : c));
        }
    }, [teamConcepts, brief, showToast]);

    const handleRefine = useCallback(async (index: number) => {
        const feedback = prompt('What would you like to refine about this concept?');
        if (!feedback || !feedback.trim()) return;
        
        const concept = teamConcepts[index];
        setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, isExpanding: true, expansion: undefined } : c));
        showToast('✨ Refining concept...');
        try {
            const refinedContent = await geminiService.expandOrRefineConcept(concept.content, concept.member, brief, 'refine', feedback);
            setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, content: refinedContent, isExpanding: false } : c));
            showToast('✅ Concept refined!');
        } catch (e) {
            console.error(e);
            showToast('❌ Refinement failed');
            setTeamConcepts(concepts => concepts.map((c, i) => i === index ? { ...c, isExpanding: false } : c));
        }
    }, [teamConcepts, brief, showToast]);
    
    const handleCopy = (index: number) => {
        const concept = teamConcepts[index];
        const text = `${concept.member.role}: ${concept.member.name}\n\n${concept.content}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ Concept copied to clipboard!');
        }).catch(err => {
            showToast('❌ Failed to copy');
            console.error(err);
        });
    };
    
    const handleExport = () => {
        let doc = `CREATIVE CONCEPTS - ${brief.brand}\n`;
        doc += `Generated: ${new Date().toLocaleDateString()}\n`;
        doc += `Objective: ${brief.objective}\n\n`;
        doc += '='.repeat(80) + '\n\n';

        teamConcepts.forEach((concept, idx) => {
            doc += `CONCEPT ${idx + 1}: ${concept.member.role} (${concept.member.name})\n`;
            doc += '-'.repeat(80) + '\n\n';
            doc += concept.content;
            doc += '\n\n' + '='.repeat(80) + '\n\n';
        });

        const blob = new Blob([doc], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${brief.brand}-creative-concepts.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Concepts exported!');
    };


    return (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 flex flex-col gap-6">
                <section className="glass-card p-6 animate-slide-in">
                    <div className="flex items-center gap-3 mb-6"><span className="badge badge-green">Step 1</span><h2 className="text-xl font-bold">Strategy Brief</h2></div>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium mb-2 text-zinc-300">Brand/Product *</label><input type="text" id="brand" value={brief.brand} onChange={handleBriefChange} placeholder="e.g., QuantumLeap AI" className="w-full"/></div>
                        <div><label className="block text-sm font-medium mb-2 text-zinc-300">Industry *</label><input type="text" id="industry" value={brief.industry} onChange={handleBriefChange} placeholder="e.g., B2B SaaS" className="w-full"/></div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-300">Primary Objective *</label>
                            <select id="objective" value={brief.objective} onChange={handleBriefChange} className="w-full">
                                <option value="awareness">Build brand awareness</option><option value="sales">Drive product sales</option><option value="followers">Grow social media following</option><option value="traffic">Increase website traffic</option><option value="engagement">Boost post engagement</option><option value="leads">Generate qualified leads</option><option value="retention">Improve customer retention</option><option value="launch">Launch new product/service</option>
                            </select>
                        </div>
                        <div><label className="block text-sm font-medium mb-2 text-zinc-300">Key Details</label><textarea id="details" value={brief.details} onChange={handleBriefChange} rows={3} placeholder="Any specific context or mandatories" className="w-full resize-none"></textarea></div>
                        <div><label className="block text-sm font-medium mb-2 text-zinc-300">Budget Tier</label>
                            <select id="budget" value={brief.budget} onChange={handleBriefChange} className="w-full">
                                <option value="">Not specified</option><option value="scrappy">Scrappy / Organic</option><option value="starter">Starter (&lt;$5k)</option><option value="growth">Growth ($5k-$25k)</option><option value="scale">Scale ($25k+)</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-300">Inspiration (Optional)</label>
                            <label htmlFor="inspirationFile" className="cursor-pointer text-center p-4 rounded-lg border-2 border-dashed border-zinc-800 hover:border-green-500 transition-all">
                                {inspirationFile ? `✔️ ${inspirationFile.name}` : 'Upload an image for the Art Director'}
                            </label>
                            <input type="file" id="inspirationFile" accept="image/*" onChange={handleFileChange} className="hidden"/>
                        </div>
                    </div>
                </section>
                <button onClick={handleGenerateConcepts} disabled={!canGenerate || isGenerating} className="btn-primary w-full px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-6 z-10">
                    {isGenerating ? <div className="small-loader"></div> : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
                    Assemble The Team
                </button>
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6">
                <section className="glass-card p-6 animate-slide-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><span>💡</span> Generated Concepts</h2>
                        {teamConcepts.length > 0 && <button onClick={handleExport} className="btn-secondary px-4 py-2 rounded-lg font-medium text-sm">Export All</button>}
                    </div>
                    {isGenerating && (
                        <div className="p-4 bg-zinc-900/50 rounded-lg mb-4">
                            <h3 className="text-sm font-bold text-zinc-300 mb-2">Team Progress:</h3>
                            <div className="space-y-1">
                                {CREATIVE_TEAM.map((member, i) => (
                                    <div key={member.role} className={`flex items-center gap-2 transition-opacity ${generationStatus[i] ? 'opacity-100' : 'opacity-50'}`}>
                                        <span className={`role-badge ${member.badge}`}>{member.role}</span>
                                        <span className="text-xs">{generationStatus[i] || '⏳ Waiting'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                       {teamConcepts.length === 0 && !isGenerating && <p className="text-zinc-500 text-sm text-center py-20">Your team's concepts will appear here</p>}
                       {isGenerating && teamConcepts.length === 0 && <div className="flex justify-center py-20"><div className="loader"></div></div>}
                       {teamConcepts.map((concept, i) => (
                           <TeamConceptCard key={concept.timestamp || i} concept={concept} index={i} onExpand={handleExpand} onRefine={handleRefine} onCopy={handleCopy}/>
                       ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
