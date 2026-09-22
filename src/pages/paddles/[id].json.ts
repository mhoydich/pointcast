import { PADDLES, publicPaddle, type Paddle } from '../../lib/paddle-register';

export function getStaticPaths() {
  return PADDLES.map((paddle) => ({ params: { id: paddle.id }, props: { paddle } }));
}

export const GET = ({ props }: { props: { paddle: Paddle } }) =>
  new Response(JSON.stringify(publicPaddle(props.paddle), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
