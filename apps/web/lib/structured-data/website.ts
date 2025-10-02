export interface WebsiteData {
    name: string;
    description: string;
    url: string;
    author: {
        name: string;
        url: string;
    }
    inLanguage: string;
    copyrightYear?: number;
}

export function createWebsiteStructuredData(data: WebsiteData) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Website',
        name: data.name,
        description: data.description,
        url: data.url,
        author: {
            '@type': 'Person',
            name: data.author.name,
            url: data.author.url,
        },
        inLanguage: data.inLanguage,
        ...(data.copyrightYear && { copyrightYear: data.copyrightYear }),
    }
}