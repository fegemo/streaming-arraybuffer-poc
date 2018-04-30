import AbstractLogger from './Logger.js'
const log = Symbol('log');
const addStyling = Symbol('addStyling');
let styleSheet = null;

export default class HTMLLogger extends AbstractLogger {
  constructor (targetElementOrSelector) {
    super();

    if (!targetElementOrSelector) {
      throw new Error('A target element or a selector must be supplied to the HTMLLogger. No value was provided.');
    }

    if (targetElementOrSelector instanceof HTMLElement) {
      this.targetElements = [targetElementOrSelector];
    } else if (typeof targetElementOrSelector === 'string') {
      this.targetElements = [...document.querySelectorAll(targetElementOrSelector)];
    } else {
      throw new Error(`A target element or a selector must be supplied to the HTMLLogger. The value was of type ${typeof targetElementOrSelector}`);
    }

    this[addStyling]('.log-info { color: cornflowerblue; }');
    this[addStyling]('.log-error { color: darkred; }');
  }

  [addStyling] (ruleText) {
    if (!styleSheet) {
      const styleEl = document.createElement('style');

      styleEl.appendChild(document.createTextNode(''));
      document.head.appendChild(styleEl);
      styleSheet = styleEl.sheet;
    }

    styleSheet.insertRule(ruleText);
  }


  [log] (message, cssClass) {
    this.targetElements.forEach((el) => {
      el.innerHTML += `<div>[${super.timestamp}] <span class=${cssClass}>${message}</span></div>`;
    });
  }

  info (message) {
    this[log](message, 'log-info');
  }

  error (message) {
    this[log](message, 'log-error');
  }
}
