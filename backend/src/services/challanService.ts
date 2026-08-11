import { runInTransaction } from "../config/database.js";
import { challanRepository } from "../repositories/challanRepository.js";
import type { ChallanRow, ChallanItemRow } from "../repositories/challanRepository.js";
import { customerRepository } from "../repositories/customerRepository.js";
import { productRepository } from "../repositories/productRepository.js";
import { inventoryRepository } from "../repositories/inventoryRepository.js";
import type { CreateChallanInput, UpdateChallanInput, QueryChallanInput } from "../validators/challan.validation.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

export interface ChallanDetails extends ChallanRow {
  items: ChallanItemRow[];
}

export interface PaginatedChallans {
  rows: ChallanRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const challanService = {
  /**
   * Helper to generate a unique sequential challan number (CH-YYYYMMDD-XXXX).
   */
  async generateChallanNumber(client: any): Promise<string> {
    const todayCount = await challanRepository.getTodayCount(client);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const sequenceStr = String(todayCount + 1).padStart(4, "0");
    return `CH-${dateStr}-${sequenceStr}`;
  },

  /**
   * Create a new sales challan (defaults to DRAFT, optionally CONFIRMED).
   */
  async createChallan(userId: string, input: CreateChallanInput): Promise<ChallanDetails> {
    return runInTransaction(async (client) => {
      // 1. Verify customer exists
      const customer = await customerRepository.findById(input.customer_id);
      if (!customer) {
        throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
      }

      // 2. Generate unique challan number
      const challanNumber = await this.generateChallanNumber(client);

      // 3. Resolve products and construct snapshots
      const itemsSnapshot: Array<{
        product_id: string;
        product_name: string;
        sku: string;
        unit_price: number;
        quantity: number;
      }> = [];

      let totalQuantity = 0;

      for (const item of input.items) {
        const product = await productRepository.findById(item.product_id, client);
        if (!product) {
          throw new NotFoundError(`Product not found: ${item.product_id}`, "PRODUCT_NOT_FOUND");
        }

        totalQuantity += item.quantity;
        itemsSnapshot.push({
          product_id: item.product_id,
          product_name: product.name,
          sku: product.sku,
          unit_price: product.unit_price,
          quantity: item.quantity,
        });
      }

      const initialStatus = input.status || "DRAFT";

      // 4. Create challan document
      const challan = await challanRepository.create(
        {
          challan_number: challanNumber,
          customer_id: input.customer_id,
          total_quantity: totalQuantity,
          status: initialStatus as "DRAFT" | "CONFIRMED" | "CANCELLED",
          created_by: userId,
        },
        client
      );

      // 5. Create challan items (snapshots)
      const createdItems: ChallanItemRow[] = [];
      for (const snapshot of itemsSnapshot) {
        const createdItem = await challanRepository.createItem(
          {
            challan_id: challan.id,
            ...snapshot,
          },
          client
        );
        createdItems.push(createdItem);
      }

      // 6. If status is CONFIRMED, perform stock deduction
      if (initialStatus === "CONFIRMED") {
        for (const item of createdItems) {
          // Lock product row to prevent concurrency issues
          const product = await productRepository.lockStock(item.product_id!, client);
          if (!product) {
            throw new NotFoundError(`Product not found: ${item.product_name}`, "PRODUCT_NOT_FOUND");
          }

          if (product.current_stock < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for product '${product.name}'. Available: ${product.current_stock}, Requested: ${item.quantity}.`,
              "INSUFFICIENT_STOCK"
            );
          }

          // Deduct stock
          await productRepository.updateStock(item.product_id!, -item.quantity, client);

          // Log stock OUT movement
          await inventoryRepository.create(
            {
              product_id: item.product_id!,
              quantity_changed: item.quantity,
              movement_type: "OUT",
              reason: `Sales Challan Confirmation (${challan.challan_number})`,
              created_by: userId,
            },
            client
          );
        }
      }

      return {
        ...challan,
        items: createdItems,
      };
    });
  },

  /**
   * Retrieve list of challans.
   */
  async getChallans(query: QueryChallanInput): Promise<PaginatedChallans> {
    const { rows, total } = await challanRepository.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      customer_id: query.customer_id,
      search: query.search,
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Retrieve single challan details including items.
   */
  async getChallanById(id: string): Promise<ChallanDetails> {
    const challan = await challanRepository.findById(id);
    if (!challan) {
      throw new NotFoundError("Challan not found.", "CHALLAN_NOT_FOUND");
    }

    const items = await challanRepository.findItemsByChallanId(id);

    return {
      ...challan,
      items,
    };
  },

  /**
   * Update details of an existing DRAFT challan.
   */
  async updateChallan(
    id: string,
    userId: string,
    updates: UpdateChallanInput
  ): Promise<ChallanDetails> {
    return runInTransaction(async (client) => {
      // 1. Lock the challan row
      const challan = await challanRepository.lockChallan(id, client);
      if (!challan) {
        throw new NotFoundError("Challan not found.", "CHALLAN_NOT_FOUND");
      }

      // 2. Validate state: Only DRAFT challans can be updated
      if (challan.status !== "DRAFT") {
        throw new BadRequestError(
          "Confirmed or Cancelled challans cannot be modified.",
          "INVALID_CHALLAN_STATE"
        );
      }

      // 3. Update customer if requested
      let customerId = challan.customer_id;
      if (updates.customer_id) {
        const customer = await customerRepository.findById(updates.customer_id);
        if (!customer) {
          throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
        }
        customerId = updates.customer_id;
      }

      let totalQuantity = challan.total_quantity;
      let items: ChallanItemRow[] = [];

      // 4. Update items if requested
      if (updates.items) {
        // Clear existing items
        await challanRepository.deleteItems(id, client);

        totalQuantity = 0;
        const itemsSnapshot: Array<{
          product_id: string;
          product_name: string;
          sku: string;
          unit_price: number;
          quantity: number;
        }> = [];

        for (const item of updates.items) {
          const product = await productRepository.findById(item.product_id, client);
          if (!product) {
            throw new NotFoundError(`Product not found: ${item.product_id}`, "PRODUCT_NOT_FOUND");
          }

          totalQuantity += item.quantity;
          itemsSnapshot.push({
            product_id: item.product_id,
            product_name: product.name,
            sku: product.sku,
            unit_price: product.unit_price,
            quantity: item.quantity,
          });
        }

        // Insert new items
        for (const snapshot of itemsSnapshot) {
          const createdItem = await challanRepository.createItem(
            {
              challan_id: id,
              ...snapshot,
            },
            client
          );
          items.push(createdItem);
        }
      } else {
        // Fetch current items
        items = await challanRepository.findItemsByChallanId(id, client);
      }

      // 5. Update challan header
      const updatedChallan = await challanRepository.update(
        id,
        {
          customer_id: customerId,
          total_quantity: totalQuantity,
          status: updates.status as "DRAFT" | "CONFIRMED" | "CANCELLED" | undefined,
        },
        client
      );

      // 6. Handle stock deduction if status changed to CONFIRMED
      if (updates.status === "CONFIRMED") {
        for (const item of items) {
          // Lock product row to prevent concurrency issues
          const product = await productRepository.lockStock(item.product_id!, client);
          if (!product) {
            throw new NotFoundError(`Product not found: ${item.product_name}`, "PRODUCT_NOT_FOUND");
          }

          if (product.current_stock < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for product '${product.name}'. Available: ${product.current_stock}, Requested: ${item.quantity}.`,
              "INSUFFICIENT_STOCK"
            );
          }

          // Deduct stock
          await productRepository.updateStock(item.product_id!, -item.quantity, client);

          // Log stock OUT movement
          await inventoryRepository.create(
            {
              product_id: item.product_id!,
              quantity_changed: item.quantity,
              movement_type: "OUT",
              reason: `Sales Challan Confirmation (${challan.challan_number})`,
              created_by: userId,
            },
            client
          );
        }
      }

      const freshDetails = await challanRepository.findById(id, client);

      return {
        ...freshDetails!,
        items,
      };
    });
  },

