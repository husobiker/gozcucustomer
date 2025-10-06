import { supabase } from "../lib/supabase";

// Types
export interface Product {
  id: string;
  name: string;
  product_code?: string | null;
  barcode?: string | null;
  category: string;
  type: "product" | "service";
  unit: string;
  description?: string | null;
  stock_tracking: boolean;
  critical_stock_level: number;
  purchase_price_excluding_tax: number;
  sale_price_excluding_tax: number;
  vat_rate: number;
  purchase_price_including_tax: number;
  sale_price_including_tax: number;
  currency: string;
  gtip_codes?: string[] | null;
  status: "active" | "inactive" | "discontinued";
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  country: string;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  is_default: boolean;
  is_abroad: boolean;
  warehouse_type: "main" | "branch" | "virtual" | "customer";
  responsible_person?: string | null;
  responsible_person_phone?: string | null;
  responsible_person_email?: string | null;
  status: "active" | "inactive" | "maintenance";
  created_at: string;
  updated_at: string;
}

export interface InventoryStock {
  id: string;
  product_id: string;
  warehouse_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  last_stock_update: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTransfer {
  id: string;
  transfer_number: string;
  movement_name: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  transfer_type: "internal" | "external" | "return" | "adjustment";
  transfer_reason?: string;
  delivering_person?: string;
  receiving_person?: string;
  preparation_date: string;
  planned_shipment_date?: string;
  actual_shipment_date?: string;
  planned_receipt_date?: string;
  actual_receipt_date?: string;
  status:
    | "pending"
    | "prepared"
    | "shipped"
    | "received"
    | "completed"
    | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  requested_quantity: number;
  prepared_quantity: number;
  shipped_quantity: number;
  received_quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  status:
    | "pending"
    | "prepared"
    | "shipped"
    | "received"
    | "completed"
    | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  movement_number: string;
  movement_type:
    | "purchase"
    | "sale"
    | "transfer_in"
    | "transfer_out"
    | "adjustment"
    | "return"
    | "production"
    | "consumption"
    | "loss"
    | "found";
  reference_type?: string;
  reference_id?: string;
  product_id: string;
  warehouse_id: string;
  quantity_before: number;
  movement_quantity: number;
  quantity_after: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  movement_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Product Services
export const productService = {
  // Get all products with stock information
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products_services")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products_services")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new product
  async createProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product> {
    const { data, error } = await supabase
      .from("products_services")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products_services")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products_services")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },

  // Get products with stock information
  async getProductsWithStock(): Promise<
    (Product & { stock_info: InventoryStock[] })[]
  > {
    const { data, error } = await supabase
      .from("products_services")
      .select(
        `
        *,
        inventory_stock (
          id,
          warehouse_id,
          current_stock,
          available_stock,
          reserved_stock,
          min_stock_level,
          max_stock_level,
          warehouses (
            id,
            name,
            is_default
          )
        )
      `
      )
      .eq("status", "active")
      .eq("stock_tracking", true)
      .order("name");

    if (error) throw error;
    return data || [];
  },
};

