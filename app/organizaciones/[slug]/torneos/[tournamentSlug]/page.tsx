import { TournamentPortal } from "../../../../tournament-portal";

export default async function OrganizationTournamentPage({params}:{params:Promise<{slug:string;tournamentSlug:string}>}){
  const {tournamentSlug}=await params;
  return <TournamentPortal slug={tournamentSlug}/>;
}
