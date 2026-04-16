import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapNode } from '../services/geminiService';
import { Plus, Trash2, Edit2, X, Check, Circle, Square, BoxSelect, ChevronDown, ChevronRight, Maximize2, RefreshCw } from 'lucide-react';

interface MindMapProps {
  data: MindMapNode;
  onUpdate: (newData: MindMapNode) => void;
}

type NodeStyle = 'circle' | 'rect' | 'rounded';

const MindMap: React.FC<MindMapProps> = ({ data, onUpdate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [selectedNodePos, setSelectedNodePos] = useState<{ x: number, y: number } | null>(null);
  const [currentTransform, setCurrentTransform] = useState(d3.zoomIdentity);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [nodeStyle, setNodeStyle] = useState<NodeStyle>('rounded');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Log data for debugging
  useEffect(() => {
    console.log("MindMap Data:", data);
    if (!data) {
      console.warn("MindMap received null or undefined data");
    }
  }, [data]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    try {
      const width = 800;
      const height = 600;
      const margin = { top: 40, right: 200, bottom: 40, left: 200 };

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Use nodeSize instead of size for more consistent spacing in deep hierarchies
      const tree = d3.tree<MindMapNode>().nodeSize([60, 250]);

      // Create hierarchy and handle collapsing
      const root = d3.hierarchy(data);
    
    // Function to recursively hide children if parent is collapsed
    const applyCollapse = (d: d3.HierarchyNode<MindMapNode>) => {
      if (collapsedIds.has(d.data.id)) {
        (d as any)._children = d.children;
        d.children = undefined;
      } else if ((d as any)._children) {
        d.children = (d as any)._children;
        (d as any)._children = undefined;
      }
      if (d.children) {
        d.children.forEach(applyCollapse);
      }
    };
    
    applyCollapse(root);
    tree(root);

    // 1. Links
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x) as any);

    // 2. Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("cursor", "grab")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
        setSelectedNodePos({ x: d.x, y: d.y });
        setEditValue(d.data.label);
        setIsEditing(false);
      });

    // 3. Style-specific rendering
    if (nodeStyle === 'circle') {
      node.append("circle")
        .attr("r", 10)
        .attr("fill", d => d.children ? "#3b82f6" : "#10b981")
        .attr("stroke", d => selectedNode?.id === d.data.id ? "#ef4444" : "white")
        .attr("stroke-width", 2);

      node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -15 : 15)
        .style("text-anchor", d => d.children ? "end" : "start")
        .attr("font-size", "12px")
        .attr("font-weight", d => d.depth === 0 ? "bold" : "500")
        .attr("fill", "#1e293b")
        .text(d => d.data.label)
        .clone(true).lower()
        .attr("stroke", "white")
        .attr("stroke-width", 3);
    } else {
      node.each(function(d) {
        const el = d3.select(this);
        const label = d.data.label || "Không có nhãn";
        const maxWidth = 150;
        const words = label.split(/\s+/);
        const lines: string[] = [];
        let currentLine: string[] = [];

        words.forEach(word => {
          currentLine.push(word);
          if (currentLine.join(" ").length * 6 > maxWidth) {
            if (currentLine.length > 1) {
              const lastWord = currentLine.pop();
              lines.push(currentLine.join(" "));
              currentLine = [lastWord!];
            } else {
              lines.push(currentLine.join(" "));
              currentLine = [];
            }
          }
        });
        if (currentLine.length > 0) lines.push(currentLine.join(" "));

        const rect = el.append("rect");
        const text = el.append("text")
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", d.depth === 0 ? "bold" : "500")
          .attr("fill", d.depth === 0 ? "white" : "#1e293b");

        lines.forEach((line, i) => {
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? 0 : "1.2em")
            .text(line);
        });

        const bbox = (text.node() as SVGTextElement).getBBox();
        const paddingX = 12;
        const paddingY = 8;
        const rectWidth = Math.max(bbox.width + paddingX * 2, 40);
        const rectHeight = Math.max(bbox.height + paddingY * 2, 30);

        text.attr("y", -bbox.height / 2 + 8);

        rect
          .attr("x", -rectWidth / 2)
          .attr("y", -rectHeight / 2)
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .attr("rx", nodeStyle === 'rounded' ? 8 : 0)
          .attr("ry", nodeStyle === 'rounded' ? 8 : 0)
          .attr("fill", d.depth === 0 ? "#3b82f6" : "white")
          .attr("stroke", selectedNode?.id === d.data.id ? "#ef4444" : (d.depth === 0 ? "#2563eb" : "#e2e8f0"))
          .attr("stroke-width", selectedNode?.id === d.data.id ? 2 : 1);
      });
    }

    function updateLinks() {
      g.selectAll(".link")
        .attr("d", d3.linkHorizontal<any, any>()
          .x(d => d.y)
          .y(d => d.x) as any);
    }

    // 4. Drag behavior
    const drag = d3.drag<SVGGElement, d3.HierarchyPointNode<MindMapNode>>()
      .on("start", function() {
        d3.select(this).style("cursor", "grabbing");
      })
      .on("drag", function(event, d) {
        const dx = event.dx;
        const dy = event.dy;
        d.descendants().forEach(node => {
          node.x += dy;
          node.y += dx;
        });
        g.selectAll(".node").attr("transform", (d: any) => `translate(${d.y},${d.x})`);
        updateLinks();
        
        // Update selected node position if it's being dragged
        setSelectedNodePos(prev => {
          if (prev && selectedNode?.id === d.data.id) {
            return { x: d.x, y: d.y };
          }
          return prev;
        });
      })
      .on("end", function() {
        d3.select(this).style("cursor", "grab");
      });

    node.call(drag as any);

    // 5. Collapse/Expand Toggle
    node.each(function(d) {
      const hasChildren = (d.data.children && d.data.children.length > 0) || (d as any)._children;
      if (!hasChildren) return;

      const el = d3.select(this);
      const isCollapsed = collapsedIds.has(d.data.id);
      
      const toggleG = el.append("g")
        .attr("class", "collapse-toggle")
        .attr("transform", `translate(0, 25)`)
        .style("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation();
          toggleCollapse(d.data.id);
        });

      toggleG.append("circle")
        .attr("r", 8)
        .attr("fill", isCollapsed ? "#3b82f6" : "#f1f5f9")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1);

      toggleG.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", isCollapsed ? "white" : "#3b82f6")
        .text(isCollapsed ? "+" : "-");
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentTransform(event.transform);
      });

    svg.call(zoom as any);

    // Initialize zoom to match initial transform
    const initialTransform = d3.zoomIdentity.translate(150, 300).scale(0.8);
    svg.call(zoom.transform as any, initialTransform);
    setCurrentTransform(initialTransform);

    // Click on background to deselect
    svg.on("click", () => {
      setSelectedNode(null);
      setSelectedNodePos(null);
      setIsEditing(false);
    });

      return () => {
        svg.on(".zoom", null);
        svg.on("click", null);
      };
    } catch (error) {
      console.error("D3 Rendering Error:", error);
    }
  }, [data, selectedNode, nodeStyle, collapsedIds]);

  const handleCenterView = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        d3.select(svgRef.current).select("g").attr("transform", event.transform);
        setCurrentTransform(event.transform);
      });
    
    const initialTransform = d3.zoomIdentity.translate(160, 300).scale(0.8);
    svg.transition().duration(750).call(zoom.transform as any, initialTransform);
    setCurrentTransform(initialTransform);
  };

  const updateNodeInTree = (root: MindMapNode, targetId: string, updater: (node: MindMapNode) => MindMapNode | null): MindMapNode | null => {
    if (root.id === targetId) {
      return updater(root);
    }
    if (root.children) {
      const newChildren = root.children
        .map(child => updateNodeInTree(child, targetId, updater))
        .filter((child): child is MindMapNode => child !== null);
      return { ...root, children: newChildren };
    }
    return root;
  };

  const handleSaveEdit = () => {
    if (!selectedNode) return;
    const newData = updateNodeInTree(data, selectedNode.id, (node) => ({ ...node, label: editValue }));
    if (newData) onUpdate(newData);
    setIsEditing(false);
    setSelectedNode(null);
  };

  const handleAddChild = () => {
    if (!selectedNode) return;
    const newNode: MindMapNode = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Ý tưởng mới',
      children: []
    };
    const newData = updateNodeInTree(data, selectedNode.id, (node) => ({
      ...node,
      children: [...(node.children || []), newNode]
    }));
    if (newData) onUpdate(newData);
    setSelectedNode(newNode);
    setEditValue('Ý tưởng mới');
    setIsEditing(true);
  };

  const handleDeleteNode = () => {
    if (!selectedNode || selectedNode.id === data.id) {
      alert("Không thể xóa nút gốc!");
      return;
    }
    const newData = updateNodeInTree(data, selectedNode.id, () => null);
    if (newData) onUpdate(newData);
    setSelectedNode(null);
  };

  const getMenuPosition = () => {
    if (!selectedNodePos || !currentTransform) return { display: 'none' };
    
    // Apply D3 zoom transform to node coordinates
    // d.y is horizontal, d.x is vertical in our tree layout
    const [x, y] = currentTransform.apply([selectedNodePos.y, selectedNodePos.x]);
    
    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(40px, -50%)', // Offset to the right of the node
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Style Selector & Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start">
        <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
          <span className="text-xs font-semibold text-slate-400 px-2 uppercase tracking-wider">Hình khối:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setNodeStyle('circle')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium ${
                nodeStyle === 'circle' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Circle className="w-4 h-4" /> Tròn
            </button>
            <button
              onClick={() => setNodeStyle('rect')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium ${
                nodeStyle === 'rect' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Square className="w-4 h-4" /> Vuông
            </button>
            <button
              onClick={() => setNodeStyle('rounded')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium ${
                nodeStyle === 'rounded' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <BoxSelect className="w-4 h-4" /> Bo góc
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCenterView}
            className="p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
            title="Căn giữa sơ đồ"
          >
            <Maximize2 className="w-4 h-4" /> Căn giữa
          </button>
        </div>
      </div>

      <div className="w-full h-[600px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="w-full h-full"
        />
        
        {/* Floating Controls */}
        {selectedNode && (
          <div 
            className="absolute bg-white p-3 rounded-xl shadow-2xl border border-blue-100 flex flex-col gap-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-200 z-30"
            style={getMenuPosition() as React.CSSProperties}
          >
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-700"
                  >
                    <Check className="w-3 h-3" /> Lưu
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Đang chọn:</div>
                <div className="text-sm font-medium text-slate-900 mb-2 truncate">{selectedNode.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-[10px]"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" /> Sửa
                  </button>
                  <button
                    onClick={handleAddChild}
                    className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors text-[10px]"
                    title="Thêm con"
                  >
                    <Plus className="w-4 h-4" /> Thêm
                  </button>
                  <button
                    onClick={handleDeleteNode}
                    className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-[10px]"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute -top-2 -left-2 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-100">
          Click vào nút để chọn • Kéo để di chuyển • Cuộn để zoom
        </div>
      </div>
    </div>
  );
};

export default MindMap;
