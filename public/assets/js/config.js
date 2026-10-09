var FLIPICK={demoUrl:"https://calendly.com/rahul-uppal-flipick/30min"};!function(){"use strict";function e(e){(e||document).querySelectorAll("[data-demo-link]").forEach(function(e){e.setAttribute("href",FLIPICK.demoUrl)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",function(){e()}):e(),new MutationObserver(function(t){t.forEach(function(t){t.addedNodes.forEach(function(t){1===t.nodeType&&e(t)})})}).observe(document.documentElement,{childList:!0,subtree:!0})}();

// Free/personal email domains blocked by "work email" form fields.
// Update this list as new personal providers appear - no other code changes needed.
// Keep in sync with $blockedEmailDomains in api/send-campaign-mail.php.
FLIPICK.blockedEmailDomains = [
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.co.in", "ymail.com", "rocketmail.com",
  "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "proton.me", "protonmail.com",
  "gmx.com", "mail.com", "zoho.com",
  "yandex.com",
  "rediffmail.com",
  "inbox.com"
];