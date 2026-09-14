import { MatchSheet } from "../../match-sheet";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchSheet id={id} />;
}
