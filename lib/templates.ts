export const SUPPORT_LINK = "https://exchange.channel.io";

export const responseTemplates: Record<
  string,
  { category: string; body: string; showSupportLink?: boolean; requiredCaseInfo?: string[] }
> = {
  tmpl_service_intro_v1: {
    category: "direct_answer",
    body: "This is a self-service currency exchange kiosk service. You can exchange foreign banknotes to KRW by following the on-screen instructions. A valid passport is required for identity verification.",
  },
  tmpl_basic_usage_v1: {
    category: "direct_answer",
    body: "Here are the basic steps to use the kiosk:\n1. Start at the main screen and select your language.\n2. Place your passport on the scanner for identity verification.\n3. Select your currency type.\n4. Insert banknotes one at a time as instructed.\n5. Review the exchange amount on screen and confirm.\n6. Collect your KRW and receipt.",
  },
  tmpl_business_hours_v1: {
    category: "direct_answer",
    body: "Kiosk operating hours vary by location — please check the signage at the kiosk or store.\n\nOur support team is available Monday to Friday, 09:00 – 18:00 KST (excluding public holidays).",
  },
  tmpl_supported_languages_v1: {
    category: "direct_answer",
    body: "The kiosk supports: **English, Korean, Chinese, and Japanese**.\n\nThis chatbot currently operates in English.",
  },
  tmpl_exchange_rate_basis_v1: {
    category: "direct_answer",
    body: "The exchange rate applied is based on the representative bank-posted rate used for this service at the time of your transaction.\n\nThe exact rate applied to your transaction is shown on the kiosk screen before you confirm — please review it carefully before proceeding.",
  },
  tmpl_rounding_rule_v1: {
    category: "direct_answer",
    body: "Amounts below KRW 1,000 are rounded down and not included in the final payout.\n\nFor example, if your calculated amount is KRW 45,700, you will receive KRW 45,000.\n\nIf you have a question about a specific transaction amount, please contact support.",
    showSupportLink: true,
  },
  tmpl_amount_general_explanation_v1: {
    category: "answer_then_escalate",
    body: "There are a few common reasons the amount may seem lower than expected:\n\n1. **Exchange rate**: The rate is based on the bank-posted rate at the time of transaction.\n2. **Rounding**: Amounts below KRW 1,000 are rounded down.\n3. **Denomination**: Only accepted denominations are counted.\n\nIf you believe there is a specific error with your transaction amount, please contact support.",
    showSupportLink: true,
  },
  tmpl_banknote_not_accepted_v1: {
    category: "answer_then_escalate",
    body: "Please check the following:\n\n1. Is the banknote a currently accepted currency and denomination?\n2. Is the note heavily folded, torn, or damaged?\n3. Is the note inserted in the correct direction (as shown on screen)?\n4. Are you inserting only one note at a time?\n\nIf the note is still not accepted after these checks, please contact support.",
    showSupportLink: true,
  },
  tmpl_passport_scan_failed_v1: {
    category: "answer_then_escalate",
    body: "Please check the following:\n\n1. Open your passport to the photo/information page.\n2. Place it flat on the scanner window with no folds or covers.\n3. Avoid reflections or shadows on the page.\n4. Keep the passport still while scanning.\n\nIf it still does not scan after a few attempts, please contact support.",
    showSupportLink: true,
  },
  tmpl_screen_stuck_v1: {
    category: "answer_then_escalate",
    body: "If the screen appears frozen:\n\n1. Check what step is currently shown.\n2. Wait 1–2 minutes — the machine may still be processing.\n3. Do not insert cash or press multiple buttons while waiting.\n\nIf the screen remains unresponsive, please contact support. Do not attempt to restart the machine yourself.",
    showSupportLink: true,
  },
  tmpl_qr_access_issue_v1: {
    category: "answer_then_escalate",
    body: "Please try the following:\n\n1. Hold your camera 10–30 cm from the QR code.\n2. Make sure your camera is focused on the code.\n3. Check your internet connection.\n4. Try refreshing your camera app and scanning again.\n\nIf the QR still does not work, you may use the direct URL shown on the kiosk screen. Contact support if the issue continues.",
    showSupportLink: true,
  },
  tmpl_card_not_recognized_v1: {
    category: "answer_then_escalate",
    body: "If the card is not being recognized, please follow the instructions shown on the kiosk screen.\n\nIf the issue continues after following the on-screen steps, please contact support.",
    showSupportLink: true,
  },
  tmpl_escalate_money_not_reflected_v1: {
    category: "immediate_escalation",
    body: "This issue requires review by our support team.\n\nPlease **do not insert more cash or restart the machine**.\n\nContact support and please have the following ready:",
    showSupportLink: true,
    requiredCaseInfo: [
      "Location or store name",
      "Time of use",
      "Currency type",
      "Amount inserted",
      "Photo or screenshot if available",
    ],
  },
  tmpl_escalate_refund_request_v1: {
    category: "immediate_escalation",
    body: "Refund requests must be reviewed by our support team. We are unable to process or confirm refunds through this chatbot.\n\nPlease contact support and have the following ready:",
    showSupportLink: true,
    requiredCaseInfo: [
      "Location or store name",
      "Time of use",
      "Currency type",
      "Amount",
      "Photo or screenshot if available",
    ],
  },
  tmpl_escalate_duplicate_charge_v1: {
    category: "immediate_escalation",
    body: "A duplicate charge concern requires review by our support team.\n\nPlease contact support and have the following ready:",
    showSupportLink: true,
    requiredCaseInfo: [
      "Location or store name",
      "Time of use",
      "Currency type",
      "Amount",
      "Any transaction proof or screenshot",
    ],
  },
  tmpl_escalate_amount_issue_v1: {
    category: "immediate_escalation",
    body: "A specific amount issue requires review by our support team.\n\nPlease contact support and have the following ready:",
    showSupportLink: true,
    requiredCaseInfo: [
      "Location or store name",
      "Time of use",
      "Currency type",
      "Amount received vs. amount expected",
      "Photo or screenshot if available",
    ],
  },
  tmpl_escalate_transaction_result_v1: {
    category: "immediate_escalation",
    body: "Transaction outcome verification requires review by our support team. We cannot confirm whether a transaction was completed through this chatbot.\n\nPlease contact support and have the following ready:",
    showSupportLink: true,
    requiredCaseInfo: [
      "Location or store name",
      "Time of use",
      "Currency type",
      "Amount",
      "Any available transaction details or screenshots",
    ],
  },
  tmpl_escalate_complaint_v1: {
    category: "immediate_escalation",
    body: "We're sorry to hear you've had a difficult experience. Please contact our support team directly so your issue can be properly reviewed and addressed.",
    showSupportLink: true,
  },
  tmpl_escalate_human_agent_v1: {
    category: "immediate_escalation",
    body: "Of course. You can reach our support team directly via the link below.",
    showSupportLink: true,
  },
};

export const clarifyTemplates: Record<string, string> = {
  money:
    "Could you clarify your issue? Do you mean:\n- The amount you received seems lower than expected, or\n- Your inserted money was not reflected in the transaction?",
  card: "Could you clarify your issue? Do you mean:\n- The card is not being recognized by the machine, or\n- You were charged incorrectly?",
  rate: "Could you clarify your question? Do you want to know:\n- How the exchange rate is calculated, or\n- Why the amount you received seems different from what you expected?",
  machine:
    "Could you tell me more about the issue? Is it:\n- The screen is stuck or frozen,\n- The QR code is not working, or\n- The machine is not accepting your banknote?",
  mixed_general_and_risk_case:
    "Could you clarify — are you looking for general information, or did something go wrong during your transaction?",
};
