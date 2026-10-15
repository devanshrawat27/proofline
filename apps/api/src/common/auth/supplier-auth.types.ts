/** The authenticated supplier principal, resolved from a supplier session. */
export interface SupplierPrincipal {
  supplierUserId: string;
  supplierUserEmail: string;
  supplierUserName: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  organizationId: string;
}
