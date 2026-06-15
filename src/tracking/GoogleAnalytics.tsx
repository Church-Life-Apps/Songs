import ReactGA from "react-ga4";

// GA4 Measurement ID (migrated from the dead Universal Analytics property UA-183902236-1).
const MeasurementID = "G-N1RESQYRT9";

export const initGA = (): void => {
  ReactGA.initialize(MeasurementID);
};

export const PageView = (): void => {
  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname + window.location.search,
  });
  console.debug("Page viewed");
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
