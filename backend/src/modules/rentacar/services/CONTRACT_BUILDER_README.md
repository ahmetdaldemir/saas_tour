# Live Contract Builder System

## Overview

The Live Contract Builder is a legally-safe contract generation system for the Rent a Car SaaS platform. It allows tenants to create, customize, and manage contracts with real-time preview, digital signatures, and automated PDF generation.

## Features

### 1. Template Management
- **Customizable Templates**: Tenants can create multiple contract templates
- **Locked Legal Sections**: Core legal sections are protected and cannot be edited
- **Custom Sections**: Tenants can add and edit custom sections
- **Optional Blocks**: Enable/disable optional text blocks per contract
- **Styling**: Customize logo, colors (primary, secondary, text)

### 2. Live Preview
- Real-time HTML rendering as user inputs change
- Responsive preview that matches final PDF output
- Visual distinction between locked and editable sections

### 3. Digital Signatures
- Customer signature with name, email, phone
- Company signature
- Signature images (Base64 or URL)
- IP address and user agent tracking
- Timestamp recording

### 4. PDF Generation
- **Standard PDF**: A4 format for printing and email
- **Thermal PDF**: 80mm width optimized for thermal printers
- Automatic generation upon signing
- Stored with tenant_id for isolation

### 5. Email & WhatsApp Integration
- Automatic email sending after signature
- PDF attachment included
- WhatsApp support (ready for integration)
- Customer language support

### 6. Contract Management
- Unique contract numbers (CNT-YYYY-XXXXXX)
- Status tracking (draft, pending_signature, signed, cancelled)
- Link to reservations and vehicles
- Full audit trail

## Database Schema

### ContractTemplate Entity
```typescript
{
  tenantId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  sections: ContractSection[]; // JSONB
  optionalBlocks?: OptionalBlock[]; // JSONB
  variables?: Record<string, VariableDef>; // JSONB
  isActive: boolean;
  isDefault: boolean;
}
```

### Contract Entity
```typescript
{
  tenantId: string;
  templateId: string;
  vehicleId?: string;
  reservationId?: string;
  contractNumber: string; // Unique
  status: ContractStatus;
  content: {
    sections: Section[];
    variables: Record<string, string>;
    styling: Styling;
  };
  customerSignature?: DigitalSignature;
  companySignature?: DigitalSignature;
  pdfUrl?: string;
  emailSent: boolean;
  whatsappSent: boolean;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerIdNumber?: string;
}
```

## API Endpoints

### Templates
- `GET /rentacar/contracts/templates/default` - Get default template
- `GET /rentacar/contracts/templates` - List all templates
- `GET /rentacar/contracts/templates/:id` - Get template by ID
- `POST /rentacar/contracts/templates` - Create template
- `PUT /rentacar/contracts/templates/:id` - Update template
- `DELETE /rentacar/contracts/templates/:id` - Delete template

### Contracts
- `POST /rentacar/contracts/preview` - Preview contract (no save)
- `GET /rentacar/contracts` - List contracts
- `GET /rentacar/contracts/:id` - Get contract by ID
- `POST /rentacar/contracts` - Create contract
- `PUT /rentacar/contracts/:id` - Update contract (draft only)
- `POST /rentacar/contracts/:id/sign` - Sign contract
- `POST /rentacar/contracts/:id/generate-pdf` - Generate PDF
- `POST /rentacar/contracts/:id/generate-thermal-pdf` - Generate thermal PDF
- `DELETE /rentacar/contracts/:id` - Delete contract (draft only)

## Usage Example

### 1. Create Contract from Template

```typescript
const contract = await ContractService.create({
  tenantId: 'tenant-123',
  templateId: 'template-456',
  vehicleId: 'vehicle-789',
  reservationId: 'reservation-012',
  variables: {
    companyName: 'ABC Rent A Car',
    customerName: 'Ahmet Yılmaz',
    vehicleName: 'Toyota Corolla',
    plateNumber: '34 ABC 123',
  },
  optionalBlocks: [
    { id: 'insurance', isEnabled: true },
    { id: 'extras', isEnabled: false },
  ],
  customerName: 'Ahmet Yılmaz',
  customerEmail: 'ahmet@example.com',
  customerPhone: '+905551234567',
  customerIdNumber: '12345678901',
});
```

### 2. Sign Contract

```typescript
const signedContract = await ContractService.signContract(
  contractId,
  tenantId,
  {
    customerSignature: {
      signerName: 'Ahmet Yılmaz',
      signerEmail: 'ahmet@example.com',
      signatureImage: 'data:image/png;base64,...',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    },
    companySignature: {
      signerName: 'Mehmet Demir',
      signatureImage: 'data:image/png;base64,...',
    },
  }
);
```

### 3. Generate PDF

```typescript
// Standard PDF
const pdfUrl = await ContractService.generateContractPDF(contract);

// Thermal PDF
const thermalBuffer = await ContractService.generateThermalPDF(contract);
```

## Template Variables

Templates support dynamic variables using `{{variableName}}` syntax:

- `{{companyName}}` - Company name
- `{{customerName}}` - Customer name
- `{{vehicleName}}` - Vehicle name
- `{{plateNumber}}` - License plate
- `{{contractNumber}}` - Contract number
- `{{date}}` - Current date
- Custom variables defined in template

## Legal Safety

1. **Locked Sections**: Legal core sections cannot be edited after template creation
2. **Audit Trail**: All signatures include timestamps, IP addresses, and user agents
3. **PDF Storage**: Signed contracts are stored as immutable PDFs
4. **Tenant Isolation**: All contracts are tenant-scoped
5. **Status Tracking**: Contracts progress through defined states

## Frontend Component

The `ContractBuilder.vue` component provides:
- Live preview panel
- Form inputs for variables
- Template selection
- Optional blocks toggle
- Digital signature interface
- PDF download buttons
- Thermal printer support

## Thermal Printer Support

Thermal PDFs are optimized for 80mm thermal printers:
- Reduced font sizes
- Compact margins (5mm)
- Single-column layout
- Essential information only

## Email Integration

After signing, contracts are automatically:
1. PDF generated
2. Email sent to customer with PDF attachment
3. WhatsApp notification (ready for integration)

## Security Considerations

- All contracts are tenant-isolated
- Only draft contracts can be edited/deleted
- Signed contracts are immutable
- PDFs are stored securely with tenant_id
- Digital signatures include audit information

## Future Enhancements

- WhatsApp integration for contract delivery
- Multi-language contract templates
- Contract versioning
- E-signature providers integration (DocuSign, etc.)
- Contract analytics and reporting
- Automated contract renewal reminders

