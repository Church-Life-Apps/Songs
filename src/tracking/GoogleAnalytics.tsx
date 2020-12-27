import ReactGA from "react-ga";

export const initGA = (): void => {
  ReactGA.initialize(process.env.GOOGLEANALYTICS_STREAMID as string);
};

export const PageView = (): void => {
  ReactGA.pageview(window.location.pathname + window.location.search);
  console.log("Page viewed");
};

/**
 * Event - Add custom tracking event.
 * @param {string} category
 * @param {string} action
 * @param {string} label
 */

export const Event = (category: string, action: string, label: string): void => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};
