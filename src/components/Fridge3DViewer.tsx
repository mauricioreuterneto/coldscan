import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types/unified';
import { FridgeModel } from '../types/unified';
import { ProcessedFridgeModel } from '../types/fridgeDiscovery';
import './Fridge3DViewer.css';

interface Fridge3DViewerProps {
  fridgeModel: FridgeModel | ProcessedFridgeModel;
  products: Product[];
  onProductClick?: (product: Product) => void;
  onCompartmentClick?: (compartmentId: string) => void;
}

export const Fridge3DViewer: React.FC<Fridge3DViewerProps> = ({
  fridgeModel,
  products,
  onProductClick,
  onCompartmentClick
}) => {
  const [selectedCompartment, setSelectedCompartment] = useState<string | null>(null);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d'); // Default to 2D for better utility
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Agrupar produtos por compartimento
  const productsByCompartment = products.reduce((acc, product) => {
    const compartmentId = product.location?.compartmentId || 'unknown';
    if (!acc[compartmentId]) {
      acc[compartmentId] = [];
    }
    acc[compartmentId].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Calcular estatísticas por compartimento
  const getCompartmentStats = (compartmentId: string) => {
    const compartmentProducts = productsByCompartment[compartmentId] || [];
    const now = new Date();
    
    const expired = compartmentProducts.filter(p => {
      const expiry = p.expiry?.sealedExpiryDate;
      return expiry && new Date(expiry) < now;
    }).length;
    
    const expiringSoon = compartmentProducts.filter(p => {
      const expiry = p.expiry?.sealedExpiryDate;
      if (!expiry) return false;
      const expiryDate = new Date(expiry);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return expiryDate >= now && expiryDate <= threeDaysFromNow;
    }).length;
    
    return {
      total: compartmentProducts.length,
      expired,
      expiringSoon
    };
  };

  // Renderização 2D focada em utilidade (mais clara e útil)
  const render2DView = () => {
    const compartments = fridgeModel.compartments || [];
    
    return (
      <div className="fridge-2d-view">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`view-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </button>
        </div>

        <div className="fridge-container">
          {compartments.map((compartment, index) => {
            const stats = getCompartmentStats(compartment.id);
            const isSelected = selectedCompartment === compartment.id;
            
            return (
              <div
                key={compartment.id}
                className={`compartment ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCompartment(compartment.id);
                  onCompartmentClick?.(compartment.id);
                }}
                style={{
                  borderColor: stats.expired > 0 ? '#ef4444' : 
                             stats.expiringSoon > 0 ? '#f59e0b' : '#e5e7eb'
                }}
              >
                <div className="compartment-header">
                  <h3>{compartment.name}</h3>
                  <div className="compartment-stats">
                    <span className="stat-item">
                      {stats.total} itens
                    </span>
                    {stats.expired > 0 && (
                      <span className="stat-item expired">
                        {stats.expired} vencido(s)
                      </span>
                    )}
                    {stats.expiringSoon > 0 && (
                      <span className="stat-item expiring">
                        {stats.expiringSoon} vencendo
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="compartment-products">
                    {productsByCompartment[compartment.id]?.map(product => {
                      const isExpired = product.expiry?.sealedExpiryDate && 
                        new Date(product.expiry.sealedExpiryDate) < new Date();
                      const isExpiringSoon = product.expiry?.sealedExpiryDate && 
                        new Date(product.expiry.sealedExpiryDate) >= new Date() &&
                        new Date(product.expiry.sealedExpiryDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <div
                          key={product.id}
                          className={`product-item ${isExpired ? 'expired' : ''} ${isExpiringSoon ? 'expiring' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick?.(product);
                          }}
                        >
                          <div className="product-name">{product.name}</div>
                          <div className="product-details">
                            <span>{product.consumption?.currentQuantity || 0} {product.consumption?.unit || ''}</span>
                            {product.expiry?.sealedExpiryDate && (
                              <span className={`expiry-date ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}`}>
                                {new Date(product.expiry.sealedExpiryDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(!productsByCompartment[compartment.id] || productsByCompartment[compartment.id].length === 0) && (
                      <div className="empty-compartment">
                        Vazio
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderização 3D básica
  const render3DView = () => {
    return (
      <div className="fridge-3d-view">
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`view-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </button>
        </div>

        <div className="fridge-3d-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="fridge-canvas"
          />
          
          <div className="3d-controls">
            <button
              className="door-toggle-btn"
              onClick={() => setIsDoorOpen(!isDoorOpen)}
            >
              {isDoorOpen ? 'Fechar Porta' : 'Abrir Porta'}
            </button>
          </div>

          <div className="3d-legend">
            <p>Visualização 3D simplificada - use 2D para melhor usabilidade</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fridge-3d-viewer">
      {viewMode === '2d' ? render2DView() : render3DView()}
    </div>
  );
};
