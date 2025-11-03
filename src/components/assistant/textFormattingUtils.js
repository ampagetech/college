// textFormattingUtils.js

/**
 * Decodes HTML entities in a string
 * @param {string} text - The text with HTML entities
 * @returns {string} - The decoded text
 */
const decodeHtmlEntities = (text) => {
  if (!text) return '';
  
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

/**
 * Cleans text by removing extra spaces, normalizing whitespace, and decoding HTML entities
 * @param {string} text - The text to clean
 * @returns {string} - The cleaned text
 */
export const cleanText = (text) => {
  if (!text) return '';
  // First decode HTML entities, then normalize whitespace
  const decodedText = decodeHtmlEntities(text);
  return decodedText.replace(/\s+/g, ' ').trim();
};

/**
 * Checks if a string contains LaTeX notation
 * @param {string} text - The text to check
 * @returns {boolean} - Whether the text contains LaTeX
 */
export const containsLatex = (text) => {
  if (!text) return false;
  return text.includes('$') || text.includes('\\(') || text.includes('\\[');
};

/**
 * Strips option prefixes like "A.", "B.", etc. from the beginning of options
 * @param {string} option - The option text to process
 * @param {number} index - The index of the option (0 for A, 1 for B, etc.)
 * @returns {string} - The cleaned option text
 */
const stripOptionPrefix = (option, index) => {
  if (!option) return '';
  
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const expectedLetter = letters[index];
  
  // Check for prefixes like "A.", "A)", "A:", or "A "
  const prefixRegex = new RegExp(`^${expectedLetter}[.):] ?`, 'i');
  
  return option.replace(prefixRegex, '').trim();
};

/**
 * Processes a question by cleaning text and stripping option prefixes
 * @param {Object} question - The question object to process
 * @returns {Object} - The processed question
 */
export const processQuestion = (question) => {
  return {
    ...question,
    text: cleanText(question.text),
    options: question.options.map((option, index) => {
      const cleanedOption = cleanText(option);
      return stripOptionPrefix(cleanedOption, index);
    })
  };
};