class CsvSanatizer {
  /**
   * Removes characters with a potential for CSV injection.
   * See: https://owasp.org/www-community/attacks/CSV_Injection
   *
   * @param string
   * @returns {string}
   */
  static removeMaliciousChars(string) {
    const csvInjectionChars = ['=', '+', '-', '@'];

    if (csvInjectionChars.includes(string.charAt(0))) {
      return CsvSanatizer.removeMaliciousChars(string.substring(1));
    } else {
      return string;
    }
  }
}

module.exports = CsvSanatizer;
