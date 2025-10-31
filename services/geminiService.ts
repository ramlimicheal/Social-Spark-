
import { GoogleGenAI, Type } from "@google/genai";
import { Brief, CreativeTeamMember, CreativeBoardBrief } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const withRetry = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
  throw new Error("Operation failed after multiple retries.");
};

export const autoFillBrief = async (brandName: string, campaignGoal: string, productDetails: string): Promise<Partial<Brief>> => {
  return withRetry(async () => {
    const prompt = `You are a marketing strategist. Generate campaign brief elements in JSON format.
    Brand: "${brandName}"
    Product: "${productDetails}"
    Goal: "${campaignGoal}"
    Return ONLY a JSON object with these keys: "coreMessage", "targetAudience", "brandVoice", "emotionalAppeal".
    No markdown, no explanations, just raw JSON.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
       config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coreMessage: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            brandVoice: { type: Type.STRING },
            emotionalAppeal: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text.trim();
    return JSON.parse(text);
  });
};

export const analyzeImage = async (file: File): Promise<string> => {
    return withRetry(async () => {
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const prompt = `Analyze this creative concept. Provide:
**Layout Structure**: Composition and hierarchy
**Typography**: Font choices and readability
**Color Palette**: Dominant colors
**Visual Style**: Overall aesthetic
**Mood & Tone**: Emotional impact

Use **bold** for headings.`;

        const imagePart = {
            inlineData: {
                mimeType: file.type,
                data: base64Data,
            },
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ parts: [{ text: prompt }, imagePart] }]
        });
        
        return response.text.trim();
    });
};

export const generateCopy = async (brief: Brief, platform: string): Promise<string> => {
    return withRetry(async () => {
        const prompt = `Generate 5 high-impact social media copy variants.

        Brand: ${brief.brandName}
        Product: ${brief.productDetails}
        Goal: ${brief.campaignGoal}
        Message: ${brief.coreMessage}
        Audience: ${brief.targetAudience || 'General'}
        Voice: ${brief.brandVoice || 'Engaging'}
        Platform: ${platform}

        Use these 5 angles:
        1. Feature Spotlight
        2. Problem-Agitate-Solve
        3. Social Proof
        4. Urgency/FOMO
        5. Aspirational Vision

        Format each as:
        **Variant [number]: [Angle]**
        Headline: [hook]
        Body: [message]
        CTA: [call-to-action]
        Why it works: [explanation]`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text.trim();
    });
};

export const generateConcepts = async (brief: Brief, analysisContext: string | null): Promise<string> => {
    return withRetry(async () => {
        const analysisPrompt = analysisContext ? `Style Analysis:\n${analysisContext}\n` : '';
        const prompt = `Generate 5 creative campaign concepts.

        Brand: ${brief.brandName}
        Product: ${brief.productDetails}
        Goal: ${brief.campaignGoal}
        Message: ${brief.coreMessage}
        ${analysisPrompt}
        Format each as:
        **Concept [number]: [Headline]**
        Visual: [description]
        Angle: [message angle]
        Unique Factor: [what makes it stand out]`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text.trim();
    });
};


export const generateImage = async (prompt: string): Promise<string> => {
    return withRetry(async () => {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
            },
        });
        const imageData = response.generatedImages[0].image.imageBytes;
        if (!imageData) {
            throw new Error("No image data returned from API");
        }
        return `data:image/png;base64,${imageData}`;
    });
};

// Creative Board Services

const buildTeamMemberPrompt = (member: CreativeTeamMember, brief: CreativeBoardBrief): string => {
    const objectiveMap: Record<string, string> = {
        'awareness': 'Build brand awareness and recognition',
        'sales': 'Drive product sales and conversions',
        'followers': 'Grow social media following and community',
        'traffic': 'Increase website traffic and engagement',
        'engagement': 'Boost post engagement and interactions',
        'leads': 'Generate qualified leads',
        'retention': 'Improve customer retention and loyalty',
        'launch': 'Successfully launch new product/service'
    };
    const objectiveText = objectiveMap[brief.objective] || brief.objective;

    const baseContext = `You are ${member.name}, ${member.role} at a world-class creative agency.

CLIENT BRIEF:
• Business: ${brief.brand}
• Industry: ${brief.industry}
• Objective: ${objectiveText}
• Details: ${brief.details || 'Not provided'}
• Budget: ${brief.budget || 'Not specified'}

YOUR EXPERTISE: ${member.specialty}
YOUR APPROACH: ${member.approach}`;

      const rolePrompts: Record<CreativeTeamMember['role'], string> = {
        'Creative Director': `${baseContext}\n\nDevelop a BIG IDEA that will break through the clutter. Think campaign-level storytelling.\n\nProvide your concept in this exact format:\n\n**CAMPAIGN CONCEPT**\n[One powerful headline that captures the big idea]\n\n**THE BIG IDEA**\n[2-3 sentences explaining the overarching creative concept and why it's breakthrough]\n\n**EMOTIONAL HOOK**\n[The core emotion or insight this taps into]\n\n**STORYTELLING APPROACH**\n[How the narrative unfolds across touchpoints]\n\n**WHY THIS WINS**\n[Why this concept will achieve the objective and resonate with audiences]\n\n**EXECUTION HIGHLIGHTS**\n• [Key execution element 1]\n• [Key execution element 2]\n• [Key execution element 3]`,
        'Art Director': `${baseContext}\n\nCreate a visually stunning concept with contemporary design thinking.\n\nProvide your concept in this exact format:\n\n**VISUAL CONCEPT**\n[One striking headline describing the visual direction]\n\n**VISUAL LANGUAGE**\n[Describe the overall aesthetic - color palettes, typography style, visual mood]\n\n**KEY VISUAL ELEMENTS**\n• [Primary visual element 1]\n• [Primary visual element 2]\n• [Primary visual element 3]\n\n**DESIGN INSPIRATION**\n[Reference current design trends or styles that inform this - e.g., Brutalism, Y2K revival, Neo-minimalism]\n\n**COLOR & TYPOGRAPHY**\n[Specific color palette and type treatment recommendations]\n\n**PLATFORM ADAPTATION**\n[How visuals scale from Instagram to LinkedIn to outdoor]\n\n**STANDOUT FACTOR**\n[What makes this visually arresting and scroll-stopping]`,
        'Copywriter': `${baseContext}\n\nCraft messaging that drives action through powerful words.\n\nProvide your concept in this exact format:\n\n**COPY CONCEPT**\n[One punchy headline that leads the campaign]\n\n**CORE MESSAGE**\n[The single most important thing to communicate - one sentence]\n\n**HEADLINE OPTIONS**\n1. [Primary headline - bold and direct]\n2. [Alternative headline - emotional/aspirational]\n3. [Alternative headline - benefit-driven]\n\n**BODY COPY APPROACH**\n[The tone, voice, and messaging strategy - 2-3 sentences]\n\n**CALL-TO-ACTION**\n[Specific, compelling CTA that drives the objective]\n\n**TAGLINE/MANTRA**\n[A memorable phrase that could become synonymous with the brand]\n\n**WHY IT PERSUADES**\n[The psychological triggers and persuasion techniques at play]`,
        'Strategy Director': `${baseContext}\n\nDevelop a data-driven concept with clear business impact.\n\nProvide your concept in this exact format:\n\n**STRATEGIC CONCEPT**\n[One headline that positions the strategic approach]\n\n**CONSUMER INSIGHT**\n[The key truth about the target audience that unlocks this opportunity]\n\n**STRATEGIC ANGLE**\n[The competitive positioning and market gap this fills]\n\n**SUCCESS METRICS**\n• [Primary KPI and target]\n• [Secondary KPI and target]\n• [Tertiary KPI and target]\n\n**AUDIENCE TARGETING**\n[Specific demographic and psychographic segments with rationale]\n\n**CHANNEL STRATEGY**\n[Priority channels and why they're optimal for this objective]\n\n**BUDGET ALLOCATION**\n[High-level budget breakdown if budget is specified, or "Scalable" approach]\n\n**COMPETITIVE ADVANTAGE**\n[Why this wins against competition]`,
        'Designer': `${baseContext}\n\nMake this concept production-ready and scalable across platforms.\n\nProvide your concept in this exact format:\n\n**DESIGN CONCEPT**\n[One headline describing the design system]\n\n**DESIGN SYSTEM**\n[The modular approach to assets - grid, layout principles, component library]\n\n**PLATFORM SPECS**\n• Instagram: [Specific format recommendations]\n• Facebook: [Specific format recommendations]\n• LinkedIn: [Specific format recommendations]\n• Stories/Reels: [Specific format recommendations]\n\n**ASSET REQUIREMENTS**\n[List of deliverables needed - static posts, videos, stories, etc.]\n\n**TEMPLATE APPROACH**\n[How to create scalable templates for ongoing use]\n\n**PRODUCTION NOTES**\n[Technical considerations - file formats, dimensions, animation specs]\n\n**BRAND CONSISTENCY**\n[How to maintain brand identity while allowing flexibility]`,
      };

    return rolePrompts[member.role] || baseContext;
}

export const generateTeamConcept = async (member: CreativeTeamMember, brief: CreativeBoardBrief, inspirationFile: File | null): Promise<string> => {
    return withRetry(async () => {
        const prompt = buildTeamMemberPrompt(member, brief);
        if (inspirationFile && member.role === 'Art Director') {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(inspirationFile);
            });

             const imagePart = {
                inlineData: {
                    mimeType: inspirationFile.type,
                    data: base64Data,
                },
            };
    
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ parts: [{ text: prompt }, imagePart] }]
            });
            return response.text.trim();

        } else {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ parts: [{ text: prompt }] }]
            });
            return response.text.trim();
        }
    });
};

export const expandOrRefineConcept = async (originalContent: string, member: CreativeTeamMember, brief: CreativeBoardBrief, action: 'expand' | 'refine', feedback?: string): Promise<string> => {
     return withRetry(async () => {
        let prompt = '';
        if (action === 'expand') {
            prompt = `You are ${member.name}, ${member.role}. 

You previously pitched this concept:
${originalContent}

CLIENT: ${brief.brand} (${brief.industry})
OBJECTIVE: ${brief.objective}

Now EXPAND on this concept with:
1. Three specific execution examples
2. A 90-day rollout timeline
3. Measurement framework
4. Potential challenges and solutions

Keep your voice and perspective. Format clearly with headers.`;
        } else { // refine
            prompt = `You are ${member.name}, ${member.role}.

Your original concept:
${originalContent}

REFINEMENT REQUEST: ${feedback}

Provide a refined version that addresses the feedback while maintaining your creative vision. Use the same format as your original concept.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text.trim();
    });
}