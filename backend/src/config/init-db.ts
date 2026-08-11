import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool, checkDatabaseConnection } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
  console.log("========================================");
  console.log("🌀 Starting Database Initialization...");
  console.log("========================================");

  // 1. Verify connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error("❌ Database connection could not be established. Exiting.");
    process.exit(1);
  }

  try {
    // 2. Read and run schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    console.log(`Reading schema SQL from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    console.log("Executing schema SQL queries...");
    await pool.query(schemaSql);
    console.log("✅ Schema initialized successfully (tables and indexes created).");

    // 3. Seed Users if table is empty
    const userCheck = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(userCheck.rows[0].count, 10);

    if (userCount === 0) {
      console.log("Seeding default users...");
      const salt = bcrypt.genSaltSync(10);
      const defaultUsers = [
        {
          email: "admin@infotech.com",
          name: "Admin User",
          role: "Admin",
          password_hash: bcrypt.hashSync("admin123", salt),
        },
        {
          email: "sales@infotech.com",
          name: "Sales Agent",
          role: "Sales",
          password_hash: bcrypt.hashSync("sales123", salt),
        },
        {
          email: "warehouse@infotech.com",
          name: "Warehouse Manager",
          role: "Warehouse",
          password_hash: bcrypt.hashSync("warehouse123", salt),
        },
        {
          email: "accounts@infotech.com",
          name: "Accountant User",
          role: "Accounts",
          password_hash: bcrypt.hashSync("accounts123", salt),
        },
      ];

      for (const u of defaultUsers) {
        await pool.query(
          "INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4)",
          [u.email, u.name, u.role, u.password_hash]
        );
        console.log(`- Seeded user: ${u.email} (${u.role})`);
      }
      console.log("✅ Default users seeded.");
    } else {
      console.log("Users table already seeded, skipping user seeding.");
    }

    // 4. Seed Products if table is empty
    const productCheck = await pool.query("SELECT COUNT(*) FROM products");
    const productCount = parseInt(productCheck.rows[0].count, 10);

    if (productCount === 0) {
      console.log("Seeding sample products...");
      const defaultProducts = [
        {
          name: "Apple iPhone 15 Pro",
          sku: "PRD-APP-001",
          category: "Electronics",
          unit_price: 999.00,
          current_stock: 50,
          minimum_stock_alert_quantity: 10,
          location_warehouse: "Warehouse A",
        },
        {
          name: "Apple MacBook Pro 14",
          sku: "PRD-MAC-002",
          category: "Electronics",
          unit_price: 1999.00,
          current_stock: 20,
          minimum_stock_alert_quantity: 5,
          location_warehouse: "Warehouse A",
        },
        {
          name: "Samsung Galaxy S24 Ultra",
          sku: "PRD-SAM-003",
          category: "Electronics",
          unit_price: 1199.00,
          current_stock: 40,
          minimum_stock_alert_quantity: 8,
          location_warehouse: "Warehouse B",
        },
      ];

      for (const p of defaultProducts) {
        await pool.query(
          `INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock_alert_quantity, location_warehouse) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            p.name,
            p.sku,
            p.category,
            p.unit_price,
            p.current_stock,
            p.minimum_stock_alert_quantity,
            p.location_warehouse,
          ]
        );
        console.log(`- Seeded product: ${p.name} (SKU: ${p.sku})`);
      }
      console.log("✅ Sample products seeded.");
    } else {
      console.log("Products table already seeded, skipping product seeding.");
    }

    // 5. Seed Customers if table is empty
    const customerCheck = await pool.query("SELECT COUNT(*) FROM customers");
    const customerCount = parseInt(customerCheck.rows[0].count, 10);

    if (customerCount === 0) {
      console.log("Seeding sample customers...");
      const defaultCustomers = [
        {
          name: "John Doe",
          mobile: "9876543210",
          email: "john.doe@gmail.com",
          business_name: "Doe Retailers",
          gst_number: "27AAAAA1111A1Z1",
          customer_type: "RETAIL",
          address: "123 Main St, New York, NY 10001",
          status: "ACTIVE",
          notes: "Preferred retail customer",
        },
        {
          name: "Acme Corp",
          mobile: "9998887776",
          email: "purchasing@acme.com",
          business_name: "Acme Wholesale Ltd",
          gst_number: "27BBBBB2222B2Z2",
          customer_type: "WHOLESALE",
          address: "456 Industrial Blvd, Chicago, IL 60609",
          status: "ACTIVE",
          notes: "Major wholesale buyer, Net-30 credit terms",
        },
        {
          name: "Global Distributors",
          mobile: "8887776665",
          email: "contact@globaldist.com",
          business_name: "Global Distributors Ltd",
          gst_number: null,
          customer_type: "DISTRIBUTOR",
          address: "789 Logistics Way, Houston, TX 77001",
          status: "LEAD",
          notes: "Potential distributor lead from Midwest region",
        },
      ];

      for (const c of defaultCustomers) {
        await pool.query(
          `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            c.name,
            c.mobile,
            c.email,
            c.business_name,
            c.gst_number,
            c.customer_type,
            c.address,
            c.status,
            c.notes,
          ]
        );
        console.log(`- Seeded customer: ${c.name} (${c.business_name})`);
      }
      console.log("✅ Sample customers seeded.");
    } else {
      console.log("Customers table already seeded, skipping customer seeding.");
    }

    console.log("========================================");
    console.log("🎉 Database Setup Completed Successfully!");
    console.log("========================================");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
