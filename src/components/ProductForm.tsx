import React, { useState, useRef } from 'react';
import { Product, Compartment } from '../types/unified';
import type { ScanResult } from '../types/unified';
import { Camera, X } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { getProductQuantity, getProductUnit, getProductShelfId, getProductZoneId } from '../utils';

interface ProductFormProps {
  compartments: Compartment[];
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialProduct?: Partial<Product>;
  selectedApplianceId?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  compartments,
  onSubmit,
  onCancel,
  initialProduct,
  selectedApplianceId,
}) => {
  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    category: initialProduct?.category || '',
    quantity: initialProduct ? getProductQuantity(initialProduct as Product) || 1 : 1,
    unit: initialProduct ? getProductUnit(initialProduct as Product) : 'unidade',
    expiryDate: initialProduct?.expiry?.sealedExpiryDate ? new Date(initialProduct.expiry.sealedExpiryDate).toISOString().split('T')[0] : '',
    purchaseDate: initialProduct?.purchase?.purchaseDate ? new Date(initialProduct.purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: initialProduct?.notes || '',
    barcode: initialProduct?.barcode || '',
    location: {
      compartmentId: initialProduct ? getProductZoneId(initialProduct as Product) || compartments[0]?.id || '' : compartments[0]?.id || '',
      shelfId: initialProduct ? getProductShelfId(initialProduct as Product) || '' : '',
    },
  });

  const [showScanner, setShowScanner] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialProduct?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCompartment = compartments.find(comp => comp.id === formData.location.compartmentId);
  const selectedShelf = selectedCompartment?.shelves?.find(shelf => shelf.id === formData.location.shelfId);

  const calculateExpiry = (dateValue: string) => {
    if (!dateValue) {
      return {
        daysUntilExpiry: 0,
        isExpiringSoon: false,
        isExpired: false,
        riskLevel: 'low' as const,
      };
    }

    const expiryDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
      isExpired: daysUntilExpiry < 0,
      riskLevel: daysUntilExpiry < 0 ? 'critical' as const : daysUntilExpiry <= 2 ? 'high' as const : daysUntilExpiry <= 7 ? 'medium' as const : 'low' as const,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const purchaseDate = new Date(formData.purchaseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (purchaseDate > today) {
      window.alert('A data de compra não pode ser futura.');
      return;
    }

    if (!formData.location.compartmentId) {
      window.alert('Selecione uma localização para o produto.');
      return;
    }

    const expiryStatus = calculateExpiry(formData.expiryDate);
    
    const product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      category: formData.category,
      barcode: formData.barcode || undefined,
      notes: formData.notes || undefined,
      image: imagePreview || undefined,
      location: {
        locationId: formData.location.compartmentId,
        locationName: selectedCompartment?.name || 'Local não definido',
        applianceId: selectedApplianceId || initialProduct?.location?.applianceId,
        compartmentId: formData.location.compartmentId,
        shelfId: formData.location.shelfId,
        zoneId: formData.location.compartmentId,
        zoneName: selectedCompartment?.name,
        position: formData.location.shelfId ? {
          shelf: selectedShelf?.name || formData.location.shelfId,
        } : undefined,
      },
      currentState: {
        status: initialProduct?.currentState?.status || 'closed',
        openedAt: initialProduct?.currentState?.openedAt,
        lastConsumedAt: initialProduct?.currentState?.lastConsumedAt,
        remainingPercentage: initialProduct?.currentState?.remainingPercentage || 100,
        condition: expiryStatus.isExpired ? 'expired' : expiryStatus.isExpiringSoon ? 'expiring_soon' : 'fresh',
      },
      consumption: {
        originalQuantity: initialProduct?.consumption?.originalQuantity || formData.quantity,
        currentQuantity: formData.quantity,
        unit: formData.unit,
        consumptionHistory: initialProduct?.consumption?.consumptionHistory || [],
      },
      expiry: {
        sealedExpiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        daysUntilExpiry: expiryStatus.daysUntilExpiry,
        expiryType: 'sealed',
        isExpiringSoon: expiryStatus.isExpiringSoon,
        isExpired: expiryStatus.isExpired,
        riskLevel: expiryStatus.riskLevel,
      },
      purchase: {
        purchaseDate,
        quantity: formData.quantity,
        unit: formData.unit,
        currency: 'BRL',
      },
      tags: initialProduct?.tags || [],
      nutritionalInfo: initialProduct?.nutritionalInfo,
      householdId: initialProduct?.householdId || '',
    };

    onSubmit(product);
  };

  const handleScanResult = (result: ScanResult) => {
    setFormData(prev => ({
      ...prev,
      barcode: result.barcode || prev.barcode,
      name: result.productInfo?.name || prev.name,
      category: result.productInfo?.category || prev.category,
    }));
    setShowScanner(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    'Laticínios', 'Carnes', 'Legumes', 'Frutas', 'Grãos', 'Bebidas',
    'Padaria', 'Doces', 'Congelados', 'Enlatados', 'Temperos', 'Outros'
  ];

  const units = ['unidade', 'kg', 'g', 'l', 'ml', 'pacote', 'caixa', 'garrafa'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {initialProduct ? 'Editar Produto' : 'Adicionar Produto'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Foto do Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto do Produto
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Escolher Foto
                  </button>
                </div>
              </div>
            </div>

            {/* Scanner de Código de Barras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Barras
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Digite ou escaneie o código de barras"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Escanear
                </button>
              </div>
            </div>

            {/* Nome e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Leite Integral"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantidade e Unidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Localização */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compartimento *
                </label>
                <select
                  value={formData.location.compartmentId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, compartmentId: e.target.value, shelfId: '' }
                  }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {compartments.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prateleira
                </label>
                <select
                  value={formData.location.shelfId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, shelfId: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {selectedCompartment?.shelves?.map(shelf => (
                    <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais sobre o produto..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {initialProduct ? 'Atualizar' : 'Adicionar'} Produto
              </button>
            </div>
          </form>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
