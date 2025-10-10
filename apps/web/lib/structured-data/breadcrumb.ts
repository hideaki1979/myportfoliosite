export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbData {
  items: BreadcrumbItem[];
}

export function createBreadcrumbStructuredData(data: BreadcrumbData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: data.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
