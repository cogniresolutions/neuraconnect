// Common words that might cause issues with OpenAI's content policy
const FORBIDDEN_WORDS = [
  'harmful',
  'illegal',
  'malicious',
  'offensive',
  'explicit',
  'violent',
  'hate',
  'discriminatory',
  'inappropriate',
  'nsfw',
];

// Words that might enhance the persona description
const SUGGESTED_WORDS = [
  'helpful',
  'friendly',
  'professional',
  'knowledgeable',
  'creative',
  'supportive',
  'efficient',
  'reliable',
  'innovative',
  'collaborative',
];

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export const validatePersonaDescription = (description: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    issues: [],
    suggestions: [],
  };

  // Check minimum length
  if (description.length < 50) {
    result.isValid = false;
    result.issues.push('Description should be at least 50 characters long');
  }

  // Check for forbidden words
  const lowercaseDesc = description.toLowerCase();
  FORBIDDEN_WORDS.forEach(word => {
    if (lowercaseDesc.includes(word)) {
      result.isValid = false;
      result.issues.push(`Contains inappropriate term: "${word}"`);
    }
  });

  // Generate suggestions for improvement
  const hasAnySuggestedWord = SUGGESTED_WORDS.some(word => 
    lowercaseDesc.includes(word)
  );

  if (!hasAnySuggestedWord) {
    result.suggestions.push(
      'Consider adding descriptive terms like: ' + 
      SUGGESTED_WORDS.slice(0, 3).join(', ')
    );
  }

  return result;
};

export const getSuggestedDescription = (description: string): string => {
  let improvedDesc = description;
  
  // Replace forbidden words with appropriate alternatives
  FORBIDDEN_WORDS.forEach((word, index) => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(improvedDesc)) {
      improvedDesc = improvedDesc.replace(regex, SUGGESTED_WORDS[index] || 'appropriate');
    }
  });

  return improvedDesc;
};