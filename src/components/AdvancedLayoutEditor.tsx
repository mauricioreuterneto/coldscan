import React, { useState, useRef, useCallback } from 'react';
import { Compartment, Shelf } from '../types';
import { advancedLayoutService, AdvancedLayoutConfig, FridgeType, CompartmentTemplate } from '../services/advancedLayoutService';
import { 
  Move, 
  Plus, 
  Trash2, 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  RotateCw,
  Ruler,
  Package,
  Thermometer,
  Droplets
} from 'lucide-react';

interface AdvancedLayoutEditorProps {
  initialLayout: AdvancedLayoutConfig;
  onLayoutChange: (layout: AdvancedLayoutConfig) => void;
  onSave: (layout: AdvancedLayoutConfig) => void;
  onCancel: () => void;
}

interface DragItem {
  compartment: Compartment;
  offsetX: number;
  offsetY: number;
}

export const AdvancedLayoutEditor: React.FC<AdvancedLayoutEditorProps> = ({
  initialLayout,
  onLayoutChange,
  onSave,
  onCancel
}) => {
  const [layout, setLayout] = useState<AdvancedLayoutConfig>(initialLayout);
  const [selectedCompartment, setSelectedCompartment] = useState<Compartment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [scale, setScale] = useState(1);
  const [isAddingCompartment, setIsAddingCompartment] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; issues: string[]; warnings: string[] }>({
    isValid: true,
    issues: [],
    warnings: []
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });

  // Atualizar layout quando mudar
  React.useEffect(() => {
    onLayoutChange(layout);
    const validation = advancedLayoutService.validateLayout(layout);
    setValidation(validation);
  }, [layout, onLayoutChange]);

  // Funções de drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent, compartment: Compartment) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - (compartment.position.x * scale);
    const offsetY = e.clientY - rect.top - (compartment.position.y * scale);

    setDragItem({ compartment, offsetX, offsetY });
    setIsDragging(true);
    setSelectedCompartment(compartment);
    e.preventDefault();
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min((e.clientX - rect.left - dragItem.offsetX) / scale, canvasSize.width - 50));
    const newY = Math.max(0, Math.min((e.clientY - rect.top - dragItem.offsetY) / scale, canvasSize.height - 50));

    const updatedCompartments = layout.customCompartments.map(comp => 
      comp.id === dragItem.compartment.id 
        ? { ...comp, position: { ...comp.position, x: newX, y: newY } }
        : comp
    );

    setLayout({ ...layout, customCompartments: updatedCompartments });
  }, [isDragging, dragItem, canvasSize, scale, layout]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragItem(null);
  }, []);

  // Adicionar compartimento
  const addCompartment = (template: CompartmentTemplate) => {
    const newCompartment: Compartment = {
      id: `compartment-${Date.now()}`,
      name: template.name,
      type: template.type as any,
      capacity: template.typicalCapacity.min,
      position: { x: 50, y: 50, width: 100, height: 80 },
      shelves: template.shelfTypes.map((shelf, index) => ({
        id: `shelf-${Date.now()}-${index}`,
        name: `${template.name} - Prateleira ${index + 1}`,
        position: index + 1,
        capacity: Math.floor(template.typicalCapacity.min / template.shelfTypes.length)
      }))
    };

    setLayout({
      ...layout,
      customCompartments: [...layout.customCompartments, newCompartment]
    });
    setIsAddingCompartment(false);
  };

  // Remover compartimento
  const removeCompartment = (compartmentId: string) => {
    setLayout({
      ...layout,
      customCompartments: layout.customCompartments.filter(c => c.id !== compartmentId)
    });
    setSelectedCompartment(null);
  };

  // Duplicar compartimento
  const duplicateCompartment = (compartment: Compartment) => {
    const newCompartment: Compartment = {
      ...compartment,
      id: `compartment-${Date.now()}`,
      name: `${compartment.name} (cópia)`,
      position: {
        ...compartment.position,
        x: compartment.position.x + 20,
        y: compartment.position.y + 20
      },
      shelves: (compartment.shelves || []).map(shelf => ({
        ...shelf,
        id: `shelf-${Date.now()}-${shelf.id}`
      }))
    };

    setLayout({
      ...layout,
      customCompartments: [...layout.customCompartments, newCompartment]
    });
  };

  // Editar propriedades do compartimento
  const updateCompartment = (compartmentId: string, updates: Partial<Compartment>) => {
    const updatedCompartments = layout.customCompartments.map(comp =>
      comp.id === compartmentId ? { ...comp, ...updates } : comp
    );

    setLayout({ ...layout, customCompartments: updatedCompartments });
  };

  // Adicionar/editar prateleira
  const updateShelf = (compartmentId: string, shelfId: string, updates: Partial<Shelf>) => {
    const updatedCompartments = layout.customCompartments.map(comp => {
      if (comp.id === compartmentId) {
        const updatedShelves = comp.shelves?.map(shelf =>
          shelf.id === shelfId ? { ...shelf, ...updates } : shelf
        ) || [];
        return { ...comp, shelves: updatedShelves };
      }
      return comp;
    });

    setLayout({ ...layout, customCompartments: updatedCompartments });
  };

  // Renderização do canvas
  const renderCanvas = () => (
    <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Mostrar/ocultar grade"
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-2 rounded ${showDimensions ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            title="Mostrar/ocultar dimensões"
          >
            <Package className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-20"
            />
            <span>{Math.round(scale * 100)}%</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {layout.customCompartments.length} compartimentos
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="relative bg-white m-4 border-2 border-gray-300 rounded cursor-move"
        style={{ 
          width: canvasSize.width, 
          height: canvasSize.height,
          backgroundImage: showGrid ? 'repeating-linear-gradient(0deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #f0f0f0, #f0f0f0 1px, transparent 1px, transparent 20px)' : 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {layout.customCompartments.map((compartment) => (
          <div
            key={compartment.id}
            className={`absolute border-2 cursor-move transition-all ${
              selectedCompartment?.id === compartment.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-400 bg-white hover:border-gray-600'
            } ${isDragging && dragItem?.compartment.id === compartment.id ? 'opacity-75' : ''}`}
            style={{
              left: compartment.position.x * scale,
              top: compartment.position.y * scale,
              width: compartment.position.width * scale,
              height: compartment.position.height * scale
            }}
            onMouseDown={(e) => handleMouseDown(e, compartment)}
            onClick={() => setSelectedCompartment(compartment)}
          >
            <div className="p-2 h-full flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold truncate">{compartment.name}</span>
                <div className="flex items-center gap-1">
                  {compartment.type === 'fridge' && <Thermometer className="w-3 h-3 text-blue-500" />}
                  {compartment.type === 'freezer' && <Droplets className="w-3 h-3 text-cyan-500" />}
                  {compartment.type === 'door' && <Move className="w-3 h-3 text-gray-500" />}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-1">
                {compartment.capacity}L
              </div>

              {showDimensions && (
                <div className="text-xs text-gray-500">
                  {compartment.position.width}×{compartment.position.height}
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                {compartment.shelves?.slice(0, 3).map((shelf, index) => (
                  <div 
                    key={shelf.id}
                    className="bg-gray-100 border border-gray-300 rounded mb-1 p-1"
                    style={{ height: `${100 / (compartment.shelves?.length || 1)}%` }}
                  >
                    <div className="text-xs truncate">{shelf.name}</div>
                    <div className="text-xs text-gray-500">{shelf.capacity}L</div>
                  </div>
                ))}
                {compartment.shelves && compartment.shelves.length > 3 && (
                  <div className="text-xs text-gray-500">+{compartment.shelves.length - 3} mais</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de arrasto */}
        {isDragging && dragItem && (
          <div 
            className="absolute border-2 border-blue-500 bg-blue-100 opacity-50 pointer-events-none"
            style={{
              left: dragItem.compartment.position.x * scale,
              top: dragItem.compartment.position.y * scale,
              width: dragItem.compartment.position.width * scale,
              height: dragItem.compartment.position.height * scale
            }}
          />
        )}
      </div>
    </div>
  );

  // Painel de propriedades
  const renderPropertiesPanel = () => (
    <div className="w-80 bg-white border-l rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-3">
        <h3 className="font-semibold text-gray-800">Propriedades</h3>
      </div>

      <div className="p-4 space-y-4">
        {selectedCompartment ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={selectedCompartment.name}
                onChange={(e) => updateCompartment(selectedCompartment.id, { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (L)</label>
              <input
                type="number"
                value={selectedCompartment.capacity}
                onChange={(e) => updateCompartment(selectedCompartment.id, { capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={selectedCompartment.type}
                onChange={(e) => updateCompartment(selectedCompartment.id, { type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fridge">Geladeira</option>
                <option value="freezer">Freezer</option>
                <option value="door">Porta</option>
                <option value="drawer">Gaveta</option>
                <option value="crisper">Legumeira</option>
                <option value="deli_drawer">Frios</option>
                <option value="ice_maker">Fabricador de Gelo</option>
                <option value="water_dispenser">Distribuidor de Água</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">X (%)</label>
                <input
                  type="number"
                  value={selectedCompartment.position.x}
                  onChange={(e) => updateCompartment(selectedCompartment.id, { 
                    position: { ...selectedCompartment.position, x: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Y (%)</label>
                <input
                  type="number"
                  value={selectedCompartment.position.y}
                  onChange={(e) => updateCompartment(selectedCompartment.id, { 
                    position: { ...selectedCompartment.position, y: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Largura (%)</label>
                <input
                  type="number"
                  value={selectedCompartment.position.width}
                  onChange={(e) => updateCompartment(selectedCompartment.id, { 
                    position: { ...selectedCompartment.position, width: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altura (%)</label>
                <input
                  type="number"
                  value={selectedCompartment.position.height}
                  onChange={(e) => updateCompartment(selectedCompartment.id, { 
                    position: { ...selectedCompartment.position, height: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => duplicateCompartment(selectedCompartment)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <button
                onClick={() => removeCompartment(selectedCompartment.id)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            </div>

            {/* Prateleiras */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Prateleiras</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedCompartment.shelves?.map((shelf) => (
                  <div key={shelf.id} className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <input
                        type="text"
                        value={shelf.name}
                        onChange={(e) => updateShelf(selectedCompartment.id, shelf.id, { name: e.target.value })}
                        className="text-sm flex-1 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={shelf.capacity}
                        onChange={(e) => updateShelf(selectedCompartment.id, shelf.id, { capacity: parseInt(e.target.value) || 0 })}
                        className="text-sm w-16 px-2 py-1 border border-gray-300 rounded"
                        placeholder="L"
                      />
                      <span className="text-xs text-gray-500">L</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newShelf: Shelf = {
                      id: `shelf-${Date.now()}`,
                      name: 'Nova Prateleira',
                      position: (selectedCompartment.shelves?.length || 0) + 1,
                      capacity: 10
                    };
                    updateCompartment(selectedCompartment.id, {
                      shelves: [...(selectedCompartment.shelves || []), newShelf]
                    });
                  }}
                  className="w-full py-1 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400"
                >
                  + Adicionar Prateleira
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Selecione um compartimento para editar</p>
          </div>
        )}
      </div>
    </div>
  );

  // Painel de adição de compartimentos
  const renderAddCompartmentPanel = () => (
    <div className="w-80 bg-white border-l rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-3">
        <h3 className="font-semibold text-gray-800">Adicionar Compartimento</h3>
      </div>

      <div className="p-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {advancedLayoutService.getCompartmentLibrary().map((template) => (
            <button
              key={template.type}
              onClick={() => addCompartment(template)}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-800">{template.name}</div>
              <div className="text-sm text-gray-600">
                {template.typicalCapacity.min}-{template.typicalCapacity.max}L
              </div>
              {template.specialFeatures && (
                <div className="text-xs text-gray-500 mt-1">
                  {template.specialFeatures.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddingCompartment(false)}
          className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Editor Avançado de Layout</h2>
            <p className="text-sm text-gray-600">
              {layout.fridgeType.name} - {layout.customCompartments.reduce((sum, c) => sum + c.capacity, 0)}L total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!validation.isValid && (
              <div className="text-red-600 text-sm">
                ⚠️ {validation.issues.length} problemas
              </div>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(layout)}
              disabled={!validation.isValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Layout
            </button>
          </div>
        </div>

        {/* Validation Messages */}
        {(validation.issues.length > 0 || validation.warnings.length > 0) && (
          <div className="mt-4 space-y-2">
            {validation.issues.map((issue, index) => (
              <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                ⚠️ {issue}
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
                ⚡ {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-2">
          <button
            onClick={() => setIsAddingCompartment(true)}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Adicionar compartimento"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setScale(Math.min(1.5, scale + 0.1))}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Aumentar zoom"
          >
            +
          </button>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Diminuir zoom"
          >
            -
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Resetar zoom"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        {renderCanvas()}

        {/* Properties Panel */}
        {isAddingCompartment ? renderAddCompartmentPanel() : renderPropertiesPanel()}
      </div>
    </div>
  );
};
