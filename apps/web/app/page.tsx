import { Metadata } from "next";
import Hero from "../components/sections/Hero";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ホーム",
    openGraph: {
      title: "Mirrorman Portfolio - ホーム",
      url: "/",
      type: "website",
      images: [
        {
          url: "/og-home.jpg",
          width: 1200,
          height: 630,
          alt: "Mirrorman Portfolio - ホーム",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-home.jpg"],
    },
    alternates: {
      canonical: "/",
    },
  }
}

export default function Home() {
  return (
    <div>
      <Hero />
    </div>
  );
}
