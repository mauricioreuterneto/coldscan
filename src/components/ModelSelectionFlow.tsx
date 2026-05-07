import React, { useState, useEffect } from 'react';
import { modelDiscoveryWorkflow } from '../services/modelDiscoveryWorkflow';
import { ocrService } from '../services/ocrService';
import { multiPhotoDiscovery } from '../services/multiPhotoDiscovery';
import { legalComplianceService } from '../services/legalComplianceService';
import { ProcessedFridgeModel, ModelIdentifier } from '../types/fridgeDiscovery';
import './ModelSelectionFlow.css';

type SelectionStep = 'input' | 'searching' | 'not_found' | 'select_variation' | 'confirm' | 'processing' | 'completed';
type InputMethod = 'text' | 'photo';

interface ModelSelectionFlowProps {
  onModelSelected: (model: ProcessedFridgeModel) => void;
  onCancel: () => void;
  userId?: string;
}

export const ModelSelectionFlow: React.FC<ModelSelectionFlowProps> = ({ onModelSelected, onCancel, userId }) => {
  const [step, setStep] = useState<SelectionStep>('input');
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [textInput, setTextInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [foundModel, setFoundModel] = useState<ProcessedFridgeModel | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // Verificar consentimento se necessário
  useEffect(() => {
    if (userId) {
      checkConsent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkConsent = async () => {
    if (!userId) return;
    const hasConsent = await legalComplianceService.hasUserConsent(userId, 'data_processing');
    setConsentGiven(!!hasConsent);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('Por favor, insira o modelo da geladeira');
      return;
    }

    setError('');
    setLoading(true);
    setStep('searching');

    try {
      // Primeiro, buscar no banco
      const identifier = parseTextInput(textInput);
      const existingModel = await modelDiscoveryWorkflow.findModelInDatabase(identifier);

      if (existingModel) {
        setFoundModel(existingModel);
        setStep('confirm');
        setLoading(false);
        return;
      }

      // Se não existe, iniciar workflow de descoberta
      const discoveryResult = await modelDiscoveryWorkflow.discoverModelFromText(textInput);

      if (discoveryResult.currentStep === 'completed' && discoveryResult.data) {
        setFoundModel(discoveryResult.data as ProcessedFridgeModel);
        setStep('confirm');
      } else if (discoveryResult.currentStep === 'failed') {
        setError('Modelo não encontrado. Tente novamente ou use a opção de foto.');
        setStep('not_found');
      } else {
        setError('Não foi possível encontrar o modelo automaticamente. Por favor, forneça mais informações.');
        setStep('not_found');
      }
    } catch (err) {
      setError('Erro ao buscar modelo. Por favor, tente novamente.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!photoFile) {
      setError('Por favor, selecione uma foto da etiqueta da geladeira');
      return;
    }

    setError('');
    setLoading(true);
    setStep('searching');

    try {
      // Tentar OCR
      const ocrResult = await ocrService.extractFromImage(photoFile);

      if (ocrResult.success && ocrResult.identifier) {
        // Buscar no banco
        const existingModel = await modelDiscoveryWorkflow.findModelInDatabase(ocrResult.identifier);

        if (existingModel) {
          setFoundModel(existingModel);
          setStep('confirm');
          setLoading(false);
          return;
        }

        // Iniciar workflow de descoberta
        const discoveryResult = await modelDiscoveryWorkflow.discoverModel(ocrResult.identifier, 'photo');

        if (discoveryResult.currentStep === 'completed' && discoveryResult.data) {
          setFoundModel(discoveryResult.data as ProcessedFridgeModel);
          setStep('confirm');
        } else {
          setError('Não foi possível identificar o modelo. Por favor, tente uma foto mais clara ou use a opção de texto.');
          setStep('not_found');
        }
      } else {
        // OCR falhou, tentar multi-photo discovery
        const photoResult = await multiPhotoDiscovery.discoverWithFallback(photoFile);
        
        if (photoResult.identifier && photoResult.confidence > 0.5) {
          const existingModel = await modelDiscoveryWorkflow.findModelInDatabase(photoResult.identifier);
          if (existingModel) {
            setFoundModel(existingModel);
            setStep('confirm');
            setLoading(false);
            return;
          }
        }

        setError('Não foi possível identificar o modelo. Por favor, use a opção de texto.');
        setStep('not_found');
      }
    } catch (err) {
      setError('Erro ao processar foto. Por favor, tente novamente.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    setStep('input');
    setInputMethod('text');
  };

  const handleConfirm = async () => {
    if (!foundModel) return;

    setLoading(true);
    setStep('processing');

    try {
      // Registrar consentimento se necessário
      if (userId && !consentGiven) {
        await legalComplianceService.recordUserConsent(userId, 'data_processing');
      }

      // Confirmar seleção
      onModelSelected(foundModel);
      setStep('completed');
    } catch (err) {
      setError('Erro ao confirmar seleção. Por favor, tente novamente.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const parseTextInput = (text: string): ModelIdentifier => {
    const parts = text.trim().split(/\s+/);
    const brands = ['Consul', 'Brastemp', 'Electrolux', 'Samsung', 'LG', 'Midea', 'Panasonic'];
    
    const brand = parts.find(p => brands.includes(p));
    const model = parts.find(p => /[A-Z]{2,}\d{2,}/.test(p));
    const year = parts.find(p => /^\d{4}$/.test(p));

    return {
      brand: brand || '',
      model: model || '',
      year: year ? parseInt(year, 10) : undefined,
    };
  };

  return (
    <div className="model-selection-flow">
      <div className="flow-header">
        <h2>Selecionar Modelo da Geladeira</h2>
        <button className="btn-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {step === 'input' && (
        <div className="input-step">
          {!consentGiven && userId && (
            <div className="consent-notice">
              <p>Para continuar, precisamos do seu consentimento para processar seus dados.</p>
              <button 
                className="btn-primary"
                onClick={() => legalComplianceService.recordUserConsent(userId, 'data_processing').then(() => setConsentGiven(true))}
              >
                Concordar
              </button>
            </div>
          )}

          <div className="input-method-selector">
            <button
              className={`method-btn ${inputMethod === 'text' ? 'active' : ''}`}
              onClick={() => setInputMethod('text')}
            >
              📝 Digitar Modelo
            </button>
            <button
              className={`method-btn ${inputMethod === 'photo' ? 'active' : ''}`}
              onClick={() => setInputMethod('photo')}
            >
              📷 Tirar Foto da Etiqueta
            </button>
          </div>

          {inputMethod === 'text' && (
            <div className="text-input-container">
              <input
                type="text"
                className="model-input"
                placeholder="Ex: Consul CRE44AB 2023"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              />
              <button className="btn-primary" onClick={handleTextSubmit} disabled={loading}>
                Buscar Modelo
              </button>
            </div>
          )}

          {inputMethod === 'photo' && (
            <div className="photo-input-container">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="file-input"
              />
              <button className="btn-primary" onClick={handlePhotoSubmit} disabled={!photoFile || loading}>
                Processar Foto
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="help-text">
            <p>Dica: Digite a marca, modelo e ano (ex: Consul CRE44AB 2023) ou tire uma foto clara da etiqueta da geladeira.</p>
          </div>
        </div>
      )}

      {step === 'searching' && (
        <div className="searching-step">
          <div className="spinner"></div>
          <p>Buscando modelo...</p>
          <p className="sub-text">Isso pode levar alguns segundos</p>
        </div>
      )}

      {step === 'not_found' && (
        <div className="not-found-step">
          <h3>Modelo Não Encontrado</h3>
          <p>Não encontramos o modelo especificado em nosso banco de dados.</p>
          
          <div className="not-found-options">
            <button className="btn-secondary" onClick={handleManualEntry}>
              Tentar Novamente
            </button>
            <button className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      )}

      {step === 'confirm' && foundModel && (
        <div className="confirm-step">
          <h3>Modelo Encontrado</h3>
          
          <div className="model-card">
            <div className="model-info">
              <h4>{foundModel.brand} {foundModel.model}</h4>
              {foundModel.year && <p>Ano: {foundModel.year}</p>}
              <p>Tipo: {foundModel.type}</p>
              <p>Capacidade: {foundModel.totalCapacity} litros</p>
            </div>

            {foundModel.imageUrl && (
              <div className="model-image">
                <img src={foundModel.imageUrl} alt={`${foundModel.brand} ${foundModel.model}`} />
              </div>
            )}
          </div>

          <div className="confirm-actions">
            <button className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
              Confirmar Seleção
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="processing-step">
          <div className="spinner"></div>
          <p>Processando seleção...</p>
        </div>
      )}

      {step === 'completed' && (
        <div className="completed-step">
          <div className="success-icon">✓</div>
          <h3>Modelo Selecionado com Sucesso</h3>
          <p>Seu modelo foi configurado e você pode começar a usar o app.</p>
        </div>
      )}
    </div>
  );
};
