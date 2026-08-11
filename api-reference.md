---
description: Implemented REST endpoints, authentication, and response conventions.
---

# API Reference

## API Reference

Protected requests use JWT bearer authentication.

```http
Authorization: Bearer <token>
```

Request fields and endpoint-level role grants are validated by the implementation. This reference intentionally does not invent payload schemas or role mappings.

### Response conventions

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| `200`  | Request completed successfully                  |
| `201`  | Resource created successfully                   |
| `400`  | Request validation failed                       |
| `401`  | Authentication is missing, invalid, or expired  |
| `403`  | Authenticated user lacks required authorization |
| `404`  | Requested resource does not exist               |
| `500`  | Unexpected server error                         |

### Authentication

| Method | Endpoint             | Purpose                              | Authentication |
| ------ | -------------------- | ------------------------------------ | -------------- |
| `POST` | `/api/v1/auth/login` | Validate credentials and issue a JWT | No             |

### Customers

| Method   | Endpoint         | Purpose             | Authentication |
| -------- | ---------------- | ------------------- | -------------- |
| `GET`    | `/customers`     | List customers      | Required       |
| `POST`   | `/customers`     | Create a customer   | Required       |
| `GET`    | `/customers/:id` | Retrieve a customer | Required       |
| `PUT`    | `/customers/:id` | Update a customer   | Required       |
| `DELETE` | `/customers/:id` | Delete a customer   | Required       |

### Products

| Method | Endpoint        | Purpose            | Authentication |
| ------ | --------------- | ------------------ | -------------- |
| `GET`  | `/products`     | List products      | Required       |
| `POST` | `/products`     | Create a product   | Required       |
| `GET`  | `/products/:id` | Retrieve a product | Required       |
| `PUT`  | `/products/:id` | Update a product   | Required       |

### Inventory

| Method | Endpoint              | Purpose                 | Authentication |
| ------ | --------------------- | ----------------------- | -------------- |
| `POST` | `/inventory/movement` | Record a stock movement | Required       |
| `GET`  | `/inventory/movement` | List stock movements    | Required       |

### Challans

| Method | Endpoint                | Purpose                  | Authentication |
| ------ | ----------------------- | ------------------------ | -------------- |
| `GET`  | `/challans`             | List sales challans      | Required       |
| `POST` | `/challans`             | Create a sales challan   | Required       |
| `GET`  | `/challans/:id`         | Retrieve a sales challan | Required       |
| `PUT`  | `/challans/:id`         | Update a sales challan   | Required       |
| `POST` | `/challans/:id/confirm` | Confirm a challan        | Required       |
| `POST` | `/challans/:id/cancel`  | Cancel a challan         | Required       |

### Validation and errors

Path parameters identify a single resource. Request bodies are validated before processing. Inventory and challan operations also enforce applicable business rules, including stock validation.

A client should handle `400`, `401`, `403`, `404`, and `500` explicitly. It must never assume a hidden UI action indicates authorization.
