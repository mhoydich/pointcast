export const descriptionLabels = {full:'Full description recovered',partial:'Partial description recovered',title_only:'Full description not recovered',attachment_unavailable:'Full description not recovered'};
export function normalizeRoleLibrary(source) {
  const roles = source.roles.map((r,i)=>{
    const sections=[];
    if(r.description) sections.push({heading:r.description_status==='partial'?'Recovered overview':'Role overview',paragraphs:[r.description]});
    else sections.push({heading:'Full description not recovered',paragraphs:['The historical record confirms this role title and organization. A complete job description was not recovered. Responsibilities, requirements and working terms have not been inferred.']});
    for(const [key,heading] of [['responsibilities','Historical responsibilities'],['requirements','Historical requirements'],['preferred_qualifications','Historical preferred qualifications']])if(r[key]?.length)sections.push({heading,items:r[key]});
    const terms=[['location','Location'],['work_mode','Work mode'],['compensation','Compensation'],['hours_per_week','Hours per week'],['duration','Duration'],['eligibility','Eligibility'],['start_date','Start date'],['application_deadline','Application deadline']].filter(([key])=>r[key]!=null).map(([key,label])=>`${label}: ${r[key]}`);
    if(terms.length)sections.push({heading:'Terms in the historical source',paragraphs:['These fields describe the dated source only. They are not current hiring terms. Unspecified terms remain unverified.'],items:terms});
    if(r.historical_title_variants?.length)sections.push({heading:'Other historical titles',items:r.historical_title_variants});
    if(r.historical_listing_terms?.length)sections.push({heading:'Archived listing metadata',paragraphs:['Literal metadata retained from old recruiting records. Percentages are historical fields, not current equity, compensation or employment offers.'],items:r.historical_listing_terms});
    return {...r,number:String(i+1).padStart(2,'0'),slug:r.id,organization:r.company,summary:r.description || 'Historical title record. Full description not recovered.',sourceDepth:r.description_status,descriptionLabel:descriptionLabels[r.description_status],statusLabel:'Archived · opening unverified',statusNote:r.publication_note,sourceDateLabel:r.source_dates.join(' / '),sourceDateSummary:r.source_dates.length>1?`${r.source_dates[0]} → ${r.source_dates.at(-1)}`:r.source_dates[0],sourceNote:'Recovered from historical employer copy and recruiting records in Michael’s archive. Original organization attribution is retained.',applicationNote:'Current applications are not open through this archive. No current application route has been verified. Historical application instructions are not activated here.',tags:[r.company,descriptionLabels[r.description_status]],sections};
  });
  return {...source,verifiedAt:source.researched_at.slice(0,10),roles};
}
