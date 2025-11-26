
export interface T2125Category {
  line: string;
  description: string;
  key: string; 
}

// Based on CRA Form T2125, Part 3A
export const t2125IncomeCategories: T2125Category[] = [
  { line: "Part 3A", description: "Sales, commissions, or fees", key: "sales" },
  { line: "Part 3D", description: "Other income", key: "other" },
];

// Based on CRA Form T2125, Part 4 - Expenses
export const t2125ExpenseCategories: T2125Category[] = [
  { line: "8521", description: "Advertising", key: "advertising" },
  { line: "8590", description: "Bad debts", key: "badDebts" },
  { line: "8690", description: "Insurance", key: "insurance" },
  { line: "8710", description: "Interest and bank charges", key: "interest" },
  { line: "8760", description: "Business fees, licences, and dues", key: "feesDues" },
  { line: "8810", description: "Office expenses", key: "office" },
  { line: "8811", description: "Office stationery and supplies", key: "supplies" },
  { line: "8860", description: "Professional fees (includes legal and accounting fees)", key: "professionalFees" },
  { line: "8871", description: "Management and administration fees", key: "managementAdmin" },
  { line: "8910", description: "Rent", key: "rent" },
  { line: "8960", description: "Repairs and maintenance", key: "repairsMaintenance" },
  { line: "9060", description: "Salaries, wages, and benefits (including employer's contributions)", key: "salaries" },
  { line: "9180", description: "Property taxes", key: "propertyTaxes" },
  { line: "9200", description: "Travel expenses", key: "travel" },
  { line: "9220", description: "Utilities", key: "utilities" },
  { line: "9224", description: "Fuel costs (except for motor vehicles)", key: "fuel" },
  { line: "9275", description: "Delivery, freight, and express", key: "shipping" },
  { line: "9281", description: "Motor vehicle expenses (not including CCA)", key: "motorVehicle" },
  { line: "9936", description: "Capital cost allowance (CCA)", key: "cca" },
  { line: "9270", description: "Other expenses", key: "otherExpenses" },
];

// This list remains for populating the dropdown in the expense transaction form.
export const standardExpenseCategories: string[] = [
    "Advertising",
    "Bad debts",
    "Insurance",
    "Interest and bank charges",
    "Business fees, licences, and dues",
    "Office expenses",
    "Office stationery and supplies",
    "Professional fees (includes legal and accounting fees)",
    "Management and administration fees",
    "Rent",
    "Repairs and maintenance",
    "Salaries, wages, and benefits (including employer's contributions)",
    "Property taxes",
    "Travel expenses",
    "Utilities",
    "Fuel costs (except for motor vehicles)",
    "Delivery, freight, and express",
    "Motor vehicle expenses (not including CCA)",
    "Capital cost allowance (CCA)",
    "Other expenses",
];
