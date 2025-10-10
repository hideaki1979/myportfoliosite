export interface PersonData {
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  image?: string;
  sameAs: string[];
  worksFor?: {
    name: string;
    url: string;
  };
}

export function createPersonStructuredData(data: PersonData) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    jobTitle: data.jobTitle,
    url: data.url,
    ...(data.image && { image: data.image }),
    ...(data.sameAs && { sameAs: data.sameAs }),
    ...(data.worksFor && {
      worksFor: {
        "@type": "Organization",
        name: data.worksFor.name,
        ...(data.worksFor.url && { url: data.worksFor.url }),
      },
    }),
  };
}
