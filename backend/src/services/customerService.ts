import { customerRepository } from "../repositories/customerRepository.js";
import type { CustomerRow } from "../repositories/customerRepository.js";
import type { CreateCustomerInput, QueryCustomerInput } from "../validators/customer.validation.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";

export interface PaginatedCustomers {
  rows: CustomerRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const customerService = {
  /**
   * Create a customer, checking for mobile number uniqueness.
   */
  async createCustomer(input: CreateCustomerInput): Promise<CustomerRow> {
    const existing = await customerRepository.findByMobile(input.mobile);
    if (existing) {
      throw new ConflictError("A customer with this mobile number already exists.", "DUPLICATE_MOBILE");
    }
    return customerRepository.create(input);
  },

  /**
   * Retrieve a paginated lists of customers, applying filters and search terms.
   */
  async getCustomers(query: QueryCustomerInput): Promise<PaginatedCustomers> {
    const { rows, total } = await customerRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      customer_type: query.customer_type,
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
   * Retrieve a single customer record by ID.
   */
  async getCustomerById(id: string): Promise<CustomerRow> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
    }
    return customer;
  },

  /**
   * Update fields of a customer, verifying that any changed mobile number is unique.
   */
  async updateCustomer(id: string, updates: Partial<CreateCustomerInput>): Promise<CustomerRow> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
    }

    if (updates.mobile && updates.mobile !== customer.mobile) {
      const existing = await customerRepository.findByMobile(updates.mobile, id);
      if (existing) {
        throw new ConflictError("A customer with this mobile number already exists.", "DUPLICATE_MOBILE");
      }
    }

    const updated = await customerRepository.update(id, updates);
    if (!updated) {
      throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
    }
    return updated;
  },

  /**
   * Delete a customer.
   */
  async deleteCustomer(id: string): Promise<void> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError("Customer not found.", "CUSTOMER_NOT_FOUND");
    }
    await customerRepository.delete(id);
  },
};
