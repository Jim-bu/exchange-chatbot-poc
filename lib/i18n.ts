export type Lang = "en" | "zh-CN" | "zh-TW" | "ja";

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  const raw =
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    "en";
  if (raw.startsWith("ja")) return "ja";
  if (
    raw === "zh-TW" ||
    raw === "zh-Hant" ||
    /^zh-(HK|MO|Hant)/i.test(raw)
  )
    return "zh-TW";
  if (raw.startsWith("zh")) return "zh-CN";
  return "en";
}


export interface StepT {
  label: string;
  question: string;
  placeholder: string;
}

export interface T {
  greeting: string;
  legalNotice: string;
  headerTitle: string;
  headerSubAI: string;
  headerSubConnected: string;
  headerSubWaiting: string;
  headerSubHandoff: string;
  inputHint: string;
  inputPlaceholder: string;
  handoffInputPlaceholder: string;
  connectedFooter: string;
  waitingMessage: string;
  handoffAgentJoined: string;
  closedMessage: string;
  connectingTitle: string;
  connectingSubtitle: string;
  inProgress: string;
  stepOf: (n: number, total: number, label: string) => string;
  submitting: string;
  clarifyFallback: string;
  errorFallback: string;
  steps: [StepT, StepT, StepT, StepT];
  photoTake: string;
  photoUpload: string;
  photoSkip: string;
  photoRetake: string;
  photoSend: string;
  endSession: string;
}

