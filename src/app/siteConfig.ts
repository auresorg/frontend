export const siteConfig = {
  name: "AURES",
  url: "https://aures.vishok.me",
  description: "Your professional identity",
  baseLinks: {
    overview: "/dashboard/overview",
    projects: "/dashboard/projects",
    certifications: "/dashboard/certifications",
    awards: "/dashboard/awards",
    settings: {
      audit: "/settings/audit",
      users: "/settings/users",
      billing: "/settings/billing",
    },
    login: "/",
    onboarding: "/onboarding/name",
  },
}

export type siteConfig = typeof siteConfig
