export type Region = 'India' | 'KSA';

export interface TaxDetails {
  baseAmount: number; // Revenue
  expenseAmount: number;
  netProfit: number;
  
  // Indirect Tax (VAT/GST) - Added to customer invoice, given to gov
  indirectTaxRate: number; 
  indirectTaxAmount: number;
  totalInvoiceAmount: number; // baseAmount + indirectTaxAmount
  
  // Direct Tax (Corporate Tax on Profit) - Deducted from company profit, given to gov
  corporateTaxRate: number;
  corporateTaxAmount: number;
  
  // What the company keeps after paying corporate tax
  netIncomeAfterTax: number;

  // Total obligation to Government
  totalGovernmentTax: number; // indirectTaxAmount + corporateTaxAmount

  region: Region;
  currency: string;
}

export function calculateComprehensiveTax(revenue: number, expense: number, region: Region): TaxDetails {
  let indirectTaxRate = 0; // GST or VAT
  let corporateTaxRate = 0; // Corporate Income Tax
  let currency = '';

  if (region === 'India') {
    indirectTaxRate = 0.18; // 18% GST
    corporateTaxRate = 0.25; // 25% Corporate Tax on Net Profit
    currency = 'INR';
  } else if (region === 'KSA') {
    indirectTaxRate = 0.15; // 15% VAT
    corporateTaxRate = 0.20; // 20% Corporate Income Tax on Net Profit
    currency = 'SAR';
  }

  // 1. Indirect Tax Calculation (Customer pays this)
  const indirectTaxAmount = revenue * indirectTaxRate;
  const totalInvoiceAmount = revenue + indirectTaxAmount;

  // 2. Profit Calculation
  const netProfit = revenue - expense;

  // 3. Corporate Tax Calculation (Company pays this from profit)
  const corporateTaxAmount = netProfit > 0 ? netProfit * corporateTaxRate : 0;
  
  // 5. Final Take-Home Amount
  const netIncomeAfterTax = netProfit - corporateTaxAmount;

  // 4. Total Government Obligation
  const totalGovernmentTax = indirectTaxAmount + corporateTaxAmount;

  return {
    baseAmount: revenue,
    expenseAmount: expense,
    netProfit,
    indirectTaxRate: indirectTaxRate * 100,
    indirectTaxAmount,
    totalInvoiceAmount,
    corporateTaxRate: corporateTaxRate * 100,
    corporateTaxAmount,
    netIncomeAfterTax,
    totalGovernmentTax,
    region,
    currency,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  if (!currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
