import { TournamentPortal } from "../../../../tournament-portal";

export default async function OrganizationTournamentPage({params}:{params:Promise<{organizationSlug:string;slug:string}>}){
 const {slug}=await params;
 return <TournamentPortal slug={slug}/>;
}
