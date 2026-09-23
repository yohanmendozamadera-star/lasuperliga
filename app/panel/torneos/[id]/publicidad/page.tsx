import { TournamentAdvertisingAdmin } from "../../../../tournament-advertising-admin";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TournamentAdvertisingAdmin id={id}/>;}
