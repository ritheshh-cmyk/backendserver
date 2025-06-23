import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // App Title
    appTitle: 'PhoneRepair Pro',
    businessManagement: 'Business Management',
    
    // Navigation
    newTransaction: 'New Transaction',
    transactionHistory: 'Transaction History',
    customers: 'Customers',
    reports: 'Reports',
    exportToExcel: 'Export to Excel',
    export: 'Export',
    
    // Dashboard
    recordTransaction: 'Record customer repair service and payment details',
    viewHistory: 'View History',
    exportExcel: 'Export Excel',
    
    // Transaction Form
    customerInformation: 'Customer Information',
    customerName: 'Customer Name',
    mobileNumber: 'Mobile Number',
    deviceModel: 'Device Model',
    repairDetails: 'Repair Details',
    repairType: 'Repair Type',
    repairCost: 'Repair Cost',
    freeGlassInstallation: 'Eligible for free glass installation',
    paymentInformation: 'Payment Information',
    paymentMethod: 'Payment Method',
    amountGiven: 'Amount Given',
    changeReturned: 'Change Returned',
    additionalNotes: 'Additional Notes',
    remarks: 'Remarks',
    cancel: 'Cancel',
    saveDraft: 'Save Draft',
    completeTransaction: 'Complete Transaction',
    processing: 'Processing...',
    
    // Payment Methods
    cash: 'Cash',
    online: 'Online',
    
    // Transaction Summary
    transactionSummary: 'Transaction Summary',
    dateTime: 'Date & Time',
    customer: 'Customer',
    device: 'Device',
    changeDue: 'Change Due',
    recentTransactions: 'Recent Transactions',
    noRecentTransactions: 'No recent transactions',
    todaySummary: "Today's Summary",
    totalRevenue: 'Total Revenue',
    transactions: 'Transactions',
    customers_count: 'Customers',
    
    // History Page
    allTransactions: 'All Transactions',
    searchTransactions: 'Search transactions...',
    allTime: 'All Time',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    loadingTransactions: 'Loading transactions...',
    noTransactionsFound: 'No transactions found',
    payment: 'Payment',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    view: 'View',
    print: 'Print',
    edit: 'Edit',
    previous: 'Previous',
    next: 'Next',
    showingTransactions: 'Showing {count} transactions',
    
    // Status
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    
    // Stats
    weekExpense: 'Week Expense',
    monthExpense: 'Month Expense',
    yearExpense: 'Year Expense',
    
    // Placeholders
    enterCustomerName: 'Enter customer name',
    enterMobileNumber: 'Enter mobile number',
    deviceModelPlaceholder: 'e.g., iPhone 14 Pro, Samsung Galaxy S23',
    selectRepairType: 'Select repair type',
    selectPaymentMethod: 'Select payment method',
    additionalNotesPlaceholder: 'Additional notes, special instructions, or warranty information',
    
    // Messages
    transactionCreated: 'Transaction created successfully!',
    exportFailed: 'Export failed',
    validationError: 'Validation error',
    failedToCreateTransaction: 'Failed to create transaction',
    fetchTransactionsFailed: 'Failed to fetch transactions',
    fetchStatsFailed: 'Failed to fetch stats',
    exportDataFailed: 'Failed to export data'
  },
  te: {
    // App Title
    appTitle: 'ఫోన్‌రిపేర్ ప్రో',
    businessManagement: 'వ్యాపార నిర్వహణ',
    
    // Navigation
    newTransaction: 'కొత్త లావాదేవీ',
    transactionHistory: 'లావాదేవీల చరిత్ర',
    customers: 'కస్టమర్లు',
    reports: 'నివేదికలు',
    exportToExcel: 'ఎక్సెల్‌కు ఎగుమతి',
    export: 'ఎగుమతి',
    
    // Dashboard
    recordTransaction: 'కస్టమర్ రిపేర్ సేవ మరియు చెల్లింపు వివరాలను రికార్డ్ చేయండి',
    viewHistory: 'చరిత్రను చూడండి',
    exportExcel: 'ఎక్సెల్ ఎగుమతి',
    
    // Transaction Form
    customerInformation: 'కస్టమర్ సమాచారం',
    customerName: 'కస్టమర్ పేరు',
    mobileNumber: 'మొబైల్ నంబర్',
    deviceModel: 'పరికర మోడల్',
    repairDetails: 'రిపేర్ వివరాలు',
    repairType: 'రిపేర్ రకం',
    repairCost: 'రిపేర్ ఖర్చు',
    freeGlassInstallation: 'ఉచిత గ్లాస్ ఇన్‌స్టాలేషన్‌కు అర్హత',
    paymentInformation: 'చెల్లింపు సమాచారం',
    paymentMethod: 'చెల్లింపు పద్ధతి',
    amountGiven: 'ఇచ్చిన మొత్తం',
    changeReturned: 'తిరిగి ఇచ్చిన మార్చు',
    additionalNotes: 'అదనపు గమనికలు',
    remarks: 'వ్యాఖ్యలు',
    cancel: 'రద్దు',
    saveDraft: 'డ్రాఫ్ట్ సేవ్',
    completeTransaction: 'లావాదేవీ పూర్తి చేయండి',
    processing: 'ప్రాసెసింగ్...',
    
    // Payment Methods
    cash: 'నగదు',
    online: 'ఆన్‌లైన్',
    
    // Transaction Summary
    transactionSummary: 'లావాదేవీ సారాంశం',
    dateTime: 'తేదీ మరియు సమయం',
    customer: 'కస్టమర్',
    device: 'పరికరం',
    changeDue: 'మార్చు రావలసినది',
    recentTransactions: 'ఇటీవలి లావాదేవీలు',
    noRecentTransactions: 'ఇటీవలి లావాదేవీలు లేవు',
    todaySummary: 'ఈరోజు సారాంశం',
    totalRevenue: 'మొత్తం ఆదాయం',
    transactions: 'లావాదేవీలు',
    customers_count: 'కస్టమర్లు',
    
    // History Page
    allTransactions: 'అన్ని లావాదేవీలు',
    searchTransactions: 'లావాదేవీలను వెతకండి...',
    allTime: 'అన్ని సమయాలు',
    today: 'ఈరోజు',
    thisWeek: 'ఈ వారం',
    thisMonth: 'ఈ నెల',
    thisYear: 'ఈ సంవత్సరం',
    loadingTransactions: 'లావాదేవీలను లోడ్ చేస్తోంది...',
    noTransactionsFound: 'లావాదేవీలు కనుగొనబడలేదు',
    payment: 'చెల్లింపు',
    amount: 'మొత్తం',
    status: 'స్థితి',
    actions: 'చర్యలు',
    view: 'చూడండి',
    print: 'ప్రింట్',
    edit: 'సవరించు',
    previous: 'మునుపటి',
    next: 'తదుపరి',
    showingTransactions: '{count} లావాదేవీలను చూపిస్తోంది',
    
    // Status
    completed: 'పూర్తైంది',
    inProgress: 'ప్రగతిలో ఉంది',
    pending: 'పెండింగ్‌లో ఉంది',
    
    // Stats
    weekExpense: 'వారం ఖర్చు',
    monthExpense: 'నెల ఖర్చు',
    yearExpense: 'సంవత్సర ఖర్చు',
    
    // Placeholders
    enterCustomerName: 'కస్టమర్ పేరు నమోదు చేయండి',
    enterMobileNumber: 'మొబైల్ నంబర్ నమోదు చేయండి',
    deviceModelPlaceholder: 'ఉదా., iPhone 14 Pro, Samsung Galaxy S23',
    selectRepairType: 'రిపేర్ రకాన్ని ఎంచుకోండి',
    selectPaymentMethod: 'చెల్లింపు పద్ధతిని ఎంచుకోండి',
    additionalNotesPlaceholder: 'అదనపు గమనికలు, ప్రత్యేక సూచనలు లేదా వారంటీ సమాచారం',
    
    // Messages
    transactionCreated: 'లావాదేవీ విజయవంతంగా సృష్టించబడింది!',
    exportFailed: 'ఎగుమతి విఫలమైంది',
    validationError: 'ధృవీకరణ లోపం',
    failedToCreateTransaction: 'లావాదేవీని సృష్టించడంలో విఫలమైంది',
    fetchTransactionsFailed: 'లావాదేవీలను పొందడంలో విఫలమైంది',
    fetchStatsFailed: 'గణాంకాలను పొందడంలో విఫలమైంది',
    exportDataFailed: 'డేటాను ఎగుమతి చేయడంలో విఫలమైంది'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'te' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}