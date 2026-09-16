"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */

const roundLabel = (teams:number, round:number) => {
  const remaining = teams / Math.pow(2, round);
  if (remaining === 2) return "Final";
  if (remaining === 4) return "Semifinales";
  if (remaining === 8) return "Cuartos de final";
  if (remaining === 16) return "Octavos de final";
  return `Ronda ${round + 1}`;
};

function BracketTeam({ team, fallback, score }:{ team:any; fallback:string; score?:number }) {
  return <div className="bracketTeam"><span>{team?.crest_url?<img src={team.crest_url} alt=""/>:<i>?</i>}<b>{team?.name||fallback}</b></span>{typeof score==="number"&&<strong>{score}</strong>}</div>;
}

export function PublicBracket({ matches, qualifiers }:{ matches:any[]; qualifiers:number }) {
  const requested = [2,4,8,16].includes(Number(qualifiers)) ? Number(qualifiers) : Math.max(2, Math.pow(2, Math.ceil(Math.log2(Math.max(2,matches.length*2)))));
  const rounds = Math.log2(requested);
  const phaseSequences = [...new Set(matches.map(match=>Number(match.phase?.sequence||0)))].sort((a,b)=>a-b);
  const matchesByRound = Array.from({length:rounds},(_,round)=>{
    const sequence=phaseSequences[round];
    return sequence===undefined?[]:matches.filter(match=>Number(match.phase?.sequence||0)===sequence);
  });
  const finalMatch=matchesByRound[rounds-1]?.[0];
  const champion=finalMatch?.status==="finished"?(Number(finalMatch.home_score)>Number(finalMatch.away_score)?finalMatch.home:Number(finalMatch.away_score)>Number(finalMatch.home_score)?finalMatch.away:null):null;

  return <section id="eliminacion" className="portalSection publicKnockout"><p className="sectionLabel">FASE ELIMINATORIA</p><h2>Camino a la final</h2><p className="bracketIntro">Cada llave se cruza con la siguiente hasta definir al campeón.</p><div className={`bracketTree rounds-${rounds}`}>{Array.from({length:rounds},(_,round)=>{
    const expected=requested/Math.pow(2,round+1), actual=matchesByRound[round];
    return <div className="bracketRound" key={round}><h3>{roundLabel(requested,round)}</h3><div className="bracketRoundMatches">{Array.from({length:expected},(_,index)=>{
      const match=actual[index], sourceA=index*2+1, sourceB=index*2+2;
      return <article className="bracketMatch" key={match?.id||`${round}-${index}`}><small>{round===0?`Llave ${index+1}`:`Ganadores ${sourceA} y ${sourceB}`}</small><BracketTeam team={match?.home} fallback={round===0?"Por definir":`Ganador llave ${sourceA}`} score={match?.status==="finished"?match.home_score:undefined}/><BracketTeam team={match?.away} fallback={round===0?"Por definir":`Ganador llave ${sourceB}`} score={match?.status==="finished"?match.away_score:undefined}/>{match?.scheduled_at&&<time>{new Date(match.scheduled_at).toLocaleString("es-CO")}</time>}</article>;
    })}</div></div>;
  })}<div className="bracketChampion"><span>{champion?.crest_url?<img src={champion.crest_url} alt=""/>:"🏆"}</span><b>CAMPEÓN</b><small>{champion?.name||"Ganador de la final"}</small></div></div></section>;
}