export const translations: Record<Lang, T> = {
  en: {
    greeting:
      "Hi! I'm here to help with questions about the self-service currency exchange kiosk.\n\nFor the most accurate answer, please describe your issue in 2 or more words. If you need immediate support, you can also contact us directly.",
    legalNotice: "In Korea, the following regulation applies to all customer service staff to ensure their protection.\n\nNotice Regarding Agent Protection\n\nIn accordance with Article 41 of the Occupational Safety and Health Act, any use of abusive language, profanity, sexual harassment, or other inappropriate conduct during a consultation may result in the suspension of the session. We kindly ask for your cooperation in maintaining respectful communication.\n\nYour request has been sent to our support team. An agent will follow up with you shortly.",
    headerTitle: "Exchange Support",
    headerSubAI: "AI Assistant",
    headerSubConnected: "Agent notified",
    headerSubWaiting: "Waiting for agent...",
    headerSubHandoff: "Connected with agent",
    inputHint: "Describe your issue in 2+ words for the best answer.",
    inputPlaceholder: "Type your question...",
    handoffInputPlaceholder: "Reply to agent...",
    connectedFooter: "Request sent · An agent will follow up shortly",
    waitingMessage:
      "Your request has been submitted.\n\nAn agent will join this chat shortly. Please wait here — you'll be connected automatically.",
    handoffAgentJoined:
      "A support agent has joined the chat. Please continue your conversation here.",
    closedMessage:
      "This support session has ended. Thank you for contacting us.",
    connectingTitle: "Connecting to Support",
    connectingSubtitle: "Please provide a few details",
    inProgress: "In progress",
    stepOf: (n, total, label) => `Step ${n} of ${total} · ${label}`,
    submitting: "Sending your information to the support team…",
    clarifyFallback:
      "I'm having trouble understanding your request. Let me connect you with our support team.",
    errorFallback:
      "Your information has been recorded. Please contact our support team directly — we were unable to send the automatic notification this time.",
    steps: [
      {
        label: "Store location",
        question: "What is the store name or location where you used the kiosk?",
        placeholder: "e.g. Store name, floor",
      },
      {
        label: "Currency & amount",
        question:
          "What currency were you exchanging, and how much?\n(e.g. USD 200 / JPY 50,000)",
        placeholder: "e.g. USD 200",
      },
      {
        label: "Issue description",
        question: "Please describe the issue in more detail.",
        placeholder: "Describe what happened...",
      },
      {
        label: "Photo / screenshot",
        question: "Do you have a photo or screenshot of the issue?",
        placeholder: "",
      },
    ],
    photoTake: "Take Photo",
    photoUpload: "Upload Photo",
    photoSkip: "Skip — no photo",
    photoRetake: "Retake",
    photoSend: "Send Photo",
    endSession: "End session",
  },

  ja: {
    greeting:
      "こんにちは！無人両替機に関するご質問をサポートいたします。\n\nより正確な回答のために、お困りの内容を2語以上でご説明ください。すぐにサポートが必要な場合は、直接お問い合わせいただくこともできます。",
    legalNotice: "韓国では、カスタマーサービス担当者を保護するため、すべてのサポート対応に以下の規定が適用されます。\n\n担当者保護に関するご案内\n\n「産業安全保健法」第41条に基づき、相談中の暴言・罵倒・性的ハラスメントその他の不適切な行為は、相談を制限する場合があります。円滑なサポートのため、丁重な言葉遣いにご協力をお願いいたします。\n\nサポートチームにリクエストを送信しました。担当者より折り返しご連絡いたします。",
    headerTitle: "両替サポート",
    headerSubAI: "AIアシスタント",
    headerSubConnected: "担当者に通知済み",
    headerSubWaiting: "担当者を接続中...",
    headerSubHandoff: "担当者と接続中",
    inputHint: "より正確な回答のため、2語以上でご説明ください。",
    inputPlaceholder: "質問を入力してください...",
    handoffInputPlaceholder: "担当者に返信...",
    connectedFooter: "送信完了 · 担当者よりご連絡いたします",
    waitingMessage:
      "リクエストを送信しました。\n\n担当者がこのチャットに参加するまでしばらくお待ちください。自動的に接続されます。",
    handoffAgentJoined:
      "サポート担当者がチャットに参加しました。引き続きこちらでお話しください。",
    closedMessage:
      "このサポートセッションは終了しました。ご利用ありがとうございました。",
    connectingTitle: "サポートに接続中",
    connectingSubtitle: "いくつかの情報をご提供ください",
    inProgress: "接続中",
    stepOf: (n, total, label) => `${n} / ${total} · ${label}`,
    submitting: "サポートチームに情報を送信しています…",
    clarifyFallback:
      "ご要望を正確に理解できませんでした。サポート担当者におつなぎします。",
    errorFallback:
      "情報を記録しました。自動通知に失敗したため、サポートチームに直接お問い合わせください。",
    steps: [
      {
        label: "ご利用場所",
        question: "ご利用になった店舗名または場所を教えてください。",
        placeholder: "例：店舗名・フロア",
      },
      {
        label: "通貨・金額",
        question:
          "両替しようとした通貨と金額を教えてください。\n（例：USD 200 / JPY 50,000）",
        placeholder: "例：USD 200",
      },
      {
        label: "問題の詳細",
        question: "問題の詳細を教えてください。",
        placeholder: "何が起きたかをご説明ください...",
      },
      {
        label: "写真・スクリーンショット",
        question: "問題の写真やスクリーンショットはありますか？",
        placeholder: "",
      },
    ],
    photoTake: "写真を撮る",
    photoUpload: "写真をアップロード",
    photoSkip: "スキップ（写真なし）",
    photoRetake: "撮り直す",
    photoSend: "写真を送る",
    endSession: "セッションを終了する",
  },

  "zh-CN": {
    greeting:
      "您好！我在这里帮助解答关于自助换汇机的问题。\n\n为了给您最准确的回答，请用两个或以上的词描述您的问题。如需立即获得支持，您也可以直接联系我们。",
    legalNotice: "在韩国，为保护客服人员权益，以下规定适用于所有客服对应场合。\n\n客服人员保护须知\n\n根据《产业安全保健法》第41条，在咨询过程中如有辱骂、粗口、性骚扰或其他不当行为，可能导致本次咨询服务中断。为保障顺畅沟通，请保持礼貌用语，感谢您的理解与配合。\n\n您的请求已发送至支持团队，工作人员将尽快与您联系。",
    headerTitle: "换汇支持",
    headerSubAI: "AI 助理",
    headerSubConnected: "已通知工作人员",
    headerSubWaiting: "等待客服接入...",
    headerSubHandoff: "已与客服连接",
    inputHint: "请用两个或以上的词描述您的问题，以便获得最准确的回答。",
    inputPlaceholder: "请输入您的问题...",
    handoffInputPlaceholder: "回复客服...",
    connectedFooter: "请求已发送 · 工作人员将尽快联系您",
    waitingMessage:
      "您的请求已提交。\n\n请在此等候，客服人员即将加入本次对话，连接成功后将自动通知您。",
    handoffAgentJoined:
      "客服人员已加入对话，请继续在此进行沟通。",
    closedMessage:
      "本次支持会话已结束，感谢您的联系。",
    connectingTitle: "正在连接客服",
    connectingSubtitle: "请提供以下信息",
    inProgress: "连接中",
    stepOf: (n, total, label) => `第 ${n} / ${total} 步 · ${label}`,
    submitting: "正在将您的信息发送给支持团队…",
    clarifyFallback:
      "抱歉，我无法准确理解您的请求，正在为您转接客服人员。",
    errorFallback:
      "您的信息已记录。由于自动通知发送失败，请直接联系我们的支持团队。",
    steps: [
      {
        label: "使用地点",
        question: "请提供您使用换汇机的店铺名称或地点。",
        placeholder: "例：店铺名称 · 楼层",
      },
      {
        label: "货币与金额",
        question:
          "请告诉我您想兑换的货币种类和金额。\n（例：USD 200 / JPY 50,000）",
        placeholder: "例：USD 200",
      },
      {
        label: "问题描述",
        question: "请详细描述您遇到的问题。",
        placeholder: "请描述发生了什么...",
      },
      {
        label: "照片/截图",
        question: "您是否有问题相关的照片或截图？",
        placeholder: "",
      },
    ],
    photoTake: "拍照",
    photoUpload: "上传照片",
    photoSkip: "跳过 — 没有照片",
    photoRetake: "重新拍摄",
    photoSend: "发送照片",
    endSession: "结束对话",
  },

  "zh-TW": {
    greeting:
      "您好！我在這裡協助解答關於自助換匯機的問題。\n\n為了給您最準確的回答，請用兩個或以上的詞描述您的問題。如需立即獲得支援，您也可以直接聯絡我們。",
    legalNotice: "在韓國，為保護客服人員權益，以下規定適用於所有客服應對場合。\n\n客服人員保護須知\n\n根據《產業安全衛生法》第41條，在諮詢過程中如有辱罵、粗口、性騷擾或其他不當行為，可能導致本次諮詢服務中斷。為保障順暢溝通，請保持禮貌用語，感謝您的理解與配合。\n\n您的請求已發送至支援團隊，工作人員將盡快與您聯繫。",
    headerTitle: "換匯支援",
    headerSubAI: "AI 助理",
    headerSubConnected: "已通知工作人員",
    headerSubWaiting: "等待客服接入...",
    headerSubHandoff: "已與客服連線",
    inputHint: "請用兩個或以上的詞描述您的問題，以便獲得最準確的回答。",
    inputPlaceholder: "請輸入您的問題...",
    handoffInputPlaceholder: "回覆客服...",
    connectedFooter: "請求已發送 · 工作人員將盡快聯繫您",
    waitingMessage:
      "您的請求已提交。\n\n請在此等候，客服人員即將加入本次對話，連線成功後將自動通知您。",
    handoffAgentJoined:
      "客服人員已加入對話，請繼續在此進行溝通。",
    closedMessage:
      "本次支援會話已結束，感謝您的聯絡。",
    connectingTitle: "正在連線客服",
    connectingSubtitle: "請提供以下資訊",
    inProgress: "連線中",
    stepOf: (n, total, label) => `第 ${n} / ${total} 步 · ${label}`,
    submitting: "正在將您的資訊發送給支援團隊…",
    clarifyFallback:
      "抱歉，我無法準確理解您的請求，正在為您轉接客服人員。",
    errorFallback:
      "您的資訊已記錄。由於自動通知發送失敗，請直接聯絡我們的支援團隊。",
    steps: [
      {
        label: "使用地點",
        question: "請提供您使用換匯機的店舖名稱或地點。",
        placeholder: "例：店舖名稱 · 樓層",
      },
      {
        label: "貨幣與金額",
        question:
          "請告訴我您想兌換的貨幣種類和金額。\n（例：USD 200 / JPY 50,000）",
        placeholder: "例：USD 200",
      },
      {
        label: "問題描述",
        question: "請詳細描述您遇到的問題。",
        placeholder: "請描述發生了什麼...",
      },
      {
        label: "照片/截圖",
        question: "您是否有問題相關的照片或截圖？",
        placeholder: "",
      },
    ],
    photoTake: "拍照",
    photoUpload: "上傳照片",
    photoSkip: "略過 — 沒有照片",
    photoRetake: "重新拍攝",
    photoSend: "傳送照片",
    endSession: "結束對話",
  },
};
