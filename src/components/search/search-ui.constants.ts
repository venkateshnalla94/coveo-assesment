export const SEARCH_UI = {
  announcement: "RoboMotion Industries product discovery demo powered by Coveo.",
  defaultQuery: "welding arm",
  facets: {
    clearAllLabel: "Clear all",
    title: "Refine your results",
  },
  pagination: {
    pageSize: 4,
  },
  announcementLink: {
    href: "/catalog",
    label: "Industrial robotics resources",
  },
  brandLabel: "RoboMotion Industries",
  copyright: "© 2024 Coveo Solutions Inc. All rights reserved.",
  footerLinks: ["Privacy Policy", "Terms of Use", "Support", "Contact Us"],
  navItems: [
    { href: "/catalog", label: "Products", active: true },
    { href: "#", label: "Solutions" },
    { href: "#", label: "Industries" },
    { href: "#", label: "Resources" },
    { href: "#", label: "Support" },
    { href: "#", label: "About" },
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
    body: "Search is initialized through secure server-side boundaries so privileged Coveo credentials stay out of client bundles.",
    eyebrow: "RoboMotion Industries",
    title: "Industrial Robotics Product Discovery",
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