  /**
   * Confirm a DRAFT challan, deducting product stocks and recording stock movements.
   */
  async confirmChallan(id: string, userId: string): Promise<ChallanDetails> {
    return runInTransaction(async (client) => {
      // 1. Lock the challan row
      const challan = await challanRepository.lockChallan(id, client);
      if (!challan) {
        throw new NotFoundError("Challan not found.", "CHALLAN_NOT_FOUND");
      }

      // 2. Validate state: Only DRAFT challans can be confirmed
      if (challan.status !== "DRAFT") {
        throw new BadRequestError("Only DRAFT challans can be confirmed.", "INVALID_CHALLAN_STATE");
      }

      // 3. Fetch items
      const items = await challanRepository.findItemsByChallanId(id, client);

      // 4. Validate stock availability and deduct
      for (const item of items) {
        // Lock product row
        const product = await productRepository.lockStock(item.product_id!, client);
        if (!product) {
          throw new NotFoundError(`Product not found: ${item.product_name}`, "PRODUCT_NOT_FOUND");
        }

        if (product.current_stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for product '${product.name}'. Available: ${product.current_stock}, Requested: ${item.quantity}.`,
            "INSUFFICIENT_STOCK"
          );
        }

        // Deduct stock
        await productRepository.updateStock(item.product_id!, -item.quantity, client);

        // Record stock movement (OUT)
        await inventoryRepository.create(
          {
            product_id: item.product_id!,
            quantity_changed: item.quantity,
            movement_type: "OUT",
            reason: `Sales Challan Confirmation (${challan.challan_number})`,
            created_by: userId,
          },
          client
        );
      }

      // 5. Update challan status
      await challanRepository.update(id, { status: "CONFIRMED" }, client);

      const freshDetails = await challanRepository.findById(id, client);

      return {
        ...freshDetails!,
        items,
      };
    });
  },

  /**
   * Cancel an existing challan. If the challan is already CONFIRMED,
   * returning stocks and recording stock movements (IN).
   */
  async cancelChallan(id: string, userId: string): Promise<ChallanDetails> {
    return runInTransaction(async (client) => {
      // 1. Lock the challan row
      const challan = await challanRepository.lockChallan(id, client);
      if (!challan) {
        throw new NotFoundError("Challan not found.", "CHALLAN_NOT_FOUND");
      }

      // 2. Validate state: Cannot cancel if already cancelled
      if (challan.status === "CANCELLED") {
        throw new BadRequestError("Challan is already cancelled.", "INVALID_CHALLAN_STATE");
      }

      const items = await challanRepository.findItemsByChallanId(id, client);

      // 3. Return stock if status was CONFIRMED
      if (challan.status === "CONFIRMED") {
        for (const item of items) {
          if (item.product_id) {
            // Lock product row
            await productRepository.lockStock(item.product_id, client);

            // Add stock back
            await productRepository.updateStock(item.product_id, item.quantity, client);

            // Record stock movement (IN)
            await inventoryRepository.create(
              {
                product_id: item.product_id,
                quantity_changed: item.quantity,
                movement_type: "IN",
                reason: `Sales Challan Cancellation (${challan.challan_number})`,
                created_by: userId,
              },
              client
            );
          }
        }
      }

      // 4. Update status to CANCELLED
      await challanRepository.update(id, { status: "CANCELLED" }, client);

      const freshDetails = await challanRepository.findById(id, client);

      return {
        ...freshDetails!,
        items,
      };
    });
  },
};
