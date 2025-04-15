// import { Anthropic } from "@anthropic-ai/sdk";
// import {
//   MessageParam,
//   Tool,
// } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from 'path'
import { app } from 'electron'
import log, { McpLog } from '../utils/logger'  // 导入共享的日志模块

dotenv.config();

const OPENAI_API_KEY = 'sk-c61a217bfb0d4ea0aa8ea83522b2509c'
const OPENAI_BASE_URL ='https://api.deepseek.com/v1'

class MCPClient {
  private mcp: Client;
  private openai: OpenAI;
  private transport: StdioClientTransport | null = null;
  private tools: any[] = [];

  constructor() {
    this.openai = new OpenAI({
      baseURL: OPENAI_BASE_URL,
      apiKey: OPENAI_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  // methods will go here
  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;
      
      this.transport = new StdioClientTransport({
        // command,
        command: 'node',
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);
      
      const toolsResult = await this.mcp.listTools();
      McpLog.info("Listed tools: ", toolsResult);
      this.tools = toolsResult.tools.map((tool) => {
        return {
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          }
        };
      });
      log.info(
        "Connected to server with tools:",
        this.tools.map(({ function: { name } }) => name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query: string) {
    const messages = [
      {
        role: "user",
        content: query,
      },
    ];
  
    const response = await this.openai.chat.completions.create({
      messages,
      model: "deepseek-chat",
      tools: this.tools,
      tool_choice: "auto",
    });
  
    const finalText = [];
    const toolResults = [];
    
    const responseMessage = response.choices[0].message;
    
    if (responseMessage.content) {
      finalText.push(responseMessage.content);
    }
    
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });
        
        toolResults.push(result);
        finalText.push(
          `[Calling tool ${toolName} with args ${toolCall.function.arguments}]`
        );
        
        messages.push(responseMessage);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(result.content),
        });
        
        const followUpResponse = await this.openai.chat.completions.create({
          model: "deepseek-chat",
          messages,
        });
        
        if (followUpResponse.choices[0].message.content) {
          finalText.push(followUpResponse.choices[0].message.content);
        }
      }
    }
  
    return finalText.join("\n");
  }

  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");
  
      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }
  
  async cleanup() {
    await this.mcp.close();
  }
}


export async function initClient() {
  // if (process.argv.length < 3) {
  //   console.log("Usage: node index.ts <path_to_server_script>");
  //   return;
  // }
  const mcpClient = new MCPClient();
  const serverScriptPath = path.join(app.getAppPath(), 'electron', 'main', 'mcp', 'server.js')
  try {
    McpLog.info("Connecting to MCP server...");
    await mcpClient.connectToServer(serverScriptPath);
    await mcpClient.chatLoop();
  } catch (e) {
    McpLog.error("Failed to connect to MCP server: ", e);
    // d 
  }
  finally {
    McpLog.info("Closing MCP client...");
    await mcpClient.cleanup();
    process.exit(0);
  }
}