import { baseUrl } from "../../lib/constants";
import { createBreadcrumbStructuredData } from "../../lib/structured-data";

export default function Head() {
  const breadcrumbData = createBreadcrumbStructuredData({
    items: [
      { name: "ホーム", url: baseUrl },
      { name: "Article", url: `${baseUrl}/article` },
    ],
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  );
}
