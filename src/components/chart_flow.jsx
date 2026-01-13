import {
    useState,
    useCallback,
    useRef,
    forwardRef, useImperativeHandle, useEffect
} from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from "../nodes/node_types";
import * as Util from "../helpers/util"


export const ChartFlow = forwardRef((props, ref) => {
    const { initialNodes, initialEdges, onCreateRipple, onUpdate, onNodeClick, showToast } = props;

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { screenToFlowPosition, fitView } = useReactFlow();
    const reactFlowWrapper = useRef(null);

    useImperativeHandle(ref, () => ({
        setChartData: (data) => {
            const { nodes, edges } = data
            setNodes(nodes)
            setEdges(edges)
        }
    }))

    useEffect(() => {
        if ( onUpdate === undefined || onUpdate === null ) {
            return
        }

        onUpdate(nodes, edges)
    }, [nodes, edges]);

    const onConnect = useCallback(
            (params) => setEdges((eds) => addEdge(params, eds)),
            [],
    );

    const onConnectEnd = (event, connectionState) => {
            // when a connection is dropped on the pane it's not valid
            if (!connectionState.isValid) {
                // we need to remove the wrapper bounds, in order to get the correct position
                const id = `${nodes.length + 1}`
                const { clientX, clientY } =
                        'changedTouches' in event ? event.changedTouches[0] : event;
                const newNode = {
                    id,
                    position: screenToFlowPosition({
                        x: clientX,
                        y: clientY,
                    }),
                    type: 'generic',
                    data: {
                        title: `Place holder ripple ${id}`,
                        inputs: ['input'],
                        outputs: ['output'],
                    },
                }

                const edge = {
                    id: `${id}-${connectionState.fromNode.id}`,
                    source: connectionState.fromNode.id,
                    target: id,
                    animated: true,
                }
                console.log(newNode, connectionState, edge, nodes, edges)

                setNodes((nds) => nds.concat(newNode))
                setEdges((eds) => eds.concat(edge))
                onCreateRipple( connectionState.fromNode.id, id, newNode.position )
            }
        }

    const onLayout = (direction) => {
        //console.log(nodes);
        const layouted = Util.getLayoutedElements(nodes, edges, { direction });

        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);

        fitView();
    }

    return (
        <div className="h-96" ref={reactFlowWrapper}>
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnectEnd={onConnectEnd}
                onNodeClick={(e, node) => onNodeClick( node, e.shiftKey )}
                fitView
            >
                <Background />
                <Controls />
                <Panel position="top-right">
                    <button
                        type="button"
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
                        onClick={() => onLayout('LR')}>Auto Layout</button>
                </Panel>
            </ReactFlow>
        </div>
    );
})