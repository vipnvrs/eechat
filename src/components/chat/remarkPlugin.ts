import { visit } from 'unist-util-visit'
import { h } from 'hastscript'
// import {h} from 'vue'
import { toString } from 'mdast-util-to-string'

export default function remarkPlugin() {
  /**
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  return (tree: any) => {
    visit(tree, node => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if(node.name == 'tool_call'){
          const data = node.data || (node.data = {})
          const content = toString(node)
          console.log(`指令: ${node.name}`)
          // console.log(`内容: ${content}`)
          let toolInfo = { type: '', id: '', name: '', arguments: {} }
          
          try {
            const safeContent = content.replace(/\\/g, '\\\\')
            toolInfo = JSON.parse(safeContent)
          } catch (error) {
            // console.error('解析工具调用内容失败:', error)
            // console.error('工具调用内容:', content)
          }

          data.hName = 'div'
          data.hProperties = {
            className: 'tool-call-card my-2 border border-grey-900 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg overflow-hidden min-[500px]',
            'data-tool': toolInfo.name,
            'data-id': toolInfo.id
          }
          data.hChildren = [
            // 工具信息头部
            h('div', { class: 'flex space-x-4 items-center justify-between px-4 py-1 border-b border-blue-200 dark:border-blue-800' }, [
              h('div', { class: 'flex items-center gap-1' }, [
                h('span', { class: 'text-grey-600 dark:text-blue-400 font-mono text-sm font-bold' }, 
                  '🛠️ ' +  toolInfo.name.replace('mcp_', '')
                ),
                h('span', { class: 'text-gray-400 dark:text-gray-200' }, "("+toolInfo.type + ")"),
              ]),
              // 折叠按钮
              h('button', {
                class: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                onclick: 'this.parentElement.nextElementSibling.classList.toggle("hidden")'
              }, 'Detail')
            ]),
            // 可折叠的详细内容
            h('div', { class: 'hidden p-3 text-sm' }, [
              h('div', { class: 'font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto' }, 
                JSON.stringify(toolInfo)
              )
            ])
          ]
        }
      }
    })
  }
}
