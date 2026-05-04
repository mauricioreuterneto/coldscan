import React from 'react';
import { FridgeModel, Compartment, Product } from '../types';
import { calculateCompartmentUsage } from '../utils';

interface FridgeViewerProps {
  fridgeModel: FridgeModel;
  products: Product[];
  onCompartmentClick?: (compartment: Compartment) => void;
  onProductClick?: (product: Product) => void;
}

export const FridgeViewer: React.FC<FridgeViewerProps> = ({
  fridgeModel,
  products,
  onCompartmentClick,
  onProductClick,
}) => {
  const getCompartmentColor = (type: string) => {
    switch (type) {
      case 'fridge': return '#e0f2fe';
      case 'freezer': return '#f0f9ff';
      case 'door': return '#fef3c7';
      default: return '#f3f4f6';
    }
  };

  const getCompartmentBorderColor = (type: string) => {
    switch (type) {
      case 'fridge': return '#0284c7';
      case 'freezer': return '#0369a1';
      case 'door': return '#d97706';
      default: return '#9ca3af';
    }
  };

  const getCompartmentProducts = (compartmentId: string) => {
    return products.filter(product => product.location.compartmentId === compartmentId);
  };

  const renderCompartment = (compartment: Compartment) => {
    const compartmentProducts = getCompartmentProducts(compartment.id);
    const usage = calculateCompartmentUsage(products, compartment);
    const usagePercentage = (usage / compartment.capacity) * 100;

    return (
      <div
        key={compartment.id}
        className="absolute border-2 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
        style={{
          left: `${compartment.position.x}%`,
          top: `${compartment.position.y}%`,
          width: `${compartment.position.width}%`,
          height: `${compartment.position.height}%`,
          backgroundColor: getCompartmentColor(compartment.type),
          borderColor: getCompartmentBorderColor(compartment.type),
        }}
        onClick={() => onCompartmentClick?.(compartment)}
      >
        <div className="p-2 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-sm">{compartment.name}</h4>
              <p className="text-xs text-gray-600">
                {usage}/{compartment.capacity} ({usagePercentage.toFixed(0)}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-50 rounded flex items-center justify-center">
              <span className="text-xs font-bold">{compartmentProducts.length}</span>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercentage > 90 ? 'bg-red-500' :
                usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {/* Prateleiras */}
          {compartment.shelves && compartment.shelves.length > 0 && (
            <div className="flex-1 space-y-1">
              {compartment.shelves.map((shelf, index) => {
                const shelfProducts = compartmentProducts.filter(
                  product => product.location.shelfId === shelf.id
                );
                return (
                  <div
                    key={shelf.id}
                    className="bg-white bg-opacity-30 rounded p-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{shelf.name}</span>
                      <span className="text-gray-600">{shelfProducts.length} itens</span>
                    </div>
                    {shelfProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {shelfProducts.slice(0, 3).map(product => (
                          <div
                            key={product.id}
                            className="bg-white rounded px-1 py-0.5 text-xs cursor-pointer hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onProductClick?.(product);
                            }}
                            title={product.name}
                          >
                            {product.name.length > 8 ? product.name.substring(0, 8) + '...' : product.name}
                          </div>
                        ))}
                        {shelfProducts.length > 3 && (
                          <span className="text-gray-500">+{shelfProducts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Produtos sem prateleira específica */}
          {compartmentProducts.filter(p => !p.location.shelfId).length > 0 && (
            <div className="mt-2">
              <div className="bg-white bg-opacity-30 rounded p-1 text-xs">
                <span className="font-medium">Outros</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {compartmentProducts.filter(p => !p.location.shelfId).slice(0, 3).map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded px-1 py-0.5 text-xs cursor-pointer hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick?.(product);
                      }}
                      title={product.name}
                    >
                      {product.name.length > 8 ? product.name.substring(0, 8) + '...' : product.name}
                    </div>
                  ))}
                  {compartmentProducts.filter(p => !p.location.shelfId).length > 3 && (
                    <span className="text-gray-500">+{compartmentProducts.filter(p => !p.location.shelfId).length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {fridgeModel.brand} {fridgeModel.model}
        </h2>
        <p className="text-gray-600">
          Capacidade Total: {fridgeModel.capacity}L | 
          Compartimentos: {fridgeModel.compartments.length}
        </p>
      </div>

      <div className="relative bg-gray-50 rounded-lg" style={{ paddingBottom: '150%' }}>
        <div className="absolute inset-0 p-4">
          {fridgeModel.compartments.map(compartment => renderCompartment(compartment))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="font-medium">Geladeira</span>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="font-medium">Porta</span>
          </div>
        </div>
        <div className="bg-cyan-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-500 rounded"></div>
            <span className="font-medium">Freezer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
