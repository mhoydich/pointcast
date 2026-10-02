import type { APIRoute } from 'astro';
import { CAPSULES, CONCEPT_LABEL, LOOKS, SOURCES, STUDY_DATE, TIMELINE, lookImage } from '../data/fila-study';
import rights from '../../docs/research/fila-image-rights.json';
export const GET: APIRoute = () => Response.json({
  title:'FILA / From thread to court to culture',url:'https://pointcast.xyz/fila/',lookbook:'https://pointcast.xyz/fila/2027/',researchedAt:STUDY_DATE,
  independentEditorial:true,affiliation:null,conceptLabel:CONCEPT_LABEL,
  timeline:TIMELINE,sources:SOURCES,capsules:CAPSULES,
  looks:LOOKS.map(look => ({...look,images:{front:lookImage(look.id),back:lookImage(look.id,'back'),detail:lookImage(look.id,'detail')},detailNote:'Crop of the front rendering, not a physical material sample.',availableForPurchase:false})),
  imageCredits:rights.images.map(({localPath,...credit}) => ({...credit,asset:`/images/fila/${credit.id}.webp`,adaptation:'Resized and converted to WebP. Responsive display may crop the frame.'})),
  originalArtwork:{method:'Built-in imagegen',createdAt:STUDY_DATE,label:'Original AI-generated interpretive artwork; not archival FILA photography.',assets:['/images/fila/court-material-study.webp','/images/fila/knit-sculpture-study.webp'],generationInputs:'Text prompts only; no heritage photographs used.'},
});
