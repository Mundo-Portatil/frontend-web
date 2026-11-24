export { CategoriesPage } from './pages/CategoriesPage';
export type { Category, CreateCategoryInput, UpdateCategoryInput, CategoryQuery } from './models';
export type { CatalogItem, CatalogDetail, CatalogQuery, CatalogPageResult, CreateCatalogInput } from './catalogModels';
export type { HardwareItem, ItemStatus, BarcodeLabel, SerialValidation } from './hardwareModels';
export type { QuantityStock, QuantityStockQuery, QuantityStockPageResult, InboundQuantityStockInput, AdjustQuantityStockInput } from './quantityModels';

// Public read interfaces reused by logistics; writes remain in their owning module.
export { CatalogProductPicker } from './components/CatalogProductPicker';
export { scanHardware } from './services/hardwareItemService';
export { listCatalog, getCatalogDetail } from './services/catalogService';
export { listQuantityStock } from './services/quantityStockService';
export { listHardwareUnits, getHardwareLifecycle } from './services/hardwareReadService';
export type { HardwareLifecycle, HardwareListQuery } from './hardwareReadModels';
