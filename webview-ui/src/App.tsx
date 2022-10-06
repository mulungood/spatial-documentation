import React, { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowProvider,
  XYPosition,
} from 'react-flow-renderer'
import { FileNode } from './FileNode'

import Sidebar from './Sidebar'
import { FileInfo, useStore } from './store'

const nodeTypes: NodeTypes = { file: FileNode as any }

const DnDFlow = () => {
  const { files, editFile, setReactFlowInstance, reactFlowInstance } =
    useStore()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<FileInfo['fileId'] | null>(null)

  const onNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          editFile({ fileId: change.id, position: undefined })
        } else if (change.type === 'position' && change.position) {
          editFile({ fileId: change.id, position: change.position })
        } else if (change.type === 'select') {
          setSelection(change.selected ? change.id : null)
        }
      }
    },
    [editFile, setSelection],
  )

  const onEdgesChange = useCallback<OnEdgesChange>((changes) => {
    console.log({ edgeChanges: changes })
  }, [])

  const nodes = useMemo<Node<FileInfo>[]>(
    () =>
      files
        .filter((file) => file.position)
        .map((file) => ({
          id: file.fileId,
          position: file.position as XYPosition,
          data: file,
          type: 'file',
          selected: selection === file.fileId,
        })),
    [files, selection],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!reactFlowWrapper?.current || !reactFlowInstance) {
        return
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const fileId = event.dataTransfer.getData('application/reactflow')

      // check if the dropped element is valid
      if (typeof fileId === 'undefined' || !fileId) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      editFile({
        fileId,
        position,
      })
    },
    [reactFlowInstance],
  )

  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            // edges={edges}
            edges={[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            nodeTypes={nodeTypes}
            // Read-only connections
            nodesConnectable={false}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <Sidebar />
      </ReactFlowProvider>
    </div>
  )
}

export default DnDFlow