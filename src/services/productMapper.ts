import type {
  ConsumptionRecord,
  ExpiryInfo,
  Product,
  ProductLocation,
  ProductState,
  PurchaseInfo
} from '../types/unified';

type ProductRow = Record<string, any>;

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dateToIso = (value: Date | undefined): string | undefined =>
  value ? value.toISOString() : undefined;

const compact = <T extends ProductRow>(value: T): T => {
  Object.keys(value).forEach((key) => {
    if (value[key] === undefined) {
      delete value[key];
    }
  });
  return value;
};

export const getDaysUntilDate = (date?: Date): number => {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const getRiskLevel = (daysUntilExpiry: number): ExpiryInfo['riskLevel'] => {
  if (daysUntilExpiry < 0) return 'critical';
  if (daysUntilExpiry <= 2) return 'high';
  if (daysUntilExpiry <= 7) return 'medium';
  return 'low';
};

const mapConsumptionHistory = (records: any[] | undefined): ConsumptionRecord[] =>
  (records || []).map((record) => ({
    date: toDate(record.date) || new Date(),
    quantityConsumed: toNumber(record.quantityConsumed ?? record.quantity_consumed, 0),
    reason: record.reason || 'consumption',
    notes: record.notes || undefined,
  }));

export const mapProductRow = (row: ProductRow): Product => {
  const consumptionRaw = row.consumption || {};
  const stateRaw = row.current_state || row.currentState || {};
  const locationRaw = row.location || {};
  const expiryRaw = row.expiry || row.expiry_metadata || {};
  const purchaseRaw = row.purchase || row.purchase_info || {};

  const originalQuantity = toNumber(
    consumptionRaw.originalQuantity ?? consumptionRaw.original_quantity ?? row.original_quantity ?? row.quantity,
    1
  );
  const currentQuantity = toNumber(
    consumptionRaw.currentQuantity ?? consumptionRaw.current_quantity ?? row.current_quantity ?? row.quantity,
    originalQuantity
  );
  const unit = consumptionRaw.unit ?? row.unit ?? purchaseRaw.unit ?? 'unidade';

  const sealedExpiryDate = toDate(
    row.sealed_expiry_date ?? expiryRaw.sealedExpiryDate ?? expiryRaw.sealed_expiry_date ?? row.expiry_date
  );
  const openedExpiryDate = toDate(row.opened_expiry_date ?? expiryRaw.openedExpiryDate ?? expiryRaw.opened_expiry_date);
  const bestBeforeDate = toDate(row.best_before_date ?? expiryRaw.bestBeforeDate ?? expiryRaw.best_before_date);
  const freezeByDate = toDate(row.freeze_by_date ?? expiryRaw.freezeByDate ?? expiryRaw.freeze_by_date);
  const activeExpiryDate = openedExpiryDate || sealedExpiryDate || bestBeforeDate || freezeByDate;
  const daysUntilExpiry = toNumber(
    row.days_until_expiry ?? expiryRaw.daysUntilExpiry ?? expiryRaw.days_until_expiry,
    getDaysUntilDate(activeExpiryDate)
  );
  const isExpired = Boolean(row.is_expired ?? expiryRaw.isExpired ?? expiryRaw.is_expired ?? daysUntilExpiry < 0);
  const isExpiringSoon = Boolean(
    row.is_expiring_soon ?? expiryRaw.isExpiringSoon ?? expiryRaw.is_expiring_soon ?? (daysUntilExpiry >= 0 && daysUntilExpiry <= 7)
  );

  const location: ProductLocation = {
    locationId:
      locationRaw.locationId ??
      locationRaw.location_id ??
      row.location_id ??
      locationRaw.applianceId ??
      locationRaw.appliance_id ??
      locationRaw.compartmentId ??
      locationRaw.compartment_id ??
      '',
    locationName: locationRaw.locationName ?? locationRaw.location_name ?? row.location_name ?? '',
    applianceId: locationRaw.applianceId ?? locationRaw.appliance_id,
    compartmentId: locationRaw.compartmentId ?? locationRaw.compartment_id ?? locationRaw.zoneId ?? locationRaw.zone_id,
    shelfId: locationRaw.shelfId ?? locationRaw.shelf_id ?? locationRaw.position?.shelf,
    zoneId: locationRaw.zoneId ?? locationRaw.zone_id ?? row.zone_id ?? locationRaw.compartmentId ?? locationRaw.compartment_id,
    zoneName: locationRaw.zoneName ?? locationRaw.zone_name ?? row.zone_name,
    position: locationRaw.position
      ? {
          shelf: locationRaw.position.shelf,
          section: locationRaw.position.section,
          coordinates: locationRaw.position.coordinates,
        }
      : undefined,
  };

  const expiry: ExpiryInfo = {
    sealedExpiryDate,
    openedExpiryDate,
    bestBeforeDate,
    freezeByDate,
    daysUntilExpiry,
    expiryType: expiryRaw.expiryType ?? expiryRaw.expiry_type ?? (openedExpiryDate ? 'opened' : 'sealed'),
    isExpiringSoon,
    isExpired,
    riskLevel: expiryRaw.riskLevel ?? expiryRaw.risk_level ?? getRiskLevel(daysUntilExpiry),
    customExpiryRule: expiryRaw.customExpiryRule ?? expiryRaw.custom_expiry_rule,
  };

  const currentState: ProductState = {
    status: stateRaw.status ?? row.status ?? 'closed',
    openedAt: toDate(stateRaw.openedAt ?? stateRaw.opened_at ?? row.opened_at),
    lastConsumedAt: toDate(stateRaw.lastConsumedAt ?? stateRaw.last_consumed_at ?? row.last_consumed_at),
    remainingPercentage: toNumber(stateRaw.remainingPercentage ?? stateRaw.remaining_percentage ?? row.remaining_percentage, 100),
    condition: stateRaw.condition ?? row.condition ?? (isExpired ? 'expired' : isExpiringSoon ? 'expiring_soon' : 'fresh'),
  };

  const purchase: PurchaseInfo = {
    storeId: purchaseRaw.storeId ?? purchaseRaw.store_id ?? row.store_id,
    storeName: purchaseRaw.storeName ?? purchaseRaw.store_name ?? row.store_name,
    purchaseDate: toDate(purchaseRaw.purchaseDate ?? purchaseRaw.purchase_date ?? row.purchase_date) || new Date(),
    price: purchaseRaw.price ?? row.price,
    currency: purchaseRaw.currency ?? row.currency ?? 'BRL',
    quantity: toNumber(purchaseRaw.quantity ?? row.purchase_quantity ?? row.quantity, currentQuantity),
    unit: purchaseRaw.unit ?? row.unit ?? unit,
    receiptImage: purchaseRaw.receiptImage ?? purchaseRaw.receipt_image ?? row.receipt_image,
    warrantyInfo: purchaseRaw.warrantyInfo ?? purchaseRaw.warranty_info ?? row.warranty_info,
  };

  const category = typeof row.category === 'string'
    ? row.category
    : row.category?.name ?? row.category_name ?? 'Outros';

  return {
    id: row.id,
    name: row.name ?? '',
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    category,
    image: row.image ?? row.image_url ?? undefined,
    currentState,
    consumption: {
      originalQuantity,
      currentQuantity,
      unit,
      consumptionHistory: mapConsumptionHistory(consumptionRaw.consumptionHistory ?? consumptionRaw.consumption_history),
      averageConsumptionPerDay: toNumber(
        consumptionRaw.averageConsumptionPerDay ?? consumptionRaw.average_consumption_per_day ?? row.average_consumption_per_day,
        0
      ) || undefined,
      estimatedDepletionDate: toDate(
        consumptionRaw.estimatedDepletionDate ?? consumptionRaw.estimated_depletion_date ?? row.estimated_depletion_date
      ),
    },
    location,
    expiry,
    purchase,
    tags: row.tags || [],
    notes: row.notes ?? undefined,
    nutritionalInfo: row.nutritional_info ?? row.nutritionalInfo ?? undefined,
    householdId: row.household_id ?? row.householdId ?? '',
    createdAt: toDate(row.created_at ?? row.createdAt) || new Date(),
    updatedAt: toDate(row.updated_at ?? row.updatedAt) || new Date(),
  };
};

export const toProductRow = (
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product,
  userId?: string
): ProductRow => {
  const quantity = product.consumption.currentQuantity;
  const unit = product.consumption.unit;

  const location = compact({
    location_id: product.location.locationId,
    location_name: product.location.locationName,
    appliance_id: product.location.applianceId,
    compartment_id: product.location.compartmentId,
    shelf_id: product.location.shelfId,
    zone_id: product.location.zoneId,
    zone_name: product.location.zoneName,
    position: product.location.position,
  });

  return compact({
    user_id: userId,
    household_id: product.householdId || undefined,
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    category: product.category,
    image_url: product.image,
    quantity,
    unit,
    location,
    current_state: compact({
      status: product.currentState.status,
      opened_at: dateToIso(product.currentState.openedAt),
      last_consumed_at: dateToIso(product.currentState.lastConsumedAt),
      remaining_percentage: product.currentState.remainingPercentage,
      condition: product.currentState.condition,
    }),
    consumption: compact({
      original_quantity: product.consumption.originalQuantity,
      current_quantity: product.consumption.currentQuantity,
      unit: product.consumption.unit,
      consumption_history: product.consumption.consumptionHistory.map((record) => ({
        date: dateToIso(record.date),
        quantity_consumed: record.quantityConsumed,
        reason: record.reason,
        notes: record.notes,
      })),
      average_consumption_per_day: product.consumption.averageConsumptionPerDay,
      estimated_depletion_date: dateToIso(product.consumption.estimatedDepletionDate),
    }),
    sealed_expiry_date: dateToIso(product.expiry.sealedExpiryDate),
    opened_expiry_date: dateToIso(product.expiry.openedExpiryDate),
    best_before_date: dateToIso(product.expiry.bestBeforeDate),
    freeze_by_date: dateToIso(product.expiry.freezeByDate),
    expiry_metadata: compact({
      days_until_expiry: product.expiry.daysUntilExpiry,
      expiry_type: product.expiry.expiryType,
      is_expiring_soon: product.expiry.isExpiringSoon,
      is_expired: product.expiry.isExpired,
      risk_level: product.expiry.riskLevel,
      custom_expiry_rule: product.expiry.customExpiryRule,
    }),
    purchase_date: dateToIso(product.purchase.purchaseDate),
    purchase_info: compact({
      store_id: product.purchase.storeId,
      store_name: product.purchase.storeName,
      purchase_date: dateToIso(product.purchase.purchaseDate),
      price: product.purchase.price,
      currency: product.purchase.currency,
      quantity: product.purchase.quantity,
      unit: product.purchase.unit,
      receipt_image: product.purchase.receiptImage,
      warranty_info: product.purchase.warrantyInfo,
    }),
    tags: product.tags || [],
    notes: product.notes,
    nutritional_info: product.nutritionalInfo,
    updated_at: new Date().toISOString(),
  });
};

export const toProductUpdateRow = (updates: Partial<Product>): ProductRow => {
  const row: ProductRow = {};

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.brand !== undefined) row.brand = updates.brand;
  if (updates.barcode !== undefined) row.barcode = updates.barcode;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.image !== undefined) row.image_url = updates.image;
  if (updates.householdId !== undefined) row.household_id = updates.householdId;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.nutritionalInfo !== undefined) row.nutritional_info = updates.nutritionalInfo;

  if (
    updates.currentState
  ) {
    row.current_state = compact({
      status: updates.currentState.status,
      opened_at: dateToIso(updates.currentState.openedAt),
      last_consumed_at: dateToIso(updates.currentState.lastConsumedAt),
      remaining_percentage: updates.currentState.remainingPercentage,
      condition: updates.currentState.condition,
    });
  }

  if (updates.consumption) {
    row.quantity = updates.consumption.currentQuantity;
    row.unit = updates.consumption.unit;
    row.consumption = compact({
      original_quantity: updates.consumption.originalQuantity,
      current_quantity: updates.consumption.currentQuantity,
      unit: updates.consumption.unit,
      consumption_history: updates.consumption.consumptionHistory.map((record) => ({
        date: dateToIso(record.date),
        quantity_consumed: record.quantityConsumed,
        reason: record.reason,
        notes: record.notes,
      })),
      average_consumption_per_day: updates.consumption.averageConsumptionPerDay,
      estimated_depletion_date: dateToIso(updates.consumption.estimatedDepletionDate),
    });
  }

  if (updates.location) {
    row.location = compact({
      location_id: updates.location.locationId,
      location_name: updates.location.locationName,
      appliance_id: updates.location.applianceId,
      compartment_id: updates.location.compartmentId,
      shelf_id: updates.location.shelfId,
      zone_id: updates.location.zoneId,
      zone_name: updates.location.zoneName,
      position: updates.location.position,
    });
  }

  if (updates.expiry) {
    row.sealed_expiry_date = dateToIso(updates.expiry.sealedExpiryDate);
    row.opened_expiry_date = dateToIso(updates.expiry.openedExpiryDate);
    row.best_before_date = dateToIso(updates.expiry.bestBeforeDate);
    row.freeze_by_date = dateToIso(updates.expiry.freezeByDate);
    row.expiry_metadata = compact({
      days_until_expiry: updates.expiry.daysUntilExpiry,
      expiry_type: updates.expiry.expiryType,
      is_expiring_soon: updates.expiry.isExpiringSoon,
      is_expired: updates.expiry.isExpired,
      risk_level: updates.expiry.riskLevel,
      custom_expiry_rule: updates.expiry.customExpiryRule,
    });
  }

  if (updates.purchase) {
    row.purchase_date = dateToIso(updates.purchase.purchaseDate);
    row.purchase_info = compact({
      store_id: updates.purchase.storeId,
      store_name: updates.purchase.storeName,
      purchase_date: dateToIso(updates.purchase.purchaseDate),
      price: updates.purchase.price,
      currency: updates.purchase.currency,
      quantity: updates.purchase.quantity,
      unit: updates.purchase.unit,
      receipt_image: updates.purchase.receiptImage,
      warranty_info: updates.purchase.warrantyInfo,
    });
  }

  row.updated_at = new Date().toISOString();
  return compact(row);
};
