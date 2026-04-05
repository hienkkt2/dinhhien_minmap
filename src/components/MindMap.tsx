import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapNode } from '../services/geminiService';
import { Plus, Trash2, Edit2, X, Check, Circle, Square, BoxSelect } from 'lucide-react';

interface MindMapProps {
  data: MindMapNode;
  onUpdate: (newData: MindMapNode) => void;
}

type NodeStyle = 'circle' | 'rect' | 'rounded';

const MindMap: React.FC<MindMapProps> = ({ data, onUpdate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [nodeStyle, setNodeStyle] = useState<NodeStyle>('rounded');

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 800;
    const height = 600;
    const margin = { top: 40, right: 160, bottom: 40, left: 160 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<MindMapNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const root = d3.hierarchy(data);
    tree(root);

    // Links
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

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .style("cursor", "grab")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
        setEditValue(d.data.label);
        setIsEditing(false);
      });

    // Drag behavior
    const drag = d3.drag<SVGGElement, d3.HierarchyPointNode<MindMapNode>>()
      .on("start", function() {
        d3.select(this).style("cursor", "grabbing");
      })
      .on("drag", function(event, d) {
        const dx = event.dx;
        const dy = event.dy;
        
        // Move the node and all its descendants for a more natural mind map feel
        d.descendants().forEach(node => {
          node.x += dy;
          node.y += dx;
        });
        
        // Update all node positions
        g.selectAll(".node")
          .attr("transform", (d: any) => `translate(${d.y},${d.x})`);
        
        // Update all links
        updateLinks();
      })
      .on("end", function() {
        d3.select(this).style("cursor", "grab");
      });

    node.call(drag as any);

    function updateLinks() {
      g.selectAll(".link")
        .attr("d", d3.linkHorizontal<any, any>()
          .x(d => d.y)
          .y(d => d.x) as any);
    }

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
      // Rect or Rounded with Text Wrapping
      node.each(function(d) {
        const el = d3.select(this);
        const maxWidth = 150; // Maximum width for a node
        const words = d.data.label.split(/\s+/);
        const lines: string[] = [];
        let currentLine: string[] = [];

        // Simple wrapping logic
        words.forEach(word => {
          currentLine.push(word);
          if (currentLine.join(" ").length * 7 > maxWidth) { // Rough estimate of width
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
        const rectWidth = bbox.width + paddingX * 2;
        const rectHeight = bbox.height + paddingY * 2;

        // Re-center text vertically based on its height
        text.attr("y", -bbox.height / 2 + 8);

        el.insert("rect", "text")
          .attr("x", -rectWidth / 2)
          .attr("y", -rectHeight / 2)
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .attr("rx", nodeStyle === 'rounded' ? 8 : 0)
          .attr("ry", nodeStyle === 'rounded' ? 8 : 0)
          .attr("fill", d.depth === 0 ? "#3b82f6" : "white")
          .attr("stroke", selectedNode?.id === d.data.id ? "#ef4444" : (d.depth === 0 ? "#2563eb" : "#e2e8f0"))
          .attr("stroke-width", selectedNode?.id === d.data.id ? 2 : 1)
          .attr("class", "shadow-sm");
      });
    }

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Click on background to deselect
    svg.on("click", () => {
      setSelectedNode(null);
      setIsEditing(false);
    });

  }, [data, selectedNode, nodeStyle]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Style Selector */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm self-start">
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

      <div className="w-full h-[600px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="w-full h-full"
        />
        
        {/* Floating Controls */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-xl shadow-xl border border-slate-200 flex flex-col gap-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 z-20">
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
