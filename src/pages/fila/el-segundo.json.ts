import type {APIRoute} from 'astro';
import {CHAPTERS, CREATED_AT, INDEPENDENT_LABEL, LOCAL_LOOKS, SOURCES, localImage} from '../../data/fila-el-segundo';
import provenance from '../../../docs/research/fila-el-segundo-artwork.json';
export const GET: APIRoute = () => Response.json({
  title:'FILA v2 / The El Segundo field collection',url:'https://pointcast.xyz/fila/el-segundo/',version:2,createdAt:CREATED_AT,season:'2027 independent concept',
  independentEditorial:true,affiliation:null,availableInventory:false,conceptLabel:INDEPENDENT_LABEL,
  previous:['https://pointcast.xyz/fila/','https://pointcast.xyz/fila/2027/'],chapters:CHAPTERS,sources:SOURCES,
  looks:LOCAL_LOOKS.map(look=>({...look,availableForPurchase:false,images:{front:localImage(look.id),back:localImage(look.id,'back'),detail:localImage(look.id,'detail'),paired:localImage(look.id,'pair')},detailNote:'Crop of this new original front rendering, not a physical fabric sample.'})),
  imageProvenance:provenance,
});
