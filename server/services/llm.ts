import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface LeadContext {
  fullName?: string;
  phoneE164: string;
  email?: string;
  notes?: string;
  custom?: Record<string, any>;
  campaignName: string;
  scriptContent?: string;
}

// Generate agent utterance for campaign calls
export async function renderAgentUtterance(context: LeadContext): Promise<string> {
  try {
    // If we have a script, use it as the base
    let baseScript = context.scriptContent || `
Hello, this is an automated call from Bayti Real Estate. 
I'm reaching out because we have some exciting property opportunities that might interest you.
Are you currently looking to buy or invest in real estate in Dubai?
`;

    // Create a personalized greeting
    const prompt = `
You are an AI real estate agent making a cold call. Create a natural, professional greeting based on:

Campaign: ${context.campaignName}
Lead Name: ${context.fullName || 'Potential Client'}
Phone: ${context.phoneE164}
${context.email ? `Email: ${context.email}` : ''}
${context.notes ? `Notes: ${context.notes}` : ''}
${context.custom ? `Additional Info: ${JSON.stringify(context.custom)}` : ''}

Script Template: ${baseScript}

Requirements:
- Keep it conversational and natural (not robotic)
- Personalize using the lead's name if available
- Make it sound like a human real estate agent
- Keep it under 30 seconds when spoken
- Include a clear question to engage the prospect
- Be respectful and professional
- Don't mention this is an AI or automated call

Generate the opening message:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert real estate sales agent specializing in Dubai properties. Generate natural, engaging cold call openings that sound human and professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const agentMessage = completion.choices[0]?.message?.content || baseScript;
    
    // Process placeholders in the generated message
    return processScriptPlaceholders(agentMessage, {
      clientName: context.fullName || 'there',
      campaignName: context.campaignName,
      phoneNumber: context.phoneE164,
      email: context.email || '',
      notes: context.notes || '',
      ...context.custom,
    });

  } catch (error) {
    console.error('Error generating agent utterance:', error);
    
    // Fallback to basic script with placeholders
    const fallbackScript = context.scriptContent || `
Hello ${context.fullName || 'there'}, this is a call from Bayti Real Estate regarding our ${context.campaignName} campaign. 
We have some exceptional property opportunities in Dubai that might interest you. 
Are you currently looking to buy or invest in real estate?
`;
    
    return processScriptPlaceholders(fallbackScript, {
      clientName: context.fullName || 'there',
      campaignName: context.campaignName,
      phoneNumber: context.phoneE164,
      email: context.email || '',
      notes: context.notes || '',
      ...context.custom,
    });
  }
}

// Process script placeholders
export function processScriptPlaceholders(
  script: string,
  placeholders: Record<string, any>
): string {
  let processedScript = script;
  
  // Common placeholder patterns
  const patterns = {
    '{{clientName}}': placeholders.clientName || placeholders.fullName || 'there',
    '{{name}}': placeholders.clientName || placeholders.fullName || 'there',
    '{{campaignName}}': placeholders.campaignName || 'our campaign',
    '{{phoneNumber}}': placeholders.phoneNumber || placeholders.phoneE164 || '',
    '{{email}}': placeholders.email || '',
    '{{notes}}': placeholders.notes || '',
    '{{company}}': placeholders.company || 'Bayti Real Estate',
    '{{agentName}}': placeholders.agentName || 'the Bayti team',
  };
  
  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(patterns)) {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi');
    processedScript = processedScript.replace(regex, String(value));
  }
  
  // Handle custom placeholders from lead data
  for (const [key, value] of Object.entries(placeholders)) {
    if (typeof value === 'string' || typeof value === 'number') {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi');
      processedScript = processedScript.replace(regex, String(value));
    }
  }
  
  // Clean up any remaining unreplaced placeholders
  processedScript = processedScript.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up extra spaces and normalize
  return processedScript.replace(/\s+/g, ' ').trim();
}