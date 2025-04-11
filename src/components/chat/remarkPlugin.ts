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
        if (node.name == 'action') {
          const data = node.data || (node.data = {})
          const attributes = node.attributes || {}
          data.hName = node.name
          try {
            const content = toString(node)
            if (!content) return
            // console.log('获取到指令：', content);
            const dataAction = JSON.parse(content)
            // 在这里移除指令节点
            node.children = []
            data.hName = 'div'
            data.hProperties = {
              className: 'action_container',
              dataAction: JSON.stringify(dataAction),
            }
          } catch (error) {}
        }
        if (node.name == 'action-template') {
          const data = node.data || (node.data = {})
          try {
            const content = toString(node)
            const dataAction = JSON.parse(content)

            console.log(`指令名称: ${node.name}, 内容: ${content}`)

            // const templateState = useState('templateState', () => false)
            // templateState.value = true

            data.hProperties = {
              className: 'action_template resume-template-btn',
              dataAction: JSON.stringify(dataAction),
            }
            data.hChildren = [
              h(
                'div',
                { class: 'p-4 shadow-md bg-white rounded-lg border w-[300px]' },
                [
                  h(
                    'div',
                    {
                      class:
                        'card-body flex items-center justify-between space-x-4',
                    },
                    [
                      h('div', { class: 'font-bold' }, '模板选择'),
                      h(
                        'button',
                        {
                          class:
                            'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded p-2',
                          'data-action': JSON.stringify(dataAction),
                          onclick: `window.dispatchEvent(new CustomEvent("template-select", { detail: ${JSON.stringify(
                            dataAction,
                          )} }))`,
                        },
                        '选择模板',
                      ),
                    ],
                  ),
                ],
              ),
            ]
          } catch (error) {}
        }
      }
    })
  }
}
