"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const LANGUAGES = [
  { code: "en-IN", name: "English", short: "EN" },
  { code: "hi-IN", name: "हिन्दी", short: "HI" },
  { code: "kn-IN", name: "ಕನ್ನಡ", short: "KN" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const strings = {
  "en-IN": {
    dashboard: "Dashboard", opportunities: "Opportunities", campaigns: "Campaigns", operations: "Operations",
    customers: "Customers", analytics: "Analytics", assistant: "AI Assistant", settings: "Settings",
    merchantGrowth: "Merchant Growth", merchantOs: "Paytm Merchant OS", workspace: "Merchant workspace",
    language: "Language", simulatedDemo: "Simulated demo data", liveData: "Live data",
    businessDashboard: "Business Dashboard", dashboardDescription: "Selected merchant performance. Revenue is transaction value, not profit.",
    revenue30d: "Revenue (last 30 days)", transactions: "Transactions", averageOrderValue: "Avg Order Value", returningCustomers: "Returning Customers",
    opportunityDetection: "AI Opportunity Detection", analyzeBusiness: "Analyse your business data to find growth opportunities", runAnalysis: "Run AI Analysis", analyzing: "Analysing...",
    customerEngagement: "Customer Engagement", merchantSettings: "Merchant settings", saveProfile: "Save profile", saving: "Saving...",
    revenueTrend: "Revenue Trend", daily: "Daily", weekly: "Weekly", hourlySales: "Hourly Sales Distribution", customerSegments: "Customer Segments", topProducts: "Top Products",
    dailyBriefing: "Daily Briefing", getBriefing: "Get Briefing", noTransactionData: "No transaction data yet.",
    customerDirectory: "Customer directory", searchNames: "Search customer names", segment: "Segment", visits: "Visits", totalSpend: "Total spend", lastVisit: "Last visit", showing: "Showing", of: "of", page: "Page",
    composeMessage: "Compose Message", targetSegment: "Target Segment", offerDetails: "Offer Details (optional)", generateMessage: "Generate Message", generating: "Generating...", messagePreview: "Message Preview", copy: "Copy", copied: "Copied!", shareWhatsApp: "Share on WhatsApp", manualShare: "Review and share manually",
    campaignManager: "Campaign Manager", createCampaign: "Create campaign", closeForm: "Close form", draftForApproval: "Save draft for approval", campaignName: "Campaign name", campaignType: "Campaign type", campaignChannel: "Campaign channel", plannedBudget: "Planned budget (₹)", discount: "Discount (%)", durationDays: "Duration (days)", description: "Description", voiceMessage: "Voice message", spokenLanguage: "Spoken language", previewVoice: "Preview voice", preparingPreview: "Preparing preview...", approve: "Approve", reject: "Reject", runSimulation: "Run Demo Simulation", simulating: "Simulating...", noAttention: "No items need your attention",
    forecastPlanner: "Operations & Prep Planner", prepareTomorrow: "Prepare for Tomorrow", detailedForecast: "Detailed Forecast", slowMovingProducts: "Slow-Moving Products", product: "Product", total: "Total",
    campaignAnalytics: "Campaign Analytics", campaignCost: "Campaign Cost", incrementalRevenue: "Incremental Revenue", incrementalGrossProfit: "Incremental gross profit (sim.)", merchantRoi: "Merchant ROI", customersReached: "Customers Reached", campaignFunnel: "Campaign Funnel", treatmentVsControl: "Treatment vs Control Revenue",
    assistantTitle: "AI Business Assistant", askBusiness: "Ask about your business performance...", send: "Send", recording: "Recording... Click the mic button to stop",
    businessName: "Business name", businessType: "Business type", address: "Address", city: "City", phone: "Phone", email: "Email",
    vsLastMonth: "vs last month", loadingChart: "Loading chart...", noProductData: "No product data yet", orderCount: "orders", salesDecline: "sales declining",
    hourlyDescription: "Current 4 weeks vs previous 4 weeks", previous: "Previous", current: "Current",
    morning: "Morning", lunch: "Lunch", afternoon: "Afternoon", evening: "Evening", forecastDate: "Demand forecast for", basedOnWeeks: "weeks of data",
  },
  "hi-IN": {
    dashboard: "डैशबोर्ड", opportunities: "अवसर", campaigns: "अभियान", operations: "कार्य संचालन",
    customers: "ग्राहक", analytics: "विश्लेषण", assistant: "AI सहायक", settings: "सेटिंग्स",
    merchantGrowth: "मर्चेंट ग्रोथ", merchantOs: "Paytm मर्चेंट OS", workspace: "मर्चेंट कार्यक्षेत्र",
    language: "भाषा", simulatedDemo: "सिम्युलेटेड डेमो डेटा", liveData: "लाइव डेटा",
    businessDashboard: "व्यवसाय डैशबोर्ड", dashboardDescription: "चुने गए मर्चेंट का प्रदर्शन। राजस्व लेन-देन का मूल्य है, लाभ नहीं।",
    revenue30d: "राजस्व (पिछले 30 दिन)", transactions: "लेन-देन", averageOrderValue: "औसत ऑर्डर मूल्य", returningCustomers: "वापस आने वाले ग्राहक",
    opportunityDetection: "AI अवसर पहचान", analyzeBusiness: "विकास के अवसर खोजने के लिए अपने व्यवसाय के डेटा का विश्लेषण करें", runAnalysis: "AI विश्लेषण चलाएँ", analyzing: "विश्लेषण जारी है...",
    customerEngagement: "ग्राहक जुड़ाव", merchantSettings: "मर्चेंट सेटिंग्स", saveProfile: "प्रोफ़ाइल सहेजें", saving: "सहेजा जा रहा है...",
    revenueTrend: "राजस्व का रुझान", daily: "दैनिक", weekly: "साप्ताहिक", hourlySales: "घंटे के अनुसार बिक्री", customerSegments: "ग्राहक समूह", topProducts: "शीर्ष उत्पाद",
    dailyBriefing: "दैनिक जानकारी", getBriefing: "जानकारी देखें", noTransactionData: "अभी लेन-देन का डेटा नहीं है।",
    customerDirectory: "ग्राहक सूची", searchNames: "ग्राहक का नाम खोजें", segment: "समूह", visits: "विज़िट", totalSpend: "कुल खर्च", lastVisit: "पिछली विज़िट", showing: "दिखाए जा रहे", of: "में से", page: "पृष्ठ",
    composeMessage: "संदेश लिखें", targetSegment: "लक्षित समूह", offerDetails: "ऑफ़र का विवरण (वैकल्पिक)", generateMessage: "संदेश बनाएँ", generating: "बनाया जा रहा है...", messagePreview: "संदेश पूर्वावलोकन", copy: "कॉपी करें", copied: "कॉपी हो गया!", shareWhatsApp: "WhatsApp पर साझा करें", manualShare: "समीक्षा करके स्वयं साझा करें",
    campaignManager: "अभियान प्रबंधक", createCampaign: "अभियान बनाएँ", closeForm: "फ़ॉर्म बंद करें", draftForApproval: "अनुमोदन के लिए ड्राफ़्ट सहेजें", campaignName: "अभियान का नाम", campaignType: "अभियान का प्रकार", campaignChannel: "अभियान माध्यम", plannedBudget: "निर्धारित बजट (₹)", discount: "छूट (%)", durationDays: "अवधि (दिन)", description: "विवरण", voiceMessage: "आवाज़ संदेश", spokenLanguage: "बोलने की भाषा", previewVoice: "आवाज़ सुनें", preparingPreview: "पूर्वावलोकन तैयार हो रहा है...", approve: "अनुमोदित करें", reject: "अस्वीकार करें", runSimulation: "डेमो सिमुलेशन चलाएँ", simulating: "सिमुलेशन चल रहा है...", noAttention: "ध्यान देने योग्य कोई नया काम नहीं है",
    forecastPlanner: "कार्य संचालन और तैयारी योजना", prepareTomorrow: "कल की तैयारी", detailedForecast: "विस्तृत अनुमान", slowMovingProducts: "धीमे बिकने वाले उत्पाद", product: "उत्पाद", total: "कुल",
    campaignAnalytics: "अभियान विश्लेषण", campaignCost: "अभियान लागत", incrementalRevenue: "अतिरिक्त राजस्व", incrementalGrossProfit: "अनुमानित अतिरिक्त सकल लाभ (सिम्युलेटेड)", merchantRoi: "मर्चेंट ROI", customersReached: "पहुँचे ग्राहक", campaignFunnel: "अभियान फ़नल", treatmentVsControl: "ट्रीटमेंट बनाम कंट्रोल राजस्व",
    assistantTitle: "AI व्यवसाय सहायक", askBusiness: "अपने व्यवसाय के प्रदर्शन के बारे में पूछें...", send: "भेजें", recording: "रिकॉर्डिंग... रोकने के लिए माइक दबाएँ",
    businessName: "व्यवसाय का नाम", businessType: "व्यवसाय का प्रकार", address: "पता", city: "शहर", phone: "फ़ोन", email: "ईमेल",
    vsLastMonth: "पिछले महीने की तुलना में", loadingChart: "चार्ट लोड हो रहा है...", noProductData: "अभी उत्पाद का डेटा नहीं है", orderCount: "ऑर्डर", salesDecline: "बिक्री में गिरावट",
    hourlyDescription: "पिछले 4 सप्ताह बनाम उससे पहले के 4 सप्ताह", previous: "पिछले", current: "वर्तमान",
    morning: "सुबह", lunch: "दोपहर का भोजन", afternoon: "दोपहर", evening: "शाम", forecastDate: "मांग का अनुमान", basedOnWeeks: "सप्ताह के डेटा पर आधारित",
  },
  "kn-IN": {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", opportunities: "ಅವಕಾಶಗಳು", campaigns: "ಅಭಿಯಾನಗಳು", operations: "ಕಾರ್ಯಾಚರಣೆಗಳು",
    customers: "ಗ್ರಾಹಕರು", analytics: "ವಿಶ್ಲೇಷಣೆ", assistant: "AI ಸಹಾಯಕ", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    merchantGrowth: "ಮರ್ಚಂಟ್ ಗ್ರೋತ್", merchantOs: "Paytm ಮರ್ಚಂಟ್ OS", workspace: "ಮರ್ಚಂಟ್ ಕಾರ್ಯಕ್ಷೇತ್ರ",
    language: "ಭಾಷೆ", simulatedDemo: "ಸಿಮ್ಯುಲೇಟೆಡ್ ಡೆಮೋ ಡೇಟಾ", liveData: "ಲೈವ್ ಡೇಟಾ",
    businessDashboard: "ವ್ಯವಹಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", dashboardDescription: "ಆಯ್ಕೆಮಾಡಿದ ಮರ್ಚಂಟ್‌ನ ಕಾರ್ಯಕ್ಷಮತೆ. ಆದಾಯವು ವಹಿವಾಟಿನ ಮೌಲ್ಯ, ಲಾಭವಲ್ಲ.",
    revenue30d: "ಆದಾಯ (ಕಳೆದ 30 ದಿನಗಳು)", transactions: "ವಹಿವಾಟುಗಳು", averageOrderValue: "ಸರಾಸರಿ ಆರ್ಡರ್ ಮೌಲ್ಯ", returningCustomers: "ಮರಳಿ ಬರುವ ಗ್ರಾಹಕರು",
    opportunityDetection: "AI ಅವಕಾಶ ಪತ್ತೆ", analyzeBusiness: "ಬೆಳವಣಿಗೆಯ ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಲು ನಿಮ್ಮ ವ್ಯವಹಾರದ ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಿ", runAnalysis: "AI ವಿಶ್ಲೇಷಣೆ ಪ್ರಾರಂಭಿಸಿ", analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    customerEngagement: "ಗ್ರಾಹಕ ಸಂಪರ್ಕ", merchantSettings: "ಮರ್ಚಂಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", saveProfile: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ", saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    revenueTrend: "ಆದಾಯದ ಪ್ರವೃತ್ತಿ", daily: "ದೈನಂದಿನ", weekly: "ವಾರದ", hourlySales: "ಗಂಟೆವಾರು ಮಾರಾಟ", customerSegments: "ಗ್ರಾಹಕರ ವಿಭಾಗಗಳು", topProducts: "ಅಗ್ರ ಉತ್ಪನ್ನಗಳು",
    dailyBriefing: "ದೈನಂದಿನ ಮಾಹಿತಿ", getBriefing: "ಮಾಹಿತಿ ಪಡೆಯಿರಿ", noTransactionData: "ಇನ್ನೂ ವಹಿವಾಟಿನ ಡೇಟಾ ಇಲ್ಲ.",
    customerDirectory: "ಗ್ರಾಹಕರ ಪಟ್ಟಿ", searchNames: "ಗ್ರಾಹಕರ ಹೆಸರನ್ನು ಹುಡುಕಿ", segment: "ವಿಭಾಗ", visits: "ಭೇಟಿಗಳು", totalSpend: "ಒಟ್ಟು ಖರ್ಚು", lastVisit: "ಕೊನೆಯ ಭೇಟಿ", showing: "ತೋರಿಸಲಾಗುತ್ತಿದೆ", of: "ರಲ್ಲಿ", page: "ಪುಟ",
    composeMessage: "ಸಂದೇಶ ರಚಿಸಿ", targetSegment: "ಗುರಿ ವಿಭಾಗ", offerDetails: "ಆಫರ್ ವಿವರಗಳು (ಐಚ್ಛಿಕ)", generateMessage: "ಸಂದೇಶ ರಚಿಸಿ", generating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...", messagePreview: "ಸಂದೇಶ ಪೂರ್ವವೀಕ್ಷಣೆ", copy: "ನಕಲಿಸಿ", copied: "ನಕಲಾಗಿದೆ!", shareWhatsApp: "WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ", manualShare: "ಪರಿಶೀಲಿಸಿ ನೀವೇ ಹಂಚಿಕೊಳ್ಳಿ",
    campaignManager: "ಅಭಿಯಾನ ನಿರ್ವಹಣೆ", createCampaign: "ಅಭಿಯಾನ ರಚಿಸಿ", closeForm: "ಫಾರ್ಮ್ ಮುಚ್ಚಿ", draftForApproval: "ಅನುಮೋದನೆಗಾಗಿ ಕರಡು ಉಳಿಸಿ", campaignName: "ಅಭಿಯಾನದ ಹೆಸರು", campaignType: "ಅಭಿಯಾನದ ಪ್ರಕಾರ", campaignChannel: "ಅಭಿಯಾನದ ಮಾಧ್ಯಮ", plannedBudget: "ಯೋಜಿತ ಬಜೆಟ್ (₹)", discount: "ರಿಯಾಯಿತಿ (%)", durationDays: "ಅವಧಿ (ದಿನಗಳು)", description: "ವಿವರಣೆ", voiceMessage: "ಧ್ವನಿ ಸಂದೇಶ", spokenLanguage: "ಮಾತನಾಡುವ ಭಾಷೆ", previewVoice: "ಧ್ವನಿ ಪೂರ್ವವೀಕ್ಷಣೆ", preparingPreview: "ಪೂರ್ವವೀಕ್ಷಣೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...", approve: "ಅನುಮೋದಿಸಿ", reject: "ತಿರಸ್ಕರಿಸಿ", runSimulation: "ಡೆಮೋ ಸಿಮ್ಯುಲೇಶನ್ ನಡೆಸಿ", simulating: "ಸಿಮ್ಯುಲೇಶನ್ ನಡೆಯುತ್ತಿದೆ...", noAttention: "ಗಮನಕ್ಕೆ ಬಾಕಿ ಇರುವ ಕೆಲಸಗಳಿಲ್ಲ",
    forecastPlanner: "ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಸಿದ್ಧತಾ ಯೋಜನೆ", prepareTomorrow: "ನಾಳೆಗೆ ಸಿದ್ಧರಾಗಿ", detailedForecast: "ವಿವರವಾದ ಮುನ್ಸೂಚನೆ", slowMovingProducts: "ನಿಧಾನವಾಗಿ ಮಾರಾಟವಾಗುವ ಉತ್ಪನ್ನಗಳು", product: "ಉತ್ಪನ್ನ", total: "ಒಟ್ಟು",
    campaignAnalytics: "ಅಭಿಯಾನ ವಿಶ್ಲೇಷಣೆ", campaignCost: "ಅಭಿಯಾನದ ವೆಚ್ಚ", incrementalRevenue: "ಹೆಚ್ಚುವರಿ ಆದಾಯ", incrementalGrossProfit: "ಅಂದಾಜು ಹೆಚ್ಚುವರಿ ಒಟ್ಟು ಲಾಭ (ಸಿಮ್ಯುಲೇಟೆಡ್)", merchantRoi: "ಮರ್ಚಂಟ್ ROI", customersReached: "ತಲುಪಿದ ಗ್ರಾಹಕರು", campaignFunnel: "ಅಭಿಯಾನದ ಹಂತಗಳು", treatmentVsControl: "ಟ್ರೀಟ್ಮೆಂಟ್ ಮತ್ತು ಕಂಟ್ರೋಲ್ ಆದಾಯ",
    assistantTitle: "AI ವ್ಯವಹಾರ ಸಹಾಯಕ", askBusiness: "ನಿಮ್ಮ ವ್ಯವಹಾರದ ಕಾರ್ಯಕ್ಷಮತೆಯ ಬಗ್ಗೆ ಕೇಳಿ...", send: "ಕಳುಹಿಸಿ", recording: "ರೆಕಾರ್ಡಿಂಗ್... ನಿಲ್ಲಿಸಲು ಮೈಕ್ ಒತ್ತಿ",
    businessName: "ವ್ಯವಹಾರದ ಹೆಸರು", businessType: "ವ್ಯವಹಾರದ ಪ್ರಕಾರ", address: "ವಿಳಾಸ", city: "ನಗರ", phone: "ಫೋನ್", email: "ಇಮೇಲ್",
    vsLastMonth: "ಕಳೆದ ತಿಂಗಳಿಗೆ ಹೋಲಿಸಿದರೆ", loadingChart: "ಚಾರ್ಟ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...", noProductData: "ಇನ್ನೂ ಉತ್ಪನ್ನದ ಡೇಟಾ ಇಲ್ಲ", orderCount: "ಆರ್ಡರ್‌ಗಳು", salesDecline: "ಮಾರಾಟ ಇಳಿಕೆ",
    hourlyDescription: "ಪ್ರಸ್ತುತ 4 ವಾರಗಳು ಮತ್ತು ಹಿಂದಿನ 4 ವಾರಗಳು", previous: "ಹಿಂದಿನ", current: "ಪ್ರಸ್ತುತ",
    morning: "ಬೆಳಿಗ್ಗೆ", lunch: "ಮಧ್ಯಾಹ್ನದ ಊಟ", afternoon: "ಮಧ್ಯಾಹ್ನ", evening: "ಸಂಜೆ", forecastDate: "ಬೇಡಿಕೆಯ ಮುನ್ಸೂಚನೆ", basedOnWeeks: "ವಾರಗಳ ಡೇಟಾವನ್ನು ಆಧರಿಸಿ",
  },
} as const;

export type TranslationKey = keyof typeof strings["en-IN"];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isEnglish: boolean;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en-IN",
  setLanguage: () => {},
  isEnglish: true,
  t: (key) => strings["en-IN"][key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en-IN");

  useEffect(() => {
    const saved = localStorage.getItem("preferred-language") as LanguageCode | null;
    if (saved && LANGUAGES.some((item) => item.code === saved)) setLanguageState(saved);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("preferred-language", lang);
  };

  const t = (key: TranslationKey) => strings[language][key] || strings["en-IN"][key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isEnglish: language === "en-IN", t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
