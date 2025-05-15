/**
 * String utility functions for Khmer language
 */

/**
 * Checks if a string contains Khmer characters
 * @param {String} text - The text to check
 * @returns {Boolean} True if the text contains Khmer characters
 */
const containsKhmer = (text) => {
  // Khmer Unicode range: \u1780-\u17FF
  const khmerRegex = /[\u1780-\u17FF]/;
  return khmerRegex.test(text);
};

/**
 * Get a greeting based on the time of day in Khmer
 * @returns {String} A greeting in Khmer
 */
const getKhmerGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'សួស្តី អរុណសួស្តី!'; // Good morning
  } else if (hour < 18) {
    return 'សួស្តី ទិវាសួស្តី!'; // Good afternoon
  } else {
    return 'សួស្តី រាត្រីសួស្តី!'; // Good evening
  }
};

/**
 * Truncate a string to a specified length
 * @param {String} text - The text to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} Truncated string
 */
const truncate = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

module.exports = {
  containsKhmer,
  getKhmerGreeting,
  truncate
};
