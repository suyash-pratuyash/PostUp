import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error(
        'Gemini API key not configured. Please add your API key to the .env file.\n' +
        'Get a free key at: https://aistudio.google.com/'
      );
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
}

const TONE_INSTRUCTIONS = {
  professional: `
    Write in a polished, authoritative tone. Use industry-standard terminology.
    Be concise and impactful. Sound confident and knowledgeable.
    This should read like a post from a respected industry professional.
  `,
  casual: `
    Write in a friendly, conversational tone. Use simple language.
    Be relatable and approachable. It's okay to use contractions and informal phrasing.
    This should feel like talking to a friend about your work.
  `,
  storytelling: `
    Write in a narrative, story-driven tone. Create a journey.
    Use vivid descriptions and build a narrative arc (challenge → action → result).
    Make the reader feel like they're experiencing the journey with you.
  `,
  motivational: `
    Write in an inspiring, energetic tone. Be uplifting and encouraging.
    Include actionable takeaways. Use powerful, punchy sentences.
    This should motivate others to take action and pursue their goals.
  `
};

export async function generateLinkedInPost(input, tone = 'professional') {
  const aiModel = getModel();

  const toneGuide = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

  const prompt = `You are an expert LinkedIn content writer. Your job is to transform raw input about someone's work, learnings, or achievements into a highly engaging LinkedIn post.

## LINKEDIN POST RULES (MUST FOLLOW):
1. **Hook (first 2 lines)**: Write a scroll-stopping opening line that sparks curiosity or makes a bold statement. This MUST be within the first 210 characters because LinkedIn truncates after that on mobile.
2. **Length**: The post should be between 1,300–1,900 characters (sweet spot for engagement).
3. **Formatting**: Use single line breaks between sentences/thoughts for readability. Use short paragraphs (1-2 sentences max). Add spacing — LinkedIn posts need whitespace.
4. **Hashtags**: Add exactly 3-5 relevant hashtags at the very end of the post.
5. **Call to Action**: End with a question or call to action to encourage engagement.
6. **Emojis**: Use emojis sparingly and strategically (1-3 max) to add visual interest.
7. **No external links** in the post body.
8. **Avoid** buzzwords, clichés like "excited to share", "thrilled to announce", "I'm humbled". Be authentic.

## TONE:
${toneGuide}

## RAW INPUT TO TRANSFORM:
${input}

## OUTPUT:
Write ONLY the LinkedIn post content. No explanations, no metadata, no markdown formatting. Just the raw post text ready to be copied and pasted into LinkedIn.`;

  const result = await aiModel.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return text.trim();
}

export async function regenerateWithFeedback(originalPost, feedback, tone = 'professional') {
  const aiModel = getModel();
  const toneGuide = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

  const prompt = `You are an expert LinkedIn content writer. You previously generated a LinkedIn post, and the user wants modifications.

## ORIGINAL POST:
${originalPost}

## USER FEEDBACK:
${feedback}

## TONE:
${toneGuide}

## LINKEDIN POST RULES:
1. Hook in first 210 characters (scroll-stopping opener)
2. 1,300–1,900 characters total
3. Short paragraphs with line breaks
4. 3-5 hashtags at end
5. End with CTA/question
6. Sparingly use emojis (1-3 max)
7. No external links
8. Avoid clichés

## OUTPUT:
Write ONLY the modified LinkedIn post. No explanations. Just the post text.`;

  const result = await aiModel.generateContent(prompt);
  const response = result.response;
  return response.text().trim();
}
