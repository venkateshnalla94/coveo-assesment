export const SEARCH_UI = {
  announcement: "Welcome to the Coveo Showcase. This is a demo experience of intelligent search.",
  defaultQuery: "digital transformation",
  facets: {
    clearAllLabel: "Clear all",
    title: "Refine your results",
  },
  pagination: {
    pageSize: 4,
  },
  announcementLink: {
    href: "#",
    label: "Learn more about Coveo",
  },
  brandLabel: "COVEO",
  copyright: "© 2024 Coveo Solutions Inc. All rights reserved.",
  footerLinks: ["Privacy Policy", "Terms of Use", "Support", "Contact Us"],
  navItems: [
    { href: "#", label: "Home" },
    { href: "#", label: "Search", active: true },
    { href: "#", label: "Collections" },
    { href: "#", label: "Insights" },
  ],
  user: {
    initials: "VN",
    name: "Venkatesh N.",
  },
  sort: {
    label: "Sort by",
    relevanceLabel: "Relevance",
  },
  startup: {
    body: "Search is initialized only after submission so the privileged Coveo API key stays on the server while the browser receives a short-lived search token.",
    eyebrow: "Coveo TME Assessment",
    title: "Secure Headless Search",
  },
};

export const RESULT_TYPE_LABELS: Record<string, string> = {
  doc: "Word",
  docx: "Word",
  html: "Web Page",
  pdf: "PDF",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
  web: "Web Page",
  xls: "Excel",
  xlsx: "Excel",
};