// Warehouse Services
export const warehouseService = {
  // Get all warehouses
  async getAllWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get warehouse by ID
  async getWarehouseById(id: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new warehouse
  async createWarehouse(
    warehouse: Omit<Warehouse, "id" | "created_at" | "updated_at">
  ): Promise<Warehouse> {
    const { data, error } = await supabase
      .from("warehouses")
      .insert([warehouse])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update warehouse
  async updateWarehouse(
    id: string,
    updates: Partial<Warehouse>
  ): Promise<Warehouse> {
    const { data, error } = await supabase
      .from("warehouses")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete warehouse
  async deleteWarehouse(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouses")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },
};

// Inventory Stock Services
export const inventoryStockService = {
  // Get stock for a product in all warehouses
  async getProductStock(productId: string): Promise<InventoryStock[]> {
    const { data, error } = await supabase
      .from("inventory_stock")
      .select(
        `
        *,
        warehouses (
          id,
          name,
          is_default
        )
      `
      )
      .eq("product_id", productId);

    if (error) throw error;
    return data || [];
  },

  // Get stock for a warehouse
  async getWarehouseStock(warehouseId: string): Promise<InventoryStock[]> {
    const { data, error } = await supabase
      .from("inventory_stock")
      .select(
        `
        *,
        products_services (
          id,
          name,
          product_code,
          unit
        )
      `
      )
      .eq("warehouse_id", warehouseId);

    if (error) throw error;
    return data || [];
  },

  // Get stock report
  async getStockReport(warehouseId?: string): Promise<any[]> {
    let query = supabase.rpc("get_stock_report");

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Adjust stock
  async adjustStock(
    productId: string,
    warehouseId: string,
    newQuantity: number,
    reason: string = "Stok düzeltme"
  ): Promise<void> {
    const { error } = await supabase.rpc("adjust_stock", {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
      p_new_quantity: newQuantity,
      p_reason: reason,
    });

    if (error) throw error;
  },
};

// Warehouse Transfer Services
export const warehouseTransferService = {
  // Get all transfers
  async getAllTransfers(): Promise<
    (WarehouseTransfer & {
      source_warehouse: { id: string; name: string; code?: string | null };
      destination_warehouse: { id: string; name: string; code?: string | null };
      transfer_items: WarehouseTransferItem[];
    })[]
  > {
    const { data, error } = await supabase
      .from("warehouse_transfers")
      .select(
        `
        *,
        source_warehouse:warehouses!source_warehouse_id (
          id,
          name,
          code
        ),
        destination_warehouse:warehouses!destination_warehouse_id (
          id,
          name,
          code
        ),
        warehouse_transfer_items (
          *,
          products_services (
            id,
            name,
            product_code,
            unit
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get transfer by ID
  async getTransferById(id: string): Promise<WarehouseTransfer | null> {
    const { data, error } = await supabase
      .from("warehouse_transfers")
      .select(
        `
        *,
        source_warehouse:warehouses!source_warehouse_id (*),
        destination_warehouse:warehouses!destination_warehouse_id (*),
        warehouse_transfer_items (
          *,
          products_services (*)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new transfer
  async createTransfer(
    transfer: Omit<
      WarehouseTransfer,
      "id" | "transfer_number" | "created_at" | "updated_at"
    >
  ): Promise<WarehouseTransfer> {
    const { data, error } = await supabase
      .from("warehouse_transfers")
      .insert([transfer])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update transfer
  async updateTransfer(
    id: string,
    updates: Partial<WarehouseTransfer>
  ): Promise<WarehouseTransfer> {
    const { data, error } = await supabase
      .from("warehouse_transfers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add item to transfer
  async addTransferItem(
    item: Omit<WarehouseTransferItem, "id" | "created_at" | "updated_at">
  ): Promise<WarehouseTransferItem> {
    const { data, error } = await supabase
      .from("warehouse_transfer_items")
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update transfer item
  async updateTransferItem(
    id: string,
    updates: Partial<WarehouseTransferItem>
  ): Promise<WarehouseTransferItem> {
    const { data, error } = await supabase
      .from("warehouse_transfer_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Execute transfer (move stock)
  async executeTransfer(transferId: string): Promise<void> {
    // Get transfer items
    const { data: items, error: itemsError } = await supabase
      .from("warehouse_transfer_items")
      .select(
        `
        *,
        warehouse_transfers (
          source_warehouse_id,
          destination_warehouse_id
        )
      `
      )
      .eq("transfer_id", transferId);

    if (itemsError) throw itemsError;

    // Execute stock transfer for each item
    for (const item of items || []) {
      const { error } = await supabase.rpc("transfer_stock", {
        p_product_id: item.product_id,
        p_source_warehouse_id: item.warehouse_transfers.source_warehouse_id,
        p_destination_warehouse_id:
          item.warehouse_transfers.destination_warehouse_id,
        p_quantity: item.requested_quantity,
        p_transfer_id: transferId,
        p_description: `Transfer: ${
          item.warehouse_transfers.movement_name || "Depo transferi"
        }`,
      });

      if (error) throw error;
    }

    // Update transfer status
    await this.updateTransfer(transferId, {
      status: "completed",
      actual_shipment_date: new Date().toISOString().split("T")[0],
      actual_receipt_date: new Date().toISOString().split("T")[0],
    });
  },

  // Delete transfer
  async deleteTransfer(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouse_transfers")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },
};

// Inventory Movement Services
export const inventoryMovementService = {
  // Get all movements
  async getAllMovements(): Promise<
    (InventoryMovement & {
      product: Product;
      warehouse: Warehouse;
    })[]
  > {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(
        `
        *,
        products_services (
          id,
          name,
          product_code,
          unit
        ),
        warehouses (
          id,
          name,
          code
        )
      `
      )
      .order("movement_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get movements for a product
  async getProductMovements(productId: string): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(
        `
        *,
        warehouses (
          id,
          name,
          code
        )
      `
      )
      .eq("product_id", productId)
      .order("movement_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get movements for a warehouse
  async getWarehouseMovements(
    warehouseId: string
  ): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(
        `
        *,
        products_services (
          id,
          name,
          product_code,
          unit
        )
      `
      )
      .eq("warehouse_id", warehouseId)
      .order("movement_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

export default {
  productService,
  warehouseService,
  inventoryStockService,
  warehouseTransferService,
  inventoryMovementService,
};
