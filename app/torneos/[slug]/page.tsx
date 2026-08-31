"use client";

import { useParams } from "next/navigation";
import { TournamentPortal } from "../../tournament-portal";

export default function TournamentPage() {
  const params = useParams<{ slug: string }>();
  return <TournamentPortal slug={params.slug} />;
}
