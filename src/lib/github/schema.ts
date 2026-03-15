export interface ConfigField {
    name: string;
    type: 'string' | 'text' | 'array';
    label: string;
    description?: string;
    defaultValue?: string;
    separator?: string; // for arrays, e.g. "|"
}

export async function fetchTemplateSchema(repoUrl: string): Promise<ConfigField[] | null> {
    try {
        // Extract owner/repo from GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return null;

        const [, owner, repo] = match;

        // Fetch the template's config.json to understand its structure
        const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/config.json`);
        if (!response.ok) return null;

        const config = await response.json();

        // Generate schema from config keys
        return Object.keys(config)
            .filter(key => key !== 'username')  // ADD THIS LINE
            .map(key => ({
                name: key,
                type: Array.isArray(config[key]) ? 'array' : 'string',
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                separator: '|',
                defaultValue: Array.isArray(config[key]) ? config[key].join(' | ') : config[key]
            }));
    } catch (error) {
        console.error("Failed to fetch template schema:", error);
        return null;
    }
}