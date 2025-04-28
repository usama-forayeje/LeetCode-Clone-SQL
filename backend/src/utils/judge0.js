import { logger } from "./logger";
import axios from "axios";

// Find Judge0 language ID by language name

export const getJudge0LanguageId = (language) => {
  const languageMap = {
    PYTHON: 71,
    JAVA: 62,
    JAVASCRIPT: 63,
  };
  return languageMap[language.toUpperCase()] || null;
};

// Submit multiple codes together to Judge0
export const submitBatch = async (submissions) => {
  const { data } = await axios.post(
    `${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,
    { submissions },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  logger.info("Submissions Results:", data);
  return data.submissions;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check all submissions results until all are done
export const pollBatchResults = async (tokens) => {
  while (true) {
    const { data } = await axios.get(
      `${process.env.JUDGE0_API_URL}/submissions/batch?tokens=${tokens.join(",")}&base64_encoded=false`
    );

    const results = data.submissions; 

    const isAllDone = results.every(
      (r) => r.status.id !== 1 && r.status.id !== 2 
    );

    if (isAllDone) {
      return results; 
    }

    await sleep(1000); 
  }
};
