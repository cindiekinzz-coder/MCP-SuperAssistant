/**
 * Gremy Discord Bridge — instruction generator (KISS, Discord-only).
 *
 * Produces the prompt that gets pasted into the AI chat when the user clicks
 * "Insert". Strips everything that doesn't matter to Discord, keeps one format
 * (JSONL), one purpose (Discord hands).
 */

import { createLogger } from '@extension/shared/lib/logger';

const logger = createLogger('GremyInstructionGenerator');

export const generateInstructionsJson = (
  tools: Array<{ name: string; schema: string; description: string }>,
  customInstructions?: string,
  customInstructionsEnabled?: boolean,
): string => {
  if (!tools || tools.length === 0) {
    return '# Bridge offline\n\nThe Gremy Discord Bridge can\'t see any tools — start `mcp-discord` first, then reload this page.';
  }

  let instructions = `[Gremy Discord Bridge — start of system]

You have hands. There is a local Discord bridge attached to this conversation
that gives you direct access to a Discord bot via the discord_* tools listed
below. You can read, send, react, and manage channels — in real Discord
servers, in real time.

# How tool calls work

A DOM observer in the user's browser reads your reply, spots a \`jsonl\` code
block in the format below, runs the tool against the local mcp-discord server,
and pastes the function_results back into the chat as the next message. You
then continue with the result in hand.

# Format — one call per reply

Always emit calls inside a fenced \`jsonl\` block, exactly this shape:

\`\`\`jsonl
{"type": "function_call_start", "name": "TOOL_NAME", "call_id": 1}
{"type": "description", "text": "Short one-line of why"}
{"type": "parameter", "key": "param_name", "value": "param_value"}
{"type": "function_call_end", "call_id": 1}
\`\`\`

call_id is a per-conversation counter starting at 1, increment for each call.

# Rules

1. ONE jsonl block per reply, then STOP and wait for the result.
2. NEVER fabricate function_results — they will be supplied to you.
3. NEVER invent tool names. Only use the discord_* tools listed below.
4. If a parameter you need is missing (e.g. channelId), call a discovery tool
   first (\`discord_list_servers\`, \`discord_get_server_info\`) OR ask the user.
5. DO NOT use Python tool-code style (\`print(...)\`) — only the JSONL format
   above is parsed. Python-style emissions will silently fail.
6. DO NOT use Canvas mode — it hides output from the observer.
7. Don't say "here is what to paste" or "you can post this to Discord" — you
   have the tool, use it. You are not a copywriter handing the user a draft.

# Discord workflow

If you don't already know a server or channel ID:

1. \`discord_list_servers\` — returns every server the bot can see, with IDs.
2. \`discord_get_server_info\` with that guildId — returns channels + their IDs.
3. Then use the channel ID with \`discord_send\`, \`discord_read_messages\`, etc.

If the user names a server or channel ("the Nest", "#general", "Digital
Haven"), look it up via discovery before guessing — the bot may be in many
servers with similar names.

# Example — send

User: "Post 'morning' to the #general channel."

\`\`\`jsonl
{"type": "function_call_start", "name": "discord_send", "call_id": 1}
{"type": "description", "text": "Post morning to #general"}
{"type": "parameter", "key": "channelId", "value": "123456789012345678"}
{"type": "parameter", "key": "message", "value": "morning"}
{"type": "function_call_end", "call_id": 1}
\`\`\`

# Example — read

User: "What's been said in #general lately?"

\`\`\`jsonl
{"type": "function_call_start", "name": "discord_read_messages", "call_id": 1}
{"type": "description", "text": "Read last 20 messages from #general"}
{"type": "parameter", "key": "channelId", "value": "123456789012345678"}
{"type": "parameter", "key": "limit", "value": 20}
{"type": "function_call_end", "call_id": 1}
\`\`\`

# Identity

You are who you have always been in this conversation — your own persona, your
own voice. The bridge does not change you. It only gives you Discord hands.

[Gremy Discord Bridge — end of system]

## Available Discord tools

`;

  tools.forEach(tool => {
    instructions += `\n### ${tool.name}\n`;
    if (tool.description) {
      instructions += `${tool.description}\n`;
    }

    try {
      const schema = JSON.parse(tool.schema);
      if (schema.properties && Object.keys(schema.properties).length > 0) {
        instructions += '\n**Parameters:**\n';
        const requiredParams: string[] = Array.isArray(schema.required) ? schema.required : [];
        Object.entries(schema.properties).forEach(([paramName, paramDetails]: [string, any]) => {
          const isRequired = requiredParams.includes(paramName);
          const desc = paramDetails.description ? ` — ${paramDetails.description}` : '';
          const type = paramDetails.type || 'any';
          instructions += `- \`${paramName}\` (${type}, ${isRequired ? 'required' : 'optional'})${desc}\n`;
        });
      }
    } catch (err) {
      logger.warn(`Couldn't parse schema for ${tool.name}`, err);
    }
  });

  if (customInstructionsEnabled && customInstructions) {
    instructions += `\n## User custom instructions\n\n${customInstructions}\n`;
  }

  return instructions;
};
