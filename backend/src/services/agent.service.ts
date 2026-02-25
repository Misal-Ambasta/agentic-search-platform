import { v4 as uuidv4 } from 'uuid';
import type { Session, ToolResult } from '../types/index.js';
import { createSession, updateSession } from '../db/sessionStore.js';
import { generatePlan } from './planner.service.js';
import { executeTool } from './tool.service.js';
import { chatCompletion } from './llm.service.js';
import { AGENT_SYSTEM_PROMPT, SYNTHESIZER_SYSTEM_PROMPT } from '../config/prompts.js';
import { normalizeCitations } from './citation.service.js';

export async function startAgent(task: string): Promise<Session> {
  const id = uuidv4();
  const plan = await generatePlan(task);

  const session: Session = {
    id,
    task,
    plan,
    history: [],
    observations: [],
    status: 'pending',
  };

  createSession(session);

  // Run loop asynchronously
  runLoop(session).catch((err) => {
    console.error('Agent loop error', err);
    updateSession(id, { status: 'error', result: String(err) });
  });

  return session;
}

async function runLoop(session: Session) {
  updateSession(session.id, { status: 'running' });

  const MAX_STEPS = 10;
  let stepCount = 0;

  // Process plan steps, but also allow the agent to iterate based on findings
  while (stepCount < MAX_STEPS) {
    const currentGoal = session.plan[stepCount] || "Continue investigating the main task";
    
    const toolChoicePrompt = `User Task: "${session.task}"
Current Goal: "${currentGoal}"
History: ${session.history.slice(-5).join(' | ')}
What should I do next?`;

    const responseText = await chatCompletion([
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      { role: 'user', content: toolChoicePrompt },
    ]);

    let toolData;
    try {
      // Clean up potential markdown formatting in response
      const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
      toolData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse tool JSON:', responseText);
      // Fallback
      if (responseText.toLowerCase().includes('finish')) {
        toolData = { action: 'finish', arguments: {} };
      } else {
        toolData = { action: 'web_search', arguments: { query: currentGoal } };
      }
    }

    if (toolData.action === 'finish') break;

    try {
      const result: ToolResult = await executeTool(toolData.action, toolData.arguments);
      session.history.push(`Step ${stepCount + 1}: ${currentGoal} -> Action: ${toolData.action}`);
      session.observations.push(result);
      updateSession(session.id, { history: session.history, observations: session.observations });
    } catch (error) {
      console.error(`Tool ${toolData.action} failed:`, error);
      session.history.push(`Step ${stepCount + 1} FAILED: ${String(error)}`);
      updateSession(session.id, { history: session.history });
    }

    stepCount++;
  }

  // Synthesize final answer using the LLM
  const synthPrompt = `User Query: ${session.task}

Observations:
${session.observations.map(o => `[Tool: ${o.tool}] Output: ${o.output}`).join('\n\n') }

Synthesize the findings into a final response. Cite sources using [1], [2], etc.`;

  const rawFinal = await chatCompletion([
    { role: 'system', content: SYNTHESIZER_SYSTEM_PROMPT },
    { role: 'user', content: synthPrompt },
  ]);

  // Normalize Citations
  const { text: finalizedResult } = normalizeCitations(rawFinal, session.observations);

  updateSession(session.id, { status: 'finished', result: finalizedResult });
}
