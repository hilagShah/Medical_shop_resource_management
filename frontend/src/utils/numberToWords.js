// Helper to convert Indian Rupee numeric amounts to words
export const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n) => {
    let output = '';
    if (n >= 100) {
      output += `${a[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 20) {
      output += `${b[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) {
      output += `${a[n]} `;
    }
    return output.trim();
  };

  const rounded = Math.round(Number(num) * 100) / 100;
  const wholePart = Math.floor(rounded);
  const paisePart = Math.round((rounded - wholePart) * 100);

  if (wholePart === 0 && paisePart === 0) return 'Rupees Zero Only';

  let result = '';

  const crore = Math.floor(wholePart / 10000000);
  let remainder = wholePart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  const hundred = remainder;

  if (crore > 0) {
    result += `${convertGroup(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertGroup(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertGroup(thousand)} Thousand `;
  }
  if (hundred > 0) {
    result += `${convertGroup(hundred)} `;
  }

  result = result.trim();
  let finalStr = result ? `Rupees ${result}` : '';

  if (paisePart > 0) {
    finalStr += `${finalStr ? ' and ' : 'Rupees '}${convertGroup(paisePart)} Paise`;
  }

  return `${finalStr} Only`;
};
