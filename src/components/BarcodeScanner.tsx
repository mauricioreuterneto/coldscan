import React, { useState, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanResult } from '../types';

interface BarcodeScannerProps {
  onScanSuccess: (result: ScanResult) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        const result: ScanResult = {
          barcode: decodedText,
          productInfo: lookupProduct(decodedText),
        };
        onScanSuccess(result);
        html5QrcodeScanner.clear();
        setIsScanning(false);
      },
      (error) => {
        onScanError?.(`Erro ao ler código: ${error}`);
      }
    );

    setScanner(html5QrcodeScanner);
  }, [onScanSuccess, onScanError]);

  const stopScanning = useCallback(() => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
    onClose?.();
  }, [scanner, onClose]);

  const lookupProduct = (barcode: string) => {
    // Simulação de lookup de produto
    // Em um app real, isso seria uma chamada para uma API
    const productDatabase: Record<string, { name: string; category: string }> = {
      '7896000012345': { name: 'Leite Integral', category: 'Laticínios' },
      '7896000023456': { name: 'Pão de Forma', category: 'Padaria' },
      '7896000034567': { name: 'Ovos Brancos', category: 'Ovos' },
      '7896000045678': { name: 'Queijo Mussarela', category: 'Laticínios' },
      '7896000056789': { name: 'Presunto', category: 'Carnes' },
      '7896000067890': { name: 'Manteiga', category: 'Laticínios' },
      '7896000078901': { name: 'Iogurte Natural', category: 'Laticínios' },
      '7896000089012': { name: 'Maçã', category: 'Frutas' },
      '7896000090123': { name: 'Tomate', category: 'Legumes' },
      '7896000101234': { name: 'Cenoura', category: 'Legumes' },
    };

    return productDatabase[barcode] || undefined;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Escanear Código de Barras</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!isScanning ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Posicione o código de barras na câmera para escanear
            </p>
            <button
              onClick={startScanning}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Scanner
            </button>
          </div>
        ) : (
          <div>
            <div id="reader" className="mb-4"></div>
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
