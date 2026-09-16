/* eslint-disable @typescript-eslint/no-explicit-any */

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadTournamentLogo(supabase:any, userId:string, tournamentId:string, file:File) {
  if (!allowedTypes.has(file.type)) return { url:null, error:"El logo debe ser una imagen JPG, PNG o WebP." };
  if (file.size > 5 * 1024 * 1024) return { url:null, error:"El logo no puede pesar más de 5 MB." };
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${userId}/${tournamentId}/logo.${extension}`;
  const { error } = await supabase.storage.from("tournament-images").upload(path, file, { cacheControl:"3600", upsert:true, contentType:file.type });
  if (error) return { url:null, error:error.message };
  const { data } = supabase.storage.from("tournament-images").getPublicUrl(path);
  return { url:`${data.publicUrl}?v=${Date.now()}`, error:null };
}
