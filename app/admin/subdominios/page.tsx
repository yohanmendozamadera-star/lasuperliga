"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import "../../platform.css";

type Request={id:string;requested_subdomain:string;status:string;requested_at:string;admin_notes:string|null;organizations:{name:string;contact_name:string|null;contact_phone:string|null;contact_email:string|null}|null};

export default function SubdomainAdmin(){
 const supabase=useMemo(()=>getSupabaseBrowserClient(),[]),[requests,setRequests]=useState<Request[]>([]),[loading,setLoading]=useState(true),[message,setMessage]=useState("");
 const load=async()=>{if(!supabase)return;const {data,error}=await supabase.from("subdomain_requests").select("id,requested_subdomain,status,requested_at,admin_notes,organizations(name,contact_name,contact_phone,contact_email)").order("requested_at",{ascending:false});if(error)setMessage("Esta bandeja solo está disponible para el administrador de Liguita.");else setRequests((data??[]) as unknown as Request[]);setLoading(false);};
 useEffect(()=>{load();},[]);
 const update=async(id:string,status:"approved"|"active"|"rejected")=>{if(!supabase||!confirm(`¿Estás seguro de cambiar esta solicitud a ${status}?`))return;const now=new Date().toISOString();const changes:{status:string;reviewed_at:string;activated_at?:string}={status,reviewed_at:now};if(status==="active")changes.activated_at=now;const {error}=await supabase.from("subdomain_requests").update(changes).eq("id",id);if(error)setMessage(error.message);else load();};
 return <main className="adminSubdomains"><header><a href="/">← Liguita</a><div><p className="sectionLabel">ADMINISTRACIÓN</p><h1>Solicitudes de subdominios</h1></div></header>{loading?<p>Cargando…</p>:message?<div className="formMessage">{message}</div>:<div className="requestTable">{requests.map(r=><article key={r.id}><div><span className={`requestStatus ${r.status}`}>{r.status}</span><h2>{r.organizations?.name}</h2><b>{r.requested_subdomain}.liguita.co</b><p>{r.organizations?.contact_name} · {r.organizations?.contact_phone}<br/>{r.organizations?.contact_email}</p></div><div className="adminAlias"><small>Alias exacto para agregar en Netlify</small><code>{r.requested_subdomain}.liguita.co</code><button onClick={()=>navigator.clipboard.writeText(`${r.requested_subdomain}.liguita.co`)}>Copiar</button></div><div className="requestActions"><button onClick={()=>update(r.id,"approved")}>Aprobar</button><button onClick={()=>update(r.id,"active")}>Marcar activo</button><button onClick={()=>update(r.id,"rejected")}>Rechazar</button></div></article>)}</div>}</main>;
}
