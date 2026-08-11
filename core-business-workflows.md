---
description: Customer, inventory, challan, dispatch, and cancellation workflows.
---

# Core Business Workflows

## Core Business Workflows

The portal connects customer activity with inventory and dispatch records. Each workflow creates an operational trail.

### Customer CRM

```
Customer → Customer Profile → Search / Filter → Create / Edit → Follow-up
```

Sales maintains customer-facing information and follow-up activity. Search, filtering, and pagination support operational discovery.

### Product and inventory

```
Product → Stock Availability → Stock IN/OUT → Inventory Ledger → Low Stock Monitoring
```

Warehouse activity is stock-facing. Product availability informs dispatch decisions. Stock movements provide the inventory ledger trail and support low-stock monitoring.

### Sales challan and dispatch

```
Select Customer → Add Products → Enter Quantities → Validate Stock
→ Review Dispatch → Confirm Challan → Reserve/Deduct Stock
→ Record Inventory Movement
```

Sales prepares the customer and product context. Warehouse validates availability and executes dispatch-related stock activity. The confirmed challan and inventory movement preserve the business record.

Professional PDF generation provides a challan document for the completed workflow.

### Cancellation

```
Existing Challan → Cancel Dispatch → Reverse Stock Effect
→ Record Inventory Adjustment → Update Status
```

Cancellation reverses the prior stock effect and records the corresponding adjustment. This keeps inventory aligned with the challan status.

### End-to-end operating flow

```
Customer → Sales → Warehouse → Inventory → Dispatch → Stock Update → Business Records
```

Admin provides oversight across the operating model. Accounts uses the resulting business records. Backend authorization controls every protected transition.

> **Control point**
>
> Stock must be validated before confirmation. Dispatch confirmation and cancellation are stock-affecting operations.
