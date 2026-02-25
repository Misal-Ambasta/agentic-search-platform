import { chatCompletion } from './llm.service.js';

export async function generatePlan(task: string): Promise<string[]> {
  // Ask the LLM to produce a short list of actionable steps.
  try {
    const prompt = `Break the following user request into a short numbered list of actionable steps (3-8 items): ${task}`;
    const reply = await chatCompletion([
      { role: 'system', content: 'You are a helpful planner that outputs a numbered list.' },
      { role: 'user', content: prompt },
    ]);

    // Simple parser: split by newlines and strip numbering.
    const lines = reply.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const steps = lines.map((l) => l.replace(/^\d+\.|^-\s*/i, '').trim());
    if (steps.length === 0) {
      return [task];
    }
    return steps;
  } catch (e) {
    // Fallback: naive split by sentence
    return task.split(/[.?!]\s+/).map(s => s.trim()).filter(Boolean).slice(0,5);
  }
}
