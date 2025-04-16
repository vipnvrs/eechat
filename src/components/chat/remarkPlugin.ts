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
        console.log(`指令名称: ${node.name}`)
        if(node.name == 'tool_call'){
          const data = node.data || (node.data = {})
          const content = toString(node)
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
        // if (node.name == 'action') {
        //   const data = node.data || (node.data = {})
        //   const attributes = node.attributes || {}
        //   data.hName = node.name
        //   try {
        //     const content = toString(node)
        //     if (!content) return
        //     // console.log('获取到指令：', content);
        //     const dataAction = JSON.parse(content)
        //     // 在这里移除指令节点
        //     node.children = []
        //     data.hName = 'div'
        //     data.hProperties = {
        //       className: 'action_container',
        //       dataAction: JSON.stringify(dataAction),
        //     }
        //   } catch (error) {}
        // }
        // if (node.name == 'action-template') {
        //   const data = node.data || (node.data = {})
        //   try {
        //     const content = toString(node)
        //     const dataAction = JSON.parse(content)

        //     console.log(`指令名称: ${node.name}, 内容: ${content}`)

        //     // const templateState = useState('templateState', () => false)
        //     // templateState.value = true

        //     data.hProperties = {
        //       className: 'action_template resume-template-btn',
        //       dataAction: JSON.stringify(dataAction),
        //     }
        //     data.hChildren = [
        //       h(
        //         'div',
        //         { class: 'p-4 shadow-md bg-white rounded-lg border w-[300px]' },
        //         [
        //           h(
        //             'div',
        //             {
        //               class:
        //                 'card-body flex items-center justify-between space-x-4',
        //             },
        //             [
        //               h('div', { class: 'font-bold' }, '模板选择'),
        //               h(
        //                 'button',
        //                 {
        //                   class:
        //                     'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded p-2',
        //                   'data-action': JSON.stringify(dataAction),
        //                   onclick: `window.dispatchEvent(new CustomEvent("template-select", { detail: ${JSON.stringify(
        //                     dataAction,
        //                   )} }))`,
        //                 },
        //                 '选择模板',
        //               ),
        //             ],
        //           ),
        //         ],
        //       ),
        //     ]
        //   } catch (error) {}
        // }
      }
    })
  }
}
