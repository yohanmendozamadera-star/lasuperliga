import { TournamentAdmin } from "../../../tournament-admin";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TournamentAdmin id={id}/>;}
