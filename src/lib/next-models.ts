export type ModelLane = 'frontier' | 'open-weights' | 'moving-image';
export type ReleaseState = 'upcoming' | 'controlled' | 'available' | 'open-weights';

export interface ModelSource {
  label: string;
  url: string;
  published?: string;
}

export interface NextModel {
  id: string;
  name: string;
  maker: string;
  lane: ModelLane;
  releaseState: ReleaseState;
  released: string;
  access: string;
  license: string;
  context?: string;
  modalities: string[];
  signal: string;
  humanRead: string;
  agentRead: string;
  watchFor: string;
  facts: string[];
  sources: ModelSource[];
}

export const RESEARCH_AS_OF = '2026-08-31';

export const LANE_META: Record<ModelLane, { label: string; short: string; thesis: string }> = {
  frontier: {
    label: 'Controlled frontier',
    short: 'Frontier',
    thesis: 'The release boundary is becoming part of the model: capability, access and safeguards now ship together.',
  },
  'open-weights': {
    label: 'Open-weight wave',
    short: 'Open weights',
    thesis: 'The center of gravity is multipolar. The practical question is no longer whether open weights matter, but which license and serving footprint fit the job.',
  },
  'moving-image': {
    label: 'Moving-image systems',
    short: 'Video',
    thesis: 'Video models are turning into multimodal editing systems: references, audio, continuity and revision matter more than a single spectacular clip.',
  },
};
export const NEXT_MODELS: NextModel[] = [
  {
    id: 'openai-astra',
    name: 'Astra',
    maker: 'OpenAI',
    lane: 'frontier',
    releaseState: 'upcoming',
    released: 'Not released',
    access: 'Unavailable; external safety testing planned',
    license: 'Proprietary',
    modalities: ['language', 'code', 'tools'],
    signal: 'A model whose deployment clock is being set by cyber-capability evaluations, not only product readiness.',
    humanRead: 'The headline is not a benchmark. OpenAI says preliminary evidence may place Astra at its Critical cybersecurity threshold and has slowed work while it strengthens safeguards.',
    agentRead: 'No public model ID, API surface, price, context window or stable capability spec. Do not treat GPT-6 naming, parameter counts or launch dates as confirmed.',
    watchFor: 'A system card, public model identifier, access policy and the mitigations attached to any release.',
    facts: ['Officially described as an upcoming model', 'Critical cyber capability cannot yet be ruled out', 'Not the model involved in the Hugging Face incident'],
    sources: [
      { label: 'OpenAI · cyber frontier response', url: 'https://openai.com/index/responding-next-frontier-critical-cyber-capabilities/', published: '2026-08-07' },
      { label: 'OpenAI · pacing model development', url: 'https://openai.com/index/pacing-model-development-cyber-capabilities/', published: '2026-08-18' },
    ],
  },
  {
    id: 'anthropic-mythos-5',
    name: 'Claude Mythos 5',
    maker: 'Anthropic',
    lane: 'frontier',
    releaseState: 'controlled',
    released: '2026-06-09',
    access: 'Vetted partners; broader access not promised',
    license: 'Proprietary',
    modalities: ['language', 'code', 'cyber', 'biology'],
    signal: 'One underlying model, two deployment envelopes: Mythos 5 for vetted partners and Fable 5 with stronger safeguards for general use.',
    humanRead: 'Mythos is the clearest example of capability-gated distribution becoming a product tier. The same underlying model can reach different audiences with different safeguards.',
    agentRead: 'Treat Mythos 5 and Fable 5 as access variants, not interchangeable API aliases. Mythos availability is narrow and organization-vetted.',
    watchFor: 'Whether restricted capabilities graduate into broad access—or remain a permanent high-trust tier.',
    facts: ['Same underlying model as Claude Fable 5', 'Focused on cybersecurity and biology research', 'Distributed through Project Glasswing partners'],
    sources: [
      { label: 'Anthropic · Claude Mythos 5', url: 'https://www.anthropic.com/claude/mythos', published: '2026-06-09' },
      { label: 'Anthropic · Fable 5 and Mythos 5', url: 'https://www.anthropic.com/news/claude-fable-5-mythos-5', published: '2026-06-02' },
      { label: 'Anthropic · system cards', url: 'https://www.anthropic.com/system-cards' },
    ],
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3',
    maker: 'Moonshot AI',
    lane: 'open-weights',
    releaseState: 'open-weights',
    released: '2026-07-27 weights',
    access: 'Weights + API + consumer apps',
    license: 'Kimi K3 custom license',
    context: '1M tokens',
    modalities: ['text', 'image', 'video understanding', 'tools'],
    signal: 'The first open 3T-class model: 2.8T total parameters, native vision and extremely sparse expert activation.',
    humanRead: 'K3 makes “frontier open weights” literal at enormous scale. The catch is equally important: open-weight does not mean lightweight, and its custom license deserves a real read.',
    agentRead: '2.8T MoE; 16 of 896 routed experts per token; 1M context. Budget for multi-node inference and verify Kimi K3 License obligations before deployment.',
    watchFor: 'Independent serving reports, quantization quality and how often teams use the weights rather than a hosted API.',
    facts: ['2.8T total parameters', 'Native visual understanding', 'Weights and technical report released together'],
    sources: [
      { label: 'Kimi · K3 technical blog', url: 'https://www.kimi.com/en/blog/kimi-k3', published: '2026-07-17' },
      { label: 'Moonshot AI · Kimi K3 repository', url: 'https://github.com/MoonshotAI/Kimi-K3', published: '2026-07-27' },
    ],
  },
  {
    id: 'glm-5-2',
    name: 'GLM-5.2',
    maker: 'Z.ai',
    lane: 'open-weights',
    releaseState: 'open-weights',
    released: '2026-06-17',
    access: 'Weights + API',
    license: 'MIT',
    context: '1M tokens',
    modalities: ['text', 'code', 'tools'],
    signal: 'A permissively licensed long-horizon agent model with a full million-token context.',
    humanRead: 'GLM-5.2 is the cleanest “use it and modify it” proposition in this group: a strong coding and agent model, MIT-licensed, with hosted and self-served paths.',
    agentRead: '753B-parameter MoE on the published model card; selectable thinking effort; official local serving support includes Transformers, vLLM and SGLang.',
    watchFor: 'Reliability across truly long tasks, not just maximum context acceptance.',
    facts: ['MIT-licensed weights', '1M-token context', 'Built for long-horizon coding and tool use'],
    sources: [
      { label: 'Z.ai · GLM-5.2 release', url: 'https://z.ai/blog/glm-5.2', published: '2026-06-17' },
      { label: 'Z.ai · GLM-5.2 model card', url: 'https://huggingface.co/zai-org/GLM-5.2' },
    ],
  },
  {
    id: 'qwen-3-8-27b',
    name: 'Qwen3.8-27B',
    maker: 'Alibaba · Qwen',
    lane: 'open-weights',
    releaseState: 'open-weights',
    released: '2026-08-14',
    access: 'Weights + API + local runtimes',
    license: 'Apache 2.0',
    context: '262K tokens',
    modalities: ['text', 'image', 'code', 'tools'],
    signal: 'A current-generation, dense multimodal agent model at a size teams can plausibly own.',
    humanRead: 'The 27B release may be more consequential than the 2.4T flagship: it packages the Qwen3.8 generation into a far more deployable footprint under Apache 2.0.',
    agentRead: 'Dense 27B; 262,144-token serving examples; OpenAI-compatible local routes documented for Transformers, vLLM and SGLang.',
    watchFor: 'High-quality MLX/GGUF quantizations and real memory/latency reports on workstation-class hardware.',
    facts: ['Dense 27B model', 'Apache 2.0', 'Native image-text input'],
    sources: [
      { label: 'Qwen · Qwen3.8 repository', url: 'https://github.com/QwenLM/Qwen3.8', published: '2026-08-14' },
      { label: 'Qwen · 27B model card', url: 'https://huggingface.co/Qwen/Qwen3.8-27B', published: '2026-08-14' },
    ],
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    maker: 'DeepSeek',
    lane: 'open-weights',
    releaseState: 'open-weights',
    released: '2026-07-31 update',
    access: 'Weights + API',
    license: 'MIT',
    context: '1M tokens',
    modalities: ['text', 'code', 'tools'],
    signal: 'A 284B/13B-active model built to make million-token work cheaper—and improved through post-training rather than another architecture change.',
    humanRead: 'Flash is the efficiency story: a large model that activates a small fraction of its weights and ships with a permissive license. The July update concentrated on agent behavior.',
    agentRead: '284B total / 13B active in the base release; 1M context; MIT. The 0731 update keeps the architecture and changes post-training.',
    watchFor: 'Whether the agent gains survive across harnesses and production tool environments.',
    facts: ['284B total / 13B active', 'MIT-licensed weights', 'July update was post-training only'],
    sources: [
      { label: 'DeepSeek · V4 release', url: 'https://deepseek.com/en/news/v4-preview/', published: '2026-04-24' },
      { label: 'DeepSeek · V4 Flash 0731', url: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731', published: '2026-07-31' },
      { label: 'DeepSeek · API changelog', url: 'https://api-docs.deepseek.com/updates/' },
    ],
  },
  {
    id: 'seedance-2-5',
    name: 'Seedance 2.5',
    maker: 'ByteDance · Dreamina',
    lane: 'moving-image',
    releaseState: 'available',
    released: '2026-07-31',
    access: 'Dreamina; BytePlus rollout',
    license: 'Hosted product',
    modalities: ['text', 'image', 'video', 'audio'],
    signal: 'Thirty-second continuous generation, up to fifty references and targeted editing in one system.',
    humanRead: 'Seedance is pushing the medium away from one-shot clips and toward an edit loop. Longer continuity and many references matter because they reduce the stitching and reroll tax.',
    agentRead: 'Hosted multimodal workflow. Availability, feature caps and API access can vary by product and region; resolve current account/API terms before automating.',
    watchFor: 'How much of the advertised 30-second / 50-reference envelope is consistently available outside first-party creative tools.',
    facts: ['Up to 30-second continuous clips', 'Up to 50 multimodal references', 'Targeted video editing'],
    sources: [
      { label: 'Dreamina · Seedance 2.5 launch', url: 'https://dreamina.capcut.com/resource/seedance-2-5-launch', published: '2026-07-31' },
      { label: 'BytePlus · model catalog', url: 'https://ai.byteplus.com/en/model', published: '2026-08-07' },
      { label: 'ByteDance Seed · Seedance 2.0 report', url: 'https://seed.bytedance.com/en/seedance2_0', published: '2026-02-12' },
    ],
  },
  {
    id: 'kling-3',
    name: 'Kling AI 3.0',
    maker: 'Kuaishou',
    lane: 'moving-image',
    releaseState: 'available',
    released: '2026-02-05',
    access: 'Kling AI product and partner surfaces',
    license: 'Hosted product',
    modalities: ['text', 'image', 'video', 'audio'],
    signal: 'A unified generation-and-editing system with native multilingual audio and multi-shot control.',
    humanRead: 'Kling 3.0 competes on direction, not only rendering: references, shots, sound and edits live in the same workflow, with clips up to fifteen seconds.',
    agentRead: 'Hosted product; 3.0 family includes Video, Video Omni, Image and Image Omni. Confirm the exact variant behind any third-party endpoint.',
    watchFor: 'Native 4K availability, identity consistency and whether Omni features become predictable API primitives.',
    facts: ['Up to 15-second clips', 'Native multilingual audio', 'Text/image/audio/video workflow'],
    sources: [
      { label: 'Kuaishou · Kling AI 3.0 launch', url: 'https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be', published: '2026-02-05' },
      { label: 'Kuaishou · Q2 2026 update', url: 'https://kuaishou.gcs-web.com/news-releases/news-release-details/kuaishou-technology-announces-second-quarter-and-interim-2026', published: '2026-08-19' },
    ],
  },
  {
    id: 'veo-3-1',
    name: 'Veo 3.1',
    maker: 'Google DeepMind',
    lane: 'moving-image',
    releaseState: 'available',
    released: 'Updated 2026-01-13',
    access: 'Gemini, Flow and Google Cloud',
    license: 'Hosted product',
    modalities: ['text', 'image', 'video', 'audio'],
    signal: 'A mature production path where audio, reference “ingredients,” vertical output and 4K upscaling are first-class controls.',
    humanRead: 'Veo’s advantage is the surrounding filmmaking surface: consistent ingredients, sound and delivery formats are turning generation into a repeatable production tool.',
    agentRead: 'Hosted APIs and product surfaces differ. Current published material describes six-second generations with 1080p/4K output paths and native audio.',
    watchFor: 'Longer native duration, stable character continuity and which Flow controls reach the API.',
    facts: ['Native audio', 'Reference ingredient controls', '1080p and 4K output paths'],
    sources: [
      { label: 'Google DeepMind · Veo', url: 'https://deepmind.google/models/veo/' },
      { label: 'Google · Veo 3.1 Ingredients to Video', url: 'https://blog.google/innovation-and-ai/technology/ai/veo-3-1-ingredients-to-video/', published: '2026-01-13' },
    ],
  },
];

export const NEXT_MODELS_SUMMARY = {
  title: 'Next Models',
  description: 'A sourced PointCast field guide to the model horizon: controlled frontier systems, Chinese open weights, and the new moving-image stack.',
  thesis: [
    'Access policy is now a model feature.',
    'Open weights are a deployment spectrum, not a synonym for open source.',
    'Video is becoming an editing system, not just a prompt-to-clip trick.',
  ],
};
