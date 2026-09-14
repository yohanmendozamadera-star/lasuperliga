import {TeamHub} from "../../../team-hub";export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TeamHub id={id}/>;}
