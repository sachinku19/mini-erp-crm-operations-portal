import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queryStr = ((req.query.q as string) || "").trim();

    if (!queryStr || queryStr.length < 2) {
      res.status(200).json({
        success: true,
        message: "Query too short",
        data: [],
      });
      return;
    }

    const searchTerm = `%${queryStr}%`;

    // 1. Search Customers
    const custSql = `
      SELECT id, name, business_name, email, customer_type
      FROM customers
      WHERE is_archived = FALSE
        AND (name ILIKE $1 OR business_name ILIKE $1 OR email ILIKE $1 OR mobile ILIKE $1)
      ORDER BY name ASC
      LIMIT 5
    `;

    // 2. Search Products
    const prodSql = `
      SELECT id, name, sku, current_stock, category
      FROM products
      WHERE is_archived = FALSE
        AND (name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1)
      ORDER BY name ASC
      LIMIT 5
    `;

    // 3. Search Challans
    const challanSql = `
      SELECT id, challan_number, status, total_quantity, created_at
      FROM challans
      WHERE challan_number ILIKE $1
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [custRes, prodRes, challanRes] = await Promise.all([
      pool.query(custSql, [searchTerm]),
      pool.query(prodSql, [searchTerm]),
      pool.query(challanSql, [searchTerm]),
    ]);

    const results: Array<{
      type: "CUSTOMER" | "PRODUCT" | "CHALLAN";
      id: string;
      title: string;
      subtitle: string;
      url: string;
    }> = [];

    // Map Customers
    custRes.rows.forEach((c) => {
      results.push({
        type: "CUSTOMER",
        id: c.id,
        title: c.name,
        subtitle: `${c.business_name} • ${c.customer_type}`,
        url: `/customers/${c.id}`,
      });
    });

    // Map Products
    prodRes.rows.forEach((p) => {
      results.push({
        type: "PRODUCT",
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku} • Stock: ${p.current_stock} units`,
        url: `/products/${p.id}`,
      });
    });

    // Map Challans
    challanRes.rows.forEach((ch) => {
      results.push({
        type: "CHALLAN",
        id: ch.id,
        title: ch.challan_number,
        subtitle: `Status: ${ch.status} • ${ch.total_quantity} items`,
        url: `/challans/${ch.id}`,
      });
    });

    res.status(200).json({
      success: true,
      message: "Search completed",
      data: results,
    });
  } catch (err) {
    next(err);
  }
};
