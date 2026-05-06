import { useState } from 'react';
import { FridgeModel } from '../types/unified';
import { useLocalStorage } from './useLocalStorage';
import { getFridgeModels } from '../utils';

export function useFridgeModel() {
  const [fridgeModel, setFridgeModel] = useLocalStorage<FridgeModel | null>('fridge-model', null);
  const [availableModels] = useState<FridgeModel[]>(getFridgeModels());

  const selectModel = (model: FridgeModel) => {
    setFridgeModel(model);
  };

  const clearModel = () => {
    setFridgeModel(null);
  };

  const getCompartmentById = (compartmentId: string) => {
    return fridgeModel?.compartments.find(comp => comp.id === compartmentId);
  };

  return {
    fridgeModel,
    availableModels,
    selectModel,
    clearModel,
    getCompartmentById,
  };
}
