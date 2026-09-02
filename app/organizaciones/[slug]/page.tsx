import { OrganizationPortal } from "../../organization-portal";

export default async function OrganizationPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <OrganizationPortal slug={slug}/>;
}
