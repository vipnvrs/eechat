import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({
  command: 'node',
  args: ['server.js'],
})

const client = new Client({
  name: 'example-client',
  version: '1.0.0',
})

export const initClient = async () => {
  await client.connect(transport)

  // List prompts
  const prompts = await client.listPrompts()
  console.log('listPrompts:', prompts)

  // Get a prompt
  const prompt = await client.getPrompt({
    name: 'example-prompt',
    arguments: {
      arg1: 'value',
    },
  })
  console.log('getPrompt:', prompt)

  // List resources
  const resources = await client.listResources()
  console.log('listResources:', resources)

  // Read a resource
  const resource = await client.readResource({
    uri: 'file:///example.txt',
  })
  console.log('readResource:', resource)

  // Call a tool
  const result = await client.callTool({
    name: 'example-tool',
    arguments: {
      arg1: 'value',
    },
  })
  console.log('callTool:', result)
}
