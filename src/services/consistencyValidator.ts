import { FridgeModelUserFocused, ValidationResult } from '../types/fridgeDiscovery';

// Consistency Validator - valida consistência dos dados
class ConsistencyValidator {
  validate(data: Partial<FridgeModelUserFocused>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let completeness = 0;

    // Validar campos obrigatórios
    if (!data.brand) {
      errors.push('Marca é obrigatória');
    } else {
      completeness += 0.1;
    }

    if (!data.model) {
      errors.push('Modelo é obrigatório');
    } else {
      completeness += 0.1;
    }

    if (!data.type) {
      warnings.push('Tipo não especificado, assumindo "fridge"');
      data.type = 'fridge';
    } else {
      completeness += 0.05;
    }

    // Validar capacidade
    if (!data.totalCapacity) {
      warnings.push('Capacidade não especificada');
    } else {
      completeness += 0.15;
      if (data.totalCapacity < 50 || data.totalCapacity > 1000) {
        warnings.push('Capacidade fora do range típico (50-1000 litros)');
      }
    }

    // Validar dimensões
    if (!data.dimensions) {
      warnings.push('Dimensões não especificadas');
    } else {
      completeness += 0.2;
      const dimensionErrors = this.validateDimensions(data.dimensions);
      errors.push(...dimensionErrors);
    }

    // Validar consumo energético
    if (!data.energy) {
      warnings.push('Dados de consumo energético não especificados');
    } else {
      completeness += 0.15;
      const energyErrors = this.validateEnergy(data.energy);
      errors.push(...energyErrors);
    }

    // Validar compartimentos
    if (!data.compartments || data.compartments.length === 0) {
      warnings.push('Compartimentos não especificados');
    } else {
      completeness += 0.15;
      const compartmentErrors = this.validateCompartments(data.compartments);
      errors.push(...compartmentErrors);
    }

    // Validar consistência entre capacidade e dimensões
    if (data.totalCapacity && data.dimensions) {
      const consistencyError = this.validateCapacityVsDimensions(data.totalCapacity, data.dimensions);
      if (consistencyError) {
        errors.push(consistencyError);
      } else {
        completeness += 0.1;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness,
    };
  }

  private validateDimensions(dimensions: any): string[] {
    const errors: string[] = [];

    if (!dimensions.width || dimensions.width < 300 || dimensions.width > 1500) {
      errors.push('Largura inválida (deve ser entre 300-1500mm)');
    }

    if (!dimensions.height || dimensions.height < 500 || dimensions.height > 2500) {
      errors.push('Altura inválida (deve ser entre 500-2500mm)');
    }

    if (!dimensions.depth || dimensions.depth < 400 || dimensions.depth > 1000) {
      errors.push('Profundidade inválida (deve ser entre 400-1000mm)');
    }

    if (dimensions.weight && (dimensions.weight < 20 || dimensions.weight > 200)) {
      errors.push('Peso inválido (deve ser entre 20-200kg)');
    }

    return errors;
  }

  private validateEnergy(energy: any): string[] {
    const errors: string[] = [];

    if (!energy.monthlyKwh || energy.monthlyKwh < 10 || energy.monthlyKwh > 100) {
      errors.push('Consumo mensal inválido (deve ser entre 10-100 kWh)');
    }

    if (!energy.efficiency || !['A', 'B', 'C', 'D', 'E'].includes(energy.efficiency)) {
      errors.push('Eficiência energética inválida (deve ser A, B, C, D ou E)');
    }

    if (!energy.voltage || !['110V', '220V', 'bivolt'].includes(energy.voltage)) {
      errors.push('Voltagem inválida (deve ser 110V, 220V ou bivolt)');
    }

    return errors;
  }

  private validateCompartments(compartments: any[]): string[] {
    const errors: string[] = [];

    compartments.forEach((comp, index) => {
      if (!comp.id) {
        errors.push(`Compartimento ${index + 1}: ID é obrigatório`);
      }

      if (!comp.name) {
        errors.push(`Compartimento ${index + 1}: Nome é obrigatório`);
      }

      if (!comp.type || !['fridge', 'freezer', 'door-compartment'].includes(comp.type)) {
        errors.push(`Compartimento ${index + 1}: Tipo inválido`);
      }

      if (!comp.capacity || comp.capacity < 1 || comp.capacity > 500) {
        errors.push(`Compartimento ${index + 1}: Capacidade inválida (deve ser entre 1-500 litros)`);
      }

      if (!comp.temperature) {
        errors.push(`Compartimento ${index + 1}: Temperatura é obrigatória`);
      } else {
        if (comp.temperature.min < -30 || comp.temperature.min > 10) {
          errors.push(`Compartimento ${index + 1}: Temperatura mínima inválida`);
        }
        if (comp.temperature.max < -20 || comp.temperature.max > 15) {
          errors.push(`Compartimento ${index + 1}: Temperatura máxima inválida`);
        }
      }
    });

    return errors;
  }

  private validateCapacityVsDimensions(capacity: number, dimensions: any): string | null {
    // Converter mm para cm (as dimensões estão em mm)
    const widthCm = dimensions.width / 10;
    const heightCm = dimensions.height / 10;
    const depthCm = dimensions.depth / 10;
    
    // Estimativa aproximada: 1 litro ≈ 1000 cm³
    const volumeCm3 = widthCm * heightCm * depthCm;
    const estimatedCapacityLiters = volumeCm3 / 1000;

    // Capacidade interna é geralmente 70-80% do volume externo
    const minExpectedCapacity = estimatedCapacityLiters * 0.6;
    const maxExpectedCapacity = estimatedCapacityLiters * 0.85;

    if (capacity < minExpectedCapacity || capacity > maxExpectedCapacity) {
      return `Capacidade (${capacity}L) inconsistente com dimensões (${dimensions.width}x${dimensions.height}x${dimensions.depth}mm). Esperado: ${Math.round(minExpectedCapacity)}-${Math.round(maxExpectedCapacity)}L`;
    }

    return null;
  }

  validateEnergyVsCapacity(capacity: number, energy: any): boolean {
    // Estimativa aproximada: geladeiras consomem 0.05-0.15 kWh por litro por mês
    const minExpectedKwh = capacity * 0.05;
    const maxExpectedKwh = capacity * 0.15;

    return energy.monthlyKwh >= minExpectedKwh && energy.monthlyKwh <= maxExpectedKwh;
  }
}

export const consistencyValidator = new ConsistencyValidator();
