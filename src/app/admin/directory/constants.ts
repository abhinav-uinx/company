// System folders & record categories in Medescort
export const SYSTEM_FOLDERS = [
  {
    id: 'customers',
    name: 'Customer Management',
    icon: 'person',
    category: 'Core Service',
    description: 'Customer profiles, client records, contact information, and account management.',
    actionLabel: 'Open Customer Management'
  },
  {
    id: 'escorts',
    name: 'Escort Missions',
    icon: 'flight_takeoff',
    category: 'Operations',
    description: 'Flight operations, medical missions, escort dispatching, and travel coordination.',
    actionLabel: 'Manage Escort Missions'
  },
  {
    id: 'general_services',
    alias: 'documentation',
    name: 'General Services',
    icon: 'medical_services',
    category: 'Services',
    description: 'General service details, document requests, official attestations, and medical translation.',
    actionLabel: 'Access General Services'
  },
  {
    id: 'invoices',
    name: 'Invoice & Billing',
    icon: 'receipt_long',
    category: 'Finance',
    description: 'Client invoicing, billing statements, tax receipts, and payment transactions.',
    actionLabel: 'View Invoice & Billing'
  },
  {
    id: 'vault',
    name: 'Document Vault',
    icon: 'folder_zip',
    category: 'Storage',
    description: 'Central document vault, customer passport archives, and encrypted repository files.',
    actionLabel: 'Open Document Vault'
  },
  {
    id: 'reports',
    name: 'Cloud Admin Reports & Analytics',
    icon: 'bar_chart',
    category: 'Management',
    description: 'Cloud reporting, operational analytics, profit/loss records, and Excel data exports.',
    actionLabel: 'View Reports & Analytics'
  },
  {
    id: 'forms',
    name: 'Document Hub/forms',
    icon: 'assignment',
    category: 'Document Hub',
    description: 'Standard operational checklists, patient intake PDFs, document hub files, and consent forms.',
    actionLabel: 'Open Document Hub/forms'
  }
];
