import { SitRoom, type SitRoomEnv } from '../../../src/durable_objects/SitRoom';

interface Env extends SitRoomEnv {
  SIT_ROOM: DurableObjectNamespace;
}

export { SitRoom };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.SIT_ROOM.idFromName('global');
    const stub = env.SIT_ROOM.get(id);
    return stub.fetch(request);
  },
};
