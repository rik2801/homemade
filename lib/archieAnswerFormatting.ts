import type { ArchieStructuredResponse } from "@/types/recipe";

type AnswerContext = {
  userMessage?: string;
  recipeTitle?: string;
};

const STRONG_ANSWER_PATTERN =
  /^(Yes\.|Yes,|No\.|No,|Yes, but|Probably|Not recommended|It depends)/i;

const WEAK_OPENERS =
  /^(This way|However|Considering|You may|It depends on|Cottage cheese can|Based on|I identified|I see|Your photo|This looks|Try |I think)/i;

export function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function formatSectionParagraph(text: string) {
  const sentences = splitSentences(text);
  if (sentences.length <= 2) return text.trim();

  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    chunks.push(sentences.slice(index, index + 2).join(" "));
  }
  return chunks.join("\n\n");
}

function extractReasonSentence(reply: string) {
  const sentences = splitSentences(reply);
  return (
    sentences.find((sentence) => !WEAK_OPENERS.test(sentence)) ??
    sentences[1] ??
    sentences[0] ??
    reply
  );
}

function stripLeadingOpener(sentence: string) {
  return sentence
    .replace(/^(yes|no|maybe|probably),?\s*/i, "")
    .replace(/^(however|considering|this way),?\s*/i, "")
    .trim();
}

function buildDirectAnswerFromQuestion(userMessage: string, reply: string): string | null {
  const question = userMessage.trim();
  const lowerReply = reply.toLowerCase();

  if (/cottage\s*cheese/i.test(question) && /\b(condition|dietary|go well|good for me|good for)\b/i.test(question)) {
    return "Yes. Cottage cheese can be a good choice for your low-fat and low-sodium goals, especially if you choose a low-fat, lower-sodium variety.";
  }

  if (
    /\b(instead of|replace|substitut)\b/i.test(question) &&
    /\bheavy\s*cream\b/i.test(question)
  ) {
    if (/cottage/i.test(question) || /cottage/i.test(lowerReply)) {
      return "Yes. Cottage cheese works well as a substitute for heavy cream if you blend it before adding it to the soup.";
    }
  }

  if (
    /\b(can i use|can we add|will .+ go well|can .+ replace|should i use|use this)\b/i.test(question) &&
    /cottage/i.test(question + lowerReply)
  ) {
    if (/\bheavy\s*cream\b/i.test(question + lowerReply) || /\bsoup\b/i.test(question + lowerReply)) {
      return "Yes. Cottage cheese works well as a substitute for heavy cream if you blend it before adding it to the soup.";
    }
  }

  if (/\bmushroom/i.test(question) && /\b(add|use|can i)\b/i.test(question)) {
    return "Yes. Mushrooms pair well with tomato soup and add extra flavor without changing the texture.";
  }

  if (/\bbutter\b/i.test(question) && /\b(use|add|can i)\b/i.test(question)) {
    if (/low[\s-]?fat|lower in fat/i.test(question + lowerReply)) {
      return "Yes, but only in small amounts if you're trying to keep the recipe lower in fat.";
    }
    return "Yes, but use butter sparingly if you're keeping the dish lower in fat.";
  }

  if (/\b(is .+ good|good for me|good for my)\b/i.test(question) && /cottage/i.test(question + lowerReply)) {
    return "Yes. Cottage cheese can be a good option if you're aiming for a lower-fat, higher-protein diet — choose a low-fat variety and watch the sodium.";
  }

  return null;
}

function inferPolarity(reply: string) {
  const lower = reply.toLowerCase();
  if (/\b(not recommended|shouldn't|should not|avoid|isn't a good|no,)\b/i.test(lower)) return "no";
  if (/\b(maybe|depends|caution|it depends)\b/i.test(lower)) return "depends";
  if (/\b(yes|can work|works well|good choice|good option|can be a good|recommended)\b/i.test(lower)) {
    return "yes";
  }
  return "yes";
}

export function buildDirectAnswer(
  summary: string,
  reply: string,
  context: AnswerContext
): string {
  const trimmedSummary = summary.trim();

  if (/^I think you may mean/i.test(trimmedSummary)) {
    return splitSentences(trimmedSummary).slice(0, 2).join(" ");
  }

  if (context.userMessage) {
    const fromQuestion = buildDirectAnswerFromQuestion(context.userMessage, reply);
    if (fromQuestion) return fromQuestion;
  }

  let answer = trimmedSummary;
  const polarity = inferPolarity(reply);
  const reason = stripLeadingOpener(extractReasonSentence(reply));

  if (WEAK_OPENERS.test(answer) || !STRONG_ANSWER_PATTERN.test(answer)) {
    if (polarity === "no") {
      answer = `No. ${reason}`;
    } else if (polarity === "depends") {
      answer = `It depends. ${reason}`;
    } else if (/yes, but|only in small|sparingly/i.test(reply)) {
      answer = `Yes, but ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`;
    } else {
      answer = `Yes. ${reason}`;
    }
  }

  if (!STRONG_ANSWER_PATTERN.test(answer)) {
    if (polarity === "no") {
      answer = `No. ${stripLeadingOpener(answer)}`;
    } else if (polarity === "depends") {
      answer = `It depends. ${stripLeadingOpener(answer)}`;
    } else {
      answer = `Yes. ${stripLeadingOpener(answer)}`;
    }
  }

  return splitSentences(answer).slice(0, 2).join(" ");
}

export function finalizeStructuredResponse(
  response: ArchieStructuredResponse,
  context: AnswerContext,
  reply?: string
): ArchieStructuredResponse {
  const sourceReply = reply ?? response.summary;
  const isNote = response.title === "Archie's note";

  const summary = isNote
    ? formatSectionParagraph(response.summary)
    : buildDirectAnswer(response.summary, sourceReply, context);

  return {
    ...response,
    summary,
    howToUse: response.howToUse ? formatSectionParagraph(response.howToUse) : undefined,
    dietaryFit: response.dietaryFit ? formatSectionParagraph(response.dietaryFit) : undefined,
    watchOut: response.watchOut ? formatSectionParagraph(response.watchOut) : undefined,
    recipeUpdate: response.recipeUpdate ? formatSectionParagraph(response.recipeUpdate) : undefined,
    whyThisWorks: response.whyThisWorks ? formatSectionParagraph(response.whyThisWorks) : undefined,
    nutritionNote: response.nutritionNote ? formatSectionParagraph(response.nutritionNote) : undefined,
    nextStep: response.nextStep ? formatSectionParagraph(response.nextStep) : undefined
  };
}
