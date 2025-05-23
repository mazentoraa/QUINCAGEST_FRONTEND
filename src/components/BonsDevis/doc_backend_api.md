# Bon Retour API Documentation

## Overview

The Bon Retour API allows you to manage material returns with complete CRUD operations. Users can create return orders, track returned materials, and calculate totals automatically.

## Key Features

- **Material Availability Check**: Get materials available for return for each client
- **Quantity Validation**: Validate return quantities before creating the order
- **Status Management**: Track return status (draft, sent, completed, cancelled)
- **Complete CRUD**: Create, read, update, delete return orders

## API Endpoints

### 1. BonRetour CRUD Operations

#### List all Bons Retour

```
GET /api/bons-retour/
```

Query parameters:

- `search`: Search in numero_bon, client name, or notes
- `ordering`: Order by date_retour, date_reception, numero_bon
- `status`: Filter by status (draft, sent, completed, cancelled)
- `client`: Filter by client ID
- `date_retour`: Filter by return date
- `date_reception`: Filter by reception date

#### Get specific Bon Retour

```
GET /api/bons-retour/{id}/
```

#### Create new Bon Retour

```
POST /api/bons-retour/
```

Example payload:

```json
{
  "numero_bon": "BR-2025-001",
  "client": 1,
  "date_reception": "2025-05-23",
  "date_retour": "2025-05-23",
  "notes": "Return of unused materials",
  "matiere_retours": [
    {
      "matiere_id": 1,
      "quantite_retournee": 5
    },
    {
      "matiere_id": 2,
      "quantite_retournee": 3
    }
  ]
}
```

#### Update Bon Retour

```
PUT /api/bons-retour/{id}/
PATCH /api/bons-retour/{id}/
```

#### Delete Bon Retour

```
DELETE /api/bons-retour/{id}/
```

### 2. Helper Endpoints

#### Get Available Materials for Client

```
GET /api/clients/{client_id}/available-materials/
```

Returns all materials that have remaining_quantity > 0 for the specified client.

Response:

```json
{
  "client": {
    "id": 1,
    "nom_client": "Client Name",
    "numero_fiscal": "123456789"
  },
  "available_materials": [
    {
      "id": 1,
      "type_matiere": "acier",
      "description": "Steel plate",
      "thickness": 5,
      "length": 1000,
      "width": 500,
      "surface": 50,
      "remaining_quantity": 10
    }
  ]
}
```

#### Validate Return Quantities

```
POST /api/bons-retour/validate-quantities/
```

Validates that the requested return quantities don't exceed available quantities.

Payload:

```json
{
  "materials": [
    {
      "matiere_id": 1,
      "quantite_retournee": 5
    }
  ]
}
```

Response:

```json
{
  "is_valid": true,
  "validation_results": [
    {
      "matiere_id": 1,
      "matiere_name": "acier - Client Name",
      "requested_quantity": 5,
      "available_quantity": 10,
      "is_valid": true
    }
  ]
}
```

#### Get Bons Retour by Client

```
GET /api/clients/{client_id}/bons-retour/
```

#### Get Bon Retour Statistics

```
GET /api/bons-retour/stats/
```

Returns overall statistics about returns.

## Frontend Integration Flow

### 1. Creating a Bon Retour

1. **Select Client**: Choose client from dropdown
2. **Get Available Materials**:
   ```javascript
   GET /api/clients/{client_id}/available-materials/
   ```
3. **Show Materials**: Display materials with remaining_quantity as default return quantity (user can modify)
4. **Validate Quantities** (optional):
   ```javascript
   POST / api / bons - retour / validate - quantities;
   ```
5. **Create Bon Retour**:
   ```javascript
   POST /api/bons-retour/
   ```

### 2. Frontend Implementation Example

```javascript
// 1. Get available materials for client
const getAvailableMaterials = async (clientId) => {
  const response = await fetch(`/api/clients/${clientId}/available-materials/`);
  return await response.json();
};

// 2. Create bon retour with materials
const createBonRetour = async (bonRetourData) => {
  const response = await fetch("/api/bons-retour/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bonRetourData),
  });
  return await response.json();
};

// 3. Validate quantities before submitting
const validateQuantities = async (materials) => {
  const response = await fetch("/api/bons-retour/validate-quantities/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ materials }),
  });
  return await response.json();
};
```

## Model Fields

### BonRetour

- `numero_bon`: Unique return order number
- `client`: Foreign key to Client
- `status`: Status (draft, sent, completed, cancelled)
- `date_reception`: Date when materials were received back
- `date_retour`: Date of return
- `date_emission`: Date when bon was created (auto)
- `notes`: Additional notes

### MatiereRetour (Through Model)

- `bon_retour`: Foreign key to BonRetour
- `matiere`: Foreign key to Matiere
- `quantite_retournee`: Quantity of material returned

## Status Flow

1. **draft**: Initial creation
2. **sent**: Sent to client for confirmation
3. **completed**: Return process is finished (formerly 'paid')
4. **cancelled**: Cancelled order

## Notes

- Users start with remaining_quantity as default but can modify it
- Validation ensures return quantities don't exceed available quantities
- The API supports both full and partial returns of materials
