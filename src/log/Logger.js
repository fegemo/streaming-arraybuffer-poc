function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

export default class AbstractLogger {
  constructor () {
  }

  get timestamp() {
    const now = new Date();

    const year = padDigits(now.getFullYear(), 4);
    const month = padDigits(now.getMonth(), 2);
    const day = padDigits(now.getDate(), 2);
    const datePart = `${year}-${month}-${day}`

    const hour = padDigits(now.getHours(), 2);
    const minute = padDigits(now.getMinutes(), 2);
    const second = padDigits(now.getSeconds(), 2);
    const millisecond = padDigits(now.getMilliseconds(), 3);
    const timePart = `${hour}h${minute}m ${second}s ${millisecond}ms`;

    return `${datePart} ${timePart}`;
  }

  info () {
  }

  error () {
  }
}
