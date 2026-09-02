"use client";
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import "./platform.css";

type Organization={id:string;name:string;slug:string;logo_url:string|null;description:string|null};
type Tournament={id:string;name:string;slug:string;image_url:string|null;description:string|null;start_date:string;status:string;format:string};

export function OrganizationPortal({slug}:{slug:string}){
 const supabase=useMemo(()=>getSupabaseBrowserClient(),[]),[organization,setOrganization]=useState<Organization|null>(null),[tournaments,setTournaments]=useState<Tournament[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase)return;(async()=>{const {data:org}=await supabase.from("organizations").select("id,name,slug,logo_url,description").eq("slug",slug).maybeSingle();setOrganization(org);if(org){const {data}=await supabase.from("tournaments").select("id,name,slug,image_url,description,start_date,status,format").eq("organization_id",org.id).eq("is_public",true).order("start_date",{ascending:false});setTournaments(data??[]);}setLoading(false);})();},[supabase,slug]);
 if(loading)return <main className="portalState"><img src="/liguita-logo-google-white.png" alt="Liguita"/><p>Cargando liga…</p></main>;
 if(!organization)return <main className="portalState"><img src="/liguita-logo-google-white.png" alt="Liguita"/><h1>Esta liga aún no existe</h1><a href="https://liguita.co">Volver a Liguita</a></main>;
 return <main className="publicPortal organizationPortal"><header><a href="/"><img src={organization.logo_url||"/liguita-logo-google-white.png"} alt=""/>{organization.name}</a><nav><a href="#torneos">Torneos</a><a href="https://liguita.co">Liguita.co</a></nav><button onClick={()=>location.href="https://liguita.co"}>Mi cuenta</button></header><section className="portalHero organizationHero"><span>LIGA OFICIAL</span><h1>{organization.name}</h1><p>{organization.description||"Consulta todos nuestros campeonatos, partidos, resultados y estadísticas oficiales."}</p><div>⚽ {tournaments.length} {tournaments.length===1?"torneo publicado":"torneos publicados"}</div></section><section id="torneos" className="tournamentCatalog"><p className="sectionLabel">NUESTROS CAMPEONATOS</p><h2>Elige un torneo</h2>{tournaments.length?<div className="catalogGrid">{tournaments.map(t=><a key={t.id} href={`/torneos/${t.slug}`}><div style={{backgroundImage:`url(${t.image_url||"/liguita-logo-white.png"})`}}/><span>{t.status.replace("_"," ")}</span><h3>{t.name}</h3><p>{t.description||`Inicia el ${new Date(`${t.start_date}T12:00:00`).toLocaleDateString("es-CO")}.`}</p><small>Entrar al torneo →</small></a>)}</div>:<div className="noTournaments"><h3>Aún no hay torneos publicados</h3><p>Vuelve pronto para conocer el próximo campeonato.</p></div>}</section><footer className="platformFooter"><b>LIGUITA</b><span>{slug}.liguita.co</span><div><a href="https://liguita.co/privacidad">Privacidad</a></div></footer></main>;
}
