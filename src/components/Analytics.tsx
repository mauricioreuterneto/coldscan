import React, { useState, useMemo } from 'react';
import { Product, FridgeModel } from '../types';
import { 
  TrendingDown, 
  Calendar, 
  Package, 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Activity,
  Download
} from 'lucide-react';
import { getExpiredProducts, getProductsExpiringSoon, getLowStockProducts, getCategories, getDaysUntilExpiry } from '../utils';

interface AnalyticsProps {
  products: Product[];
  fridgeModel: FridgeModel;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  products,
  fridgeModel,
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const expiredProducts = getExpiredProducts(products);
  const expiringSoonProducts = getProductsExpiringSoon(products);
  const lowStockProducts = getLowStockProducts(products);
  const categories = getCategories(products);

  // Análises baseadas nos dados
  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((acc, p) => acc + (p.quantity * 10), 0); // Valor estimado
    const expiredValue = expiredProducts.reduce((acc, p) => acc + (p.quantity * 10), 0);
    const expiringValue = expiringSoonProducts.reduce((acc, p) => acc + (p.quantity * 10), 0);
    
    // Análise por categoria
    const categoryAnalysis = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const expired = categoryProducts.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date());
      const expiring = categoryProducts.filter(p => p.expiryDate && getDaysUntilExpiry(new Date(p.expiryDate)) <= 3);
      const lowStock = categoryProducts.filter(p => p.quantity <= 2);
      
      return {
        category,
        total: categoryProducts.length,
        expired: expired.length,
        expiring: expiring.length,
        lowStock: lowStock.length,
        percentage: (categoryProducts.length / totalProducts) * 100
      };
    });

    // Análise por compartimento
    const compartmentAnalysis = fridgeModel.compartments.map(compartment => {
      const compartmentProducts = products.filter(p => p.location.compartmentId === compartment.id);
      const usage = (compartmentProducts.reduce((acc, p) => acc + p.quantity, 0) / compartment.capacity) * 100;
      
      return {
        name: compartment.name,
        type: compartment.type,
        total: compartmentProducts.length,
        usage: Math.min(usage, 100),
        capacity: compartment.capacity
      };
    });

    // Tendências (simuladas)
    const trends = {
      waste: expiredProducts.length, // Perda atual
      savings: Math.max(0, totalValue - expiredValue), // Economia potencial
      efficiency: totalProducts > 0 ? ((totalProducts - expiredProducts.length) / totalProducts) * 100 : 100
    };

    return {
      totalProducts,
      totalValue,
      expiredValue,
      expiringValue,
      categoryAnalysis,
      compartmentAnalysis,
      trends,
      wasteRate: totalProducts > 0 ? (expiredProducts.length / totalProducts) * 100 : 0,
      efficiencyScore: trends.efficiency
    };
  }, [products, fridgeModel, expiredProducts, expiringSoonProducts, categories]);

  const renderOverview = () => (
    <div className="space-y-8">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total de Produtos</h3>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalProducts}</p>
          <p className="text-xs text-gray-500 mt-1">Itens cadastrados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Valor Estimado</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {analytics.totalValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Valor total em estoque</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Perda Atual</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {analytics.expiredValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Produtos vencidos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Eficiência</h3>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.efficiencyScore.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Taxa de aproveitamento</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Análise por Categoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Análise por Categoria</h3>
          <div className="space-y-4">
            {analytics.categoryAnalysis.map((cat, index) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-gray-600">{cat.total} itens ({cat.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                {cat.expired > 0 && (
                  <div className="text-xs text-red-600">
                    {cat.expired} vencido(s)
                  </div>
                )}
                {cat.expiring > 0 && (
                  <div className="text-xs text-yellow-600">
                    {cat.expiring} vencendo em breve
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Uso por Compartimento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Uso por Compartimento</h3>
          <div className="space-y-4">
            {analytics.compartmentAnalysis.map((comp) => (
              <div key={comp.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{comp.name}</span>
                  <span className="text-gray-600">{comp.usage.toFixed(1)}% usado</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      comp.usage > 90 ? 'bg-red-500' :
                      comp.usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${comp.usage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {comp.total} itens / {comp.capacity} capacidade
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWasteAnalysis = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Análise de Perdas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {analytics.wasteRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Perda</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              R$ {analytics.expiredValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Valor Perdido</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              R$ {analytics.trends.savings.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Economia Potencial</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Produtos Vencidos por Categoria</h4>
          {analytics.categoryAnalysis
            .filter(cat => cat.expired > 0)
            .map(cat => (
              <div key={cat.category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-medium">{cat.category}</span>
                  <div className="text-sm text-gray-600">
                    {cat.expired} de {cat.total} produtos
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">
                    {((cat.expired / cat.total) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    R$ {(cat.expired * 10).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendações para Reduzir Perdas</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Verifique Validades Frequentemente</h4>
              <p className="text-sm text-blue-600">
                Estabeleça um routine semanal para verificar produtos próximos ao vencimento
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Compre Menos Quantidades</h4>
              <p className="text-sm text-green-600">
                Evite comprar em grandes quantidades produtos que você usa com pouca frequência
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Organize por Validade</h4>
              <p className="text-sm text-yellow-600">
                Coloque produtos com validade mais curta na frente para serem usados primeiro
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEfficiencyAnalysis = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Análise de Eficiência</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Eficiência Geral */}
          <div>
            <h4 className="font-medium mb-4">Métricas de Eficiência</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Taxa de Aproveitamento</span>
                <span className="font-medium text-green-600">
                  {analytics.efficiencyScore.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Produtos Bem Gerenciados</span>
                <span className="font-medium text-blue-600">
                  {analytics.totalProducts - expiredProducts.length}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Alertas Ativos</span>
                <span className="font-medium text-yellow-600">
                  {expiringSoonProducts.length + lowStockProducts.length}
                </span>
              </div>
            </div>
          </div>

          {/* Otimização de Espaço */}
          <div>
            <h4 className="font-medium mb-4">Otimização de Espaço</h4>
            <div className="space-y-4">
              {analytics.compartmentAnalysis
                .sort((a, b) => b.usage - a.usage)
                .slice(0, 3)
                .map(comp => (
                  <div key={comp.name} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{comp.name}</span>
                      <span className={`text-sm ${
                        comp.usage > 90 ? 'text-red-600' :
                        comp.usage > 70 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {comp.usage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          comp.usage > 90 ? 'bg-red-500' :
                          comp.usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${comp.usage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Insights e Recomendações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-green-600">O Que Está Funcionando Bem</h4>
            <div className="space-y-2">
              {analytics.categoryAnalysis
                .filter(cat => cat.expired === 0 && cat.total > 0)
                .slice(0, 3)
                .map(cat => (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{cat.category}: Nenhum produto vencido</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-yellow-600">Áreas de Melhoria</h4>
            <div className="space-y-2">
              {analytics.categoryAnalysis
                .filter(cat => cat.expired > 0)
                .slice(0, 3)
                .map(cat => (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{cat.category}: {cat.expired} vencido(s)</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Análises e Estatísticas</h2>
        <p className="text-gray-600">
          Insights detalhados sobre o uso da sua geladeira e gestão de produtos
        </p>
      </div>

      {/* Seletor de Métricas */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setSelectedMetric('waste')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'waste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Análise de Perdas
            </button>
            <button
              onClick={() => setSelectedMetric('efficiency')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedMetric === 'efficiency'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Eficiência
            </button>
          </div>

          <div className="ml-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo da Análise */}
      {selectedMetric === 'overview' && renderOverview()}
      {selectedMetric === 'waste' && renderWasteAnalysis()}
      {selectedMetric === 'efficiency' && renderEfficiencyAnalysis()}
    </div>
  );
};
