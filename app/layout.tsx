import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "lasuperliga.com";
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "LaSuperliga — Tu torneo, una sola pasión",
    description: "Crea, organiza y vive campeonatos de fútbol con equipos, jugadores, estadísticas y resultados en vivo.",
    openGraph: { title: "Copa La Playa 2026 | LaSuperliga", description: "Donde el barrio se vuelve leyenda.", images: [{ url: image, width: 1732, height: 909 }] },
    twitter: { card: "summary_large_image", title: "Copa La Playa 2026 | LaSuperliga", description: "Donde el barrio se vuelve leyenda.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
