// lib/utils/storage.ts
export interface DeploymentFormData {
    heroTitle: string;
    bio: string;
    aboutTitle: string;
    aboutText: string[];
    contactTitle: string;
    contactBio: string;
}

export function saveDeploymentData(data: DeploymentFormData): void {
    Object.entries(data).forEach(([key, value]) => {
        if (key === "aboutText") {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value as string);
        }
    });
}

export function loadDeploymentData(): Partial<DeploymentFormData> {
    return {
        heroTitle: localStorage.getItem("heroTitle") || "",
        bio: localStorage.getItem("bio") || "",
        aboutTitle: localStorage.getItem("aboutTitle") || "",
        aboutText: localStorage.getItem("aboutText") 
            ? JSON.parse(localStorage.getItem("aboutText") || "[]") 
            : [],
        contactTitle: localStorage.getItem("contactTitle") || "",
        contactBio: localStorage.getItem("contactBio") || "",
    };
}

export function clearDeploymentData(): void {
    const keys = [
        "heroTitle",
        "bio",
        "aboutTitle",
        "aboutText",
        "contactTitle",
        "contactBio",
    ];
    keys.forEach(key => localStorage.removeItem(key));
}