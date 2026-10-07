export const AI_GLADIATORS_QUIZ_TITLE = 'AI Gladiators - Kaladhaara 2026 LMTSM';

export const AI_GLADIATORS_QUIZ_DESCRIPTION =
  'AI & Digital Technologies Quiz | MBA Program | 20 Questions | 1 Mark Each | Suggested Time: 25 Minutes | Kaladhaara 2026 LMTSM';

export const AI_GLADIATORS_QUESTIONS = [
  {
    questionText:
      'Which statement best captures how a machine learning system differs from traditional rule-based software?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 1,
    options: [
      { optionText: 'It can only run on cloud servers', isCorrect: false, displayOrder: 1 },
      { optionText: 'It learns patterns from data instead of relying only on explicitly programmed rules', isCorrect: true, displayOrder: 2 },
      { optionText: 'It never requires human oversight', isCorrect: false, displayOrder: 3 },
      { optionText: 'It always produces 100% accurate outputs', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'In the context of LLMs, what is a "token"?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 2,
    options: [
      { optionText: 'A security credential used to log in to an AI tool', isCorrect: false, displayOrder: 1 },
      { optionText: 'A single row in a training dataset', isCorrect: false, displayOrder: 2 },
      { optionText: 'A unit of currency for purchasing AI services', isCorrect: false, displayOrder: 3 },
      {
        optionText:
          'A chunk of text (a word or part of a word) that the model processes, often the basis for usage pricing',
        isCorrect: true,
        displayOrder: 4,
      },
    ],
  },
  {
    questionText: 'What is an LLM "hallucination"?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 3,
    options: [
      {
        optionText: 'The model produces fluent, confident output that is factually incorrect or fabricated',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: 'The model refuses to answer a question', isCorrect: false, displayOrder: 2 },
      { optionText: 'The model slows down because of heavy server traffic', isCorrect: false, displayOrder: 3 },
      { optionText: 'The model translates text into a different language', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A manager pastes a 300-page report into an LLM and notices the model overlooks details from the early pages. Which concept most likely explains this?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 4,
    options: [
      { optionText: 'Overfitting', isCorrect: false, displayOrder: 1 },
      { optionText: 'Data lineage', isCorrect: false, displayOrder: 2 },
      { optionText: 'The context window limit', isCorrect: true, displayOrder: 3 },
      { optionText: 'Reinforcement learning', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A retailer wants to automatically classify thousands of customer reviews as positive, neutral or negative. Which NLP task is this?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 5,
    options: [
      { optionText: 'Machine translation', isCorrect: false, displayOrder: 1 },
      { optionText: 'Sentiment analysis', isCorrect: true, displayOrder: 2 },
      { optionText: 'Speech synthesis', isCorrect: false, displayOrder: 3 },
      { optionText: 'Image segmentation', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'Which of the following best describes generative AI?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 6,
    options: [
      { optionText: 'Systems that only classify existing data into fixed categories', isCorrect: false, displayOrder: 1 },
      { optionText: 'Systems that only forecast numeric values from historical data', isCorrect: false, displayOrder: 2 },
      { optionText: 'Systems that only automate repetitive clicks in software', isCorrect: false, displayOrder: 3 },
      {
        optionText:
          'Systems that create new content, such as text, images or code, based on patterns learned from training data',
        isCorrect: true,
        displayOrder: 4,
      },
    ],
  },
  {
    questionText:
      'An employee pastes confidential client financials into a public consumer GenAI chatbot. What is the primary risk?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 7,
    options: [
      { optionText: 'The chatbot will refuse to process the data', isCorrect: false, displayOrder: 1 },
      { optionText: "The company's cloud bill will automatically double", isCorrect: false, displayOrder: 2 },
      {
        optionText: 'Potential exposure of confidential data and breach of privacy or contractual obligations',
        isCorrect: true,
        displayOrder: 3,
      },
      { optionText: 'The model will become less accurate for all other users', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'Which best describes "vibe coding"?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 8,
    options: [
      {
        optionText:
          'Building software by describing the desired behavior in natural language to an AI assistant and iterating on the generated code, with minimal manual coding',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: 'Writing code while listening to music to boost productivity', isCorrect: false, displayOrder: 2 },
      { optionText: 'A formal methodology for auditing source code', isCorrect: false, displayOrder: 3 },
      { optionText: 'Manually converting legacy code into a newer language', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A non-technical founder ships a vibe-coded customer app straight to production without any review. What is the biggest risk?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 9,
    options: [
      { optionText: 'AI-generated apps cannot be hosted on the cloud', isCorrect: false, displayOrder: 1 },
      {
        optionText:
          'Undetected bugs, security vulnerabilities and maintainability problems, because no one fully understands or has tested the code',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'AI-generated code can never be used commercially', isCorrect: false, displayOrder: 3 },
      { optionText: 'Vibe coding cannot produce user interfaces', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'What is the main purpose of RAG (Retrieval-Augmented Generation)?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 10,
    options: [
      { optionText: 'Retrain an LLM from scratch on company data every night', isCorrect: false, displayOrder: 1 },
      { optionText: 'Compress an LLM so it can run on a mobile phone', isCorrect: false, displayOrder: 2 },
      {
        optionText:
          'Retrieve relevant documents at query time and give them to the LLM so answers are grounded in current, specific information',
        isCorrect: true,
        displayOrder: 3,
      },
      { optionText: 'Remove the need for any data storage', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'In a typical RAG pipeline, what role does a vector database play?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 11,
    options: [
      {
        optionText:
          'It stores numerical embeddings of document chunks so semantically similar content can be retrieved quickly',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: "It stores the LLM's trained weights", isCorrect: false, displayOrder: 2 },
      { optionText: 'It encrypts user passwords', isCorrect: false, displayOrder: 3 },
      { optionText: 'It writes the final answer shown to the user', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'Why is cloud computing particularly attractive for firms starting AI initiatives?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 12,
    options: [
      { optionText: 'It removes the need for any data governance', isCorrect: false, displayOrder: 1 },
      { optionText: 'It guarantees that AI models are unbiased', isCorrect: false, displayOrder: 2 },
      { optionText: 'It requires a large upfront investment in hardware', isCorrect: false, displayOrder: 3 },
      {
        optionText:
          'It offers elastic, pay-as-you-go access to computing power (such as GPUs) and managed AI services',
        isCorrect: true,
        displayOrder: 4,
      },
    ],
  },
  {
    questionText: 'Which prompt is most likely to produce a useful, business-ready output?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 13,
    options: [
      { optionText: '"Write something about our sales."', isCorrect: false, displayOrder: 1 },
      {
        optionText:
          '"Act as a senior sales analyst. Using the Q3 figures below, summarize the three key trends for the executive team in under 150 words as bullet points."',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: '"Sales analysis please, make it good."', isCorrect: false, displayOrder: 3 },
      { optionText: '"Tell me everything about sales."', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'What is "few-shot prompting"?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 14,
    options: [
      {
        optionText:
          'Including a small number of worked examples in the prompt to show the model the desired format or style',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: 'Limiting the model to a few seconds of response time', isCorrect: false, displayOrder: 2 },
      { optionText: 'Fine-tuning the model on a few thousand records', isCorrect: false, displayOrder: 3 },
      { optionText: 'Asking the same question a few times and choosing the shortest answer', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A customer-churn model scores 99% accuracy on its training data but performs poorly on new customers. What is the most likely problem?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 15,
    options: [
      { optionText: 'Underfitting', isCorrect: false, displayOrder: 1 },
      { optionText: 'Data encryption', isCorrect: false, displayOrder: 2 },
      { optionText: 'Overfitting', isCorrect: true, displayOrder: 3 },
      { optionText: 'Cloud latency', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'Which of the following is an example of first-party data for a retailer?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 16,
    options: [
      { optionText: 'A purchased list of consumer emails from a data broker', isCorrect: false, displayOrder: 1 },
      {
        optionText:
          "Purchase history and browsing behavior collected through the retailer's own app and loyalty program",
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'Demographic data from a government census', isCorrect: false, displayOrder: 3 },
      { optionText: 'Competitor pricing data from an external research firm', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'What is Robotic Process Automation (RPA) primarily used for?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 17,
    options: [
      {
        optionText:
          'Software bots that mimic human actions in rule-based, repetitive digital tasks such as data entry or invoice processing',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: 'Building physical robots for factory floors', isCorrect: false, displayOrder: 2 },
      { optionText: 'Training large language models', isCorrect: false, displayOrder: 3 },
      { optionText: 'Designing company organization charts', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText: 'How do collaborative robots ("cobots") differ from traditional industrial robots?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 18,
    options: [
      { optionText: 'They are purely software with no physical form', isCorrect: false, displayOrder: 1 },
      { optionText: 'They always operate inside fully fenced-off cages', isCorrect: false, displayOrder: 2 },
      {
        optionText: 'They are designed to work safely alongside human workers in shared spaces',
        isCorrect: true,
        displayOrder: 3,
      },
      { optionText: 'They can only be used in the automotive industry', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'In an automated workflow tool (e.g., Zapier or Microsoft Power Automate), what is a "trigger"?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 19,
    options: [
      { optionText: 'The final report generated at the end of the workflow', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'The event that starts the workflow, such as a new email or form submission',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'A penalty applied when a workflow fails', isCorrect: false, displayOrder: 3 },
      { optionText: 'The manager who approves the automation budget', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A company lets an AI agent automatically approve vendor payments. Which design choice best manages risk?',
    durationSeconds: 30,
    maxScore: 1000,
    displayOrder: 20,
    options: [
      { optionText: 'Disable activity logs to improve speed', isCorrect: false, displayOrder: 1 },
      { optionText: 'Allow the agent to approve any amount without limits', isCorrect: false, displayOrder: 2 },
      { optionText: 'Give the agent administrator access to all finance systems for flexibility', isCorrect: false, displayOrder: 3 },
      {
        optionText:
          'Add human-in-the-loop approval for high-value or unusual transactions, with audit logs and monitoring',
        isCorrect: true,
        displayOrder: 4,
      },
    ],
  },
];
