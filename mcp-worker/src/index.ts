import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { SupabaseAuthHandler } from "./supabase-auth-handler";

// Worker environment bindings
interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: any;
  FINDMYFLOW_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  COOKIE_ENCRYPTION_KEY: string;
}

// Props stored in the encrypted OAuth token — available as this.props in MCP tools
type Props = {
  userId: string;
  email: string;
  accessToken?: string;
};

// The Supabase MCP server URL we proxy tool calls to
const SUPABASE_MCP_URL =
  "https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/mcp-server";

export class VibeRiseMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "viberise",
    version: "1.1.0",
  });

  async init() {
    // Debug tool — remove after testing
    this.server.tool(
      "debug_env",
      "Debug: check what environment bindings are available",
      {},
      async () => {
        const hasApiKey = !!this.env.FINDMYFLOW_API_KEY;
        const hasProps = !!this.props;
        const hasAccessToken = !!this.props?.accessToken;
        const envKeys = Object.keys(this.env).filter(k => typeof (this.env as any)[k] === 'string' || typeof (this.env as any)[k] === 'object');
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              hasApiKey,
              apiKeyPrefix: hasApiKey ? this.env.FINDMYFLOW_API_KEY.substring(0, 10) + '...' : 'MISSING',
              hasProps,
              propsUserId: this.props?.userId || 'MISSING',
              propsEmail: this.props?.email || 'MISSING',
              hasAccessToken,
              accessTokenPrefix: hasAccessToken ? this.props!.accessToken!.substring(0, 15) + '...' : 'MISSING',
              envBindings: envKeys,
            }, null, 2)
          }]
        };
      }
    );

    // Proxy tool: get_interior_scoreboard
    this.server.tool(
      "get_interior_scoreboard",
      "Get the user's full self-knowledge state: scores, skills, quests, patterns. Call at session start.",
      {
        mode: z
          .enum(["light", "full"])
          .optional()
          .describe("Light (default) or full mode with evidence data"),
      },
      async ({ mode }) => {
        return this.proxyToSupabase("get_interior_scoreboard", { mode });
      }
    );

    // Proxy tool: commit_progress
    this.server.tool(
      "commit_progress",
      "Sync task progress from a session. Creates/completes tasks, awards RP and skill XP.",
      {
        entries: z.array(
          z.object({
            quest_id: z.string().optional(),
            create_quest: z
              .object({
                label: z.string(),
                career_id: z.string().nullable().optional(),
                predicted_state: z.enum([
                  "vibe_rise",
                  "fun",
                  "stress",
                  "boring",
                ]),
              })
              .optional(),
            task_text: z.string(),
            complete_existing_task_id: z.string().optional(),
            skill_tags: z.array(z.string()),
            state: z.enum(["vibe_rise", "fun", "stress", "boring"]),
            identity_statement: z.string().optional(),
            protective_voice: z
              .enum([
                "controller",
                "ghost",
                "perfectionist",
                "auto_pilot",
                "people_pleaser",
              ])
              .optional(),
            cross_quest_ids: z.array(z.string()).optional(),
          })
        ),
        set_context_mapping: z
          .object({
            context_type: z.enum([
              "claude_code_directory",
              "claude_desktop_project",
            ]),
            context_identifier: z.string(),
            quest_id: z.string(),
          })
          .optional(),
      },
      async (args) => {
        return this.proxyToSupabase("commit_progress", args);
      }
    );
  }

  // Proxy a tool call to the Supabase MCP server
  private async proxyToSupabase(
    toolName: string,
    args: Record<string, unknown>
  ) {
    // Try tokens in order: user's Supabase JWT → env secret → KV fallback
    let apiKeyFromKV: string | null = null;
    if (!this.env.FINDMYFLOW_API_KEY) {
      // Durable Objects may not receive Worker secrets — read from KV as fallback
      apiKeyFromKV = await this.env.OAUTH_KV.get("FINDMYFLOW_API_KEY");
    }
    const tokens = [
      this.props?.accessToken,
      this.env.FINDMYFLOW_API_KEY,
      apiKeyFromKV,
    ].filter(Boolean) as string[];

    if (tokens.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Server configuration error: no auth token available" }],
        isError: true,
      };
    }

    for (const token of tokens) {
      const response = await fetch(SUPABASE_MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: toolName, arguments: args },
        }),
      });

      // If auth failed (401), try next token
      if (response.status === 401 && tokens.indexOf(token) < tokens.length - 1) {
        continue;
      }

      const data: any = await response.json();

      if (data.result?.content) {
        return data.result;
      }

      // Check if it's an auth error and we have more tokens to try
      if (data.error && typeof data.error === 'object' && 'message' in data.error &&
          String(data.error.message).includes('auth') &&
          tokens.indexOf(token) < tokens.length - 1) {
        continue;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data.error || data, null, 2),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text" as const, text: "All auth tokens failed" }],
      isError: true,
    };
  }
}

export default new OAuthProvider({
  apiHandler: VibeRiseMCP.serve("/mcp"),
  apiRoute: "/mcp",
  defaultHandler: SupabaseAuthHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
