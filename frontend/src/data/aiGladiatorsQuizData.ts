export const AI_GLADIATORS_QUIZ_TITLE = 'AI Gladiators - Kaladhaara 2026 LMTSM';

export const AI_GLADIATORS_QUIZ_DESCRIPTION =
  'AI, ML & Data Science Championship | 15 Questions | 20 Seconds Per Question | Kaladhaara 2026 LMTSM';

export const AI_GLADIATORS_QUESTIONS = [
  {
    questionText:
      'What does the letter "T" stand for in "GPT", the revolutionary architecture powering models like ChatGPT?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 1,
    options: [
      { optionText: 'Tensor', isCorrect: false, displayOrder: 1 },
      { optionText: 'Transformer', isCorrect: true, displayOrder: 2 },
      { optionText: 'Transfer', isCorrect: false, displayOrder: 3 },
      { optionText: 'Tokenizer', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'What does RAG stand for in modern generative AI systems, used to ground LLM answers in external private documents?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 2,
    options: [
      { optionText: 'Recursive Automated Generation', isCorrect: false, displayOrder: 1 },
      { optionText: 'Real-time Augmented Gradient', isCorrect: false, displayOrder: 2 },
      { optionText: 'Retrieval-Augmented Generation', isCorrect: true, displayOrder: 3 },
      { optionText: 'Relational Analytical Graph', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'In the context of Large Language Models, what is an AI "hallucination"?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 3,
    options: [
      {
        optionText: 'The AI produces fluent, confident statements that are factually false or completely fabricated',
        isCorrect: true,
        displayOrder: 1,
      },
      { optionText: 'The AI server runs out of GPU memory and abruptly restarts', isCorrect: false, displayOrder: 2 },
      { optionText: 'The AI translates text into an ancient forgotten language', isCorrect: false, displayOrder: 3 },
      { optionText: 'The AI deliberately pauses to simulate human thinking', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'A machine learning model achieves 99.8% accuracy on training data but performs terribly on unseen test data. What problem has occurred?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 4,
    options: [
      { optionText: 'Underfitting', isCorrect: false, displayOrder: 1 },
      { optionText: 'Overfitting', isCorrect: true, displayOrder: 2 },
      { optionText: 'Gradient Explosion', isCorrect: false, displayOrder: 3 },
      { optionText: 'Data Imbalance', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'Recent frontier reasoning models (such as OpenAI o1/o3 and DeepSeek R1) excel at complex logic, math, and code primarily through which technique?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 5,
    options: [
      { optionText: 'Hardcoding thousands of Python if-else rules', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'Using "Test-Time Compute" and internal Chain-of-Thought reasoning before responding',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'Scraping search engine results in real-time', isCorrect: false, displayOrder: 3 },
      { optionText: 'Generating completely random responses until one passes a test', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'Why do modern AI search systems and vector databases (like Pinecone, Milvus, and Chroma) convert text and media into Vector Embeddings?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 6,
    options: [
      { optionText: 'To compress media files into smaller ZIP archives', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'To convert data into high-dimensional numerical coordinates for semantic similarity search',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'To scramble passwords for biometric encryption', isCorrect: false, displayOrder: 3 },
      { optionText: 'To automatically fix syntax errors in SQL queries', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'Which machine learning paradigm learns through trial and error by taking actions in an environment to maximize cumulative rewards?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 7,
    options: [
      { optionText: 'Supervised Learning', isCorrect: false, displayOrder: 1 },
      { optionText: 'Unsupervised Clustering', isCorrect: false, displayOrder: 2 },
      { optionText: 'Reinforcement Learning', isCorrect: true, displayOrder: 3 },
      { optionText: 'Principal Component Analysis', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'What does RLHF stand for, the critical alignment technique used to make raw pre-trained LLMs safe, helpful, and conversational?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 8,
    options: [
      { optionText: 'Reinforcement Learning from Human Feedback', isCorrect: true, displayOrder: 1 },
      { optionText: 'Recursive Language Hyperparameter Fitting', isCorrect: false, displayOrder: 2 },
      { optionText: 'Real-time Learning with Hardware Frameworks', isCorrect: false, displayOrder: 3 },
      { optionText: 'Random Linear Heuristic Filtering', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'What does it mean when a modern AI model is described as "Multimodal"?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 9,
    options: [
      { optionText: 'It runs simultaneously on Windows, macOS, and Linux', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'It can process and understand multiple types of input data (text, images, audio, video) within the same model',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'It requires multiple GPUs to boot up', isCorrect: false, displayOrder: 3 },
      { optionText: 'It supports multi-user logins with separate accounts', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'In Large Language Models, what is the "Context Window"?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 10,
    options: [
      { optionText: "The physical display dimensions of the user's laptop screen", isCorrect: false, displayOrder: 1 },
      {
        optionText: 'The total token capacity (prompt + output) that an attention mechanism can hold in memory at one time',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'The daily time period during which cloud AI APIs are free to use', isCorrect: false, displayOrder: 3 },
      { optionText: 'The graphical pop-up window used to enter credit card details', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'In data science preprocessing, what does "Data Imputation" refer to?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 11,
    options: [
      { optionText: 'Deleting the entire table whenever an anomaly is detected', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'Filling in missing or null values with estimates such as the mean, median, mode, or KNN predictions',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'Encrypting sensitive customer columns before sending them to the cloud', isCorrect: false, displayOrder: 3 },
      { optionText: 'Converting numerical data into raw audio waves', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'In modern AI Agent frameworks (like CrewAI, AutoGen, and LangChain), what does "Tool Calling" allow an LLM to do?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 12,
    options: [
      { optionText: 'Order computer hardware parts from online stores', isCorrect: false, displayOrder: 1 },
      {
        optionText: 'Connect with external APIs, calculators, code interpreters, and databases to take real-world actions',
        isCorrect: true,
        displayOrder: 2,
      },
      { optionText: 'Modify the host operating system BIOS automatically', isCorrect: false, displayOrder: 3 },
      { optionText: 'Overclock the user\'s CPU during intensive tasks', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'Which modern generative architecture powers high-quality image generators like Midjourney, Stable Diffusion, and Flux?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 13,
    options: [
      { optionText: 'Diffusion Models', isCorrect: true, displayOrder: 1 },
      { optionText: 'K-Nearest Neighbors (KNN)', isCorrect: false, displayOrder: 2 },
      { optionText: 'Decision Trees', isCorrect: false, displayOrder: 3 },
      { optionText: 'Support Vector Machines (SVM)', isCorrect: false, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'When evaluating a machine learning model on highly imbalanced data (e.g., detecting rare credit card fraud where 99.9% of transactions are legitimate), which metric is LEAST reliable by itself?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 14,
    options: [
      { optionText: 'Precision', isCorrect: false, displayOrder: 1 },
      { optionText: 'Recall', isCorrect: false, displayOrder: 2 },
      { optionText: 'F1-Score', isCorrect: false, displayOrder: 3 },
      { optionText: 'Raw Accuracy', isCorrect: true, displayOrder: 4 },
    ],
  },
  {
    questionText:
      'What prompt engineering technique involves providing 2 to 3 example question-answer pairs directly in the prompt before asking the model to solve a new problem?',
    durationSeconds: 20,
    maxScore: 1000,
    displayOrder: 15,
    options: [
      { optionText: 'Zero-Shot Prompting', isCorrect: false, displayOrder: 1 },
      { optionText: 'Few-Shot Prompting', isCorrect: true, displayOrder: 2 },
      { optionText: 'Model Quantization', isCorrect: false, displayOrder: 3 },
      { optionText: 'Gradient Descent', isCorrect: false, displayOrder: 4 },
    ],
  },
];
