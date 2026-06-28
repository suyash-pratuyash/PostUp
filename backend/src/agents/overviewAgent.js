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

export async function generateProjectOverview(project, logs, tone = 'professional') {
  const aiModel = getModel();

  // Build the journey narrative from logs
  const journeyEntries = logs.map(log => {
    const tags = JSON.parse(log.tags || '[]');
    return `Day ${log.day_number || '?'}: "${log.title}" — ${log.content}${tags.length ? ` [Tags: ${tags.join(', ')}]` : ''}`;
  }).join('\n');

  const totalDays = logs.length;
  const allTags = [...new Set(logs.flatMap(log => JSON.parse(log.tags || '[]')))];

  const prompt = `You are an expert LinkedIn content writer specializing in project journey posts. Your task is to create a compelling LinkedIn post that summarizes an entire project journey.

## PROJECT DETAILS:
- **Project Name**: ${project.name}
- **Description**: ${project.description || 'No description provided'}
- **Status**: ${project.status}
- **Total Days Logged**: ${totalDays}
- **Key Topics/Tags**: ${allTags.join(', ') || 'None specified'}

## DAY-BY-DAY JOURNEY:
${journeyEntries || 'No daily logs available yet.'}

## LINKEDIN POST RULES (MUST FOLLOW):
1. **Hook (first 2 lines)**: Create an attention-grabbing opener. Must be within first 210 characters.
2. **Length**: 1,300–1,900 characters.
3. **Structure**: Tell the project story — the challenge, the journey, key milestones, and the outcome.
4. **Format**: Use line breaks, short paragraphs. This is NOT an essay.
5. **Hashtags**: 3-5 relevant hashtags at the end.
6. **CTA**: End with a question or call to action.
7. **Emojis**: Use 1-3 strategically placed emojis.
8. **Authenticity**: Show vulnerability, real challenges faced, and genuine learnings.
9. **Pattern**: If applicable, use the "X days of Y" pattern (e.g., "30 days of learning React").

## TONE: ${tone}

## OUTPUT:
Write ONLY the LinkedIn post. No explanations, no metadata. Just the post content ready to copy-paste.`;

  const result = await aiModel.generateContent(prompt);
  const response = result.response;
  return response.text().trim();
}

export async function generateMilestonePost(project, log, milestoneContext, tone = 'professional') {
  const aiModel = getModel();

  const prompt = `You are an expert LinkedIn content writer. Create a milestone/progress update post for an ongoing project journey.

## CONTEXT:
- **Project**: ${project.name} — ${project.description || ''}
- **Current Day**: Day ${log.day_number || '?'}
- **Today's Work**: ${log.title} — ${log.content}
- **Milestone Context**: ${milestoneContext || 'Regular progress update'}

## LINKEDIN POST RULES:
1. Hook in first 210 characters
2. 1,300–1,900 characters total
3. Short paragraphs with line breaks
4. 3-5 hashtags at end
5. End with engagement question
6. 1-3 emojis max
7. Be authentic, share real learnings
8. Reference the journey (Day X of project Y)

## TONE: ${tone}

## OUTPUT:
Write ONLY the LinkedIn post. No explanations.`;

  const result = await aiModel.generateContent(prompt);
  const response = result.response;
  return response.text().trim();
}
