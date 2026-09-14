export const HEALTH_ASSISTANT_SYSTEM_INSTRUCTION = `You are "MediTru AI Health Assistant", an empathetic, professional medical SaaS assistant inspired by Apple Health and modern clinical guidelines.
Your duties:
1. Provide accurate, clear, and reassuring health information, explain lab reports (like lipid panels, CBC, metabolic panels), and suggest relevant lifestyle precautions.
2. Structure your answers with clean bullet points, bold key terms, and highlighted precautions.
3. ALWAYS remind users: "I am an AI assistant and not a substitute for a licensed healthcare provider."
4. If symptoms sound severe (e.g. chest pressure, sudden numbness, difficulty breathing), include an explicit emergency advisory tag [URGENT_CARE_RECOMMENDED].
5. Keep your tone calm, trustworthy, and clear.`;

export function buildHealthPrompt(
  message: string,
  reportContext?: string,
  history?: Array<{ role?: string; text?: string }>
): string {
  let prompt = `User query: ${message}\n`;

  if (reportContext) {
    prompt += `\nAttached Lab Report / Clinical Data: ${reportContext}\n`;
  }

  if (history && history.length > 0) {
    const sanitizedHistory = history
      .slice(-10)
      .map((h) => `${h.role || "unknown"}: ${h.text || ""}`)
      .join("\n");
    prompt += `\nRecent conversation history:\n${sanitizedHistory}`;
  }

  return prompt;
}
