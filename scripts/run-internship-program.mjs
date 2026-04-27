#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const rolesPath = path.join(root, 'public/internships/roles.json');
const programPath = path.join(root, 'public/internships/program.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {
    role: 'agent-wrangler',
    region: 'Internet-native',
    week: '1',
    pathway: '',
    format: 'markdown',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function slug(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findRole(roles, roleArg) {
  const normalized = slug(roleArg);
  return roles.find((role) => role.id === normalized || slug(role.title) === normalized) ?? roles[0];
}

function findRegion(regions, regionArg) {
  const normalized = slug(regionArg);
  return regions.find((region) => slug(region.region) === normalized) ?? regions.find((region) => region.region === 'Internet-native') ?? regions[0];
}

function choosePathways(program, role, pathwayArg) {
  if (pathwayArg) {
    const wanted = new Set(String(pathwayArg).split(',').map(slug));
    return program.learning_pathways.filter((pathway) => wanted.has(pathway.id) || wanted.has(slug(pathway.title)));
  }

  if (Array.isArray(role.pathway_ids) && role.pathway_ids.length) {
    const wanted = new Set(role.pathway_ids.map(slug));
    const selected = program.learning_pathways.filter((pathway) => wanted.has(pathway.id));
    if (selected.length) return selected;
  }

  const interests = new Set(role.interests.map(slug));
  const matches = program.learning_pathways.filter((pathway) => {
    const haystack = slug(`${pathway.id} ${pathway.title} ${pathway.outcome}`);
    return Array.from(interests).some((interest) => haystack.includes(interest));
  });

  return matches.length ? matches.slice(0, 2) : program.learning_pathways.slice(0, 2);
}

function includesNouns(role, pathways) {
  return role.interests.some((interest) => slug(interest).includes('nouns'))
    || pathways.some((pathway) => pathway.id === 'nouns-interest');
}

function markdownPlan({ program, role, region, pathways, week }) {
  const lines = [];
  lines.push(`# PointCast Internship Week ${week}: ${role.title}`);
  lines.push('');
  lines.push(`**Program lead:** ${program.program_lead.name} - ${program.program_lead.role}`);
  lines.push(`**Region / mission:** ${region.region} - ${region.focus}`);
  lines.push(`**Track:** ${role.track}`);
  lines.push('');
  lines.push('## Mission');
  lines.push(role.mission);
  lines.push('');
  lines.push('## Program Standards');
  for (const expectation of program.conduct_expectations) lines.push(`- ${expectation}`);
  lines.push('');
  if (program.participation_memory) {
    lines.push('## Participation Memory');
    lines.push(program.participation_memory.purpose);
    for (const prompt of program.participation_memory.weekly_prompts.slice(0, 3)) {
      lines.push(`- ${prompt}`);
    }
    lines.push('');
  }
  if (program.nouns_interest_path && includesNouns(role, pathways)) {
    lines.push('## Nouns Interest Path');
    lines.push(program.nouns_interest_path.purpose);
    for (const option of program.nouns_interest_path.configurator_options) {
      lines.push(`- ${option.title}: ${option.track}; receipt: ${option.receipt}`);
    }
    lines.push(`- Message path: ${program.nouns_interest_path.message_url}`);
    lines.push('');
  }
  lines.push('## Role Tasks');
  for (const task of role.tasks) lines.push(`- ${task}`);
  lines.push('');
  lines.push('## Learning Pathways');
  for (const pathway of pathways) {
    lines.push(`### ${pathway.title}`);
    lines.push(pathway.outcome);
    for (const task of pathway.starter_tasks) lines.push(`- ${task}`);
    lines.push(`- Capstone direction: ${pathway.capstone}`);
    lines.push('');
  }
  lines.push('## Weekly Operating Script');
  for (const day of program.weekly_operating_script) {
    lines.push(`### ${day.day}: ${day.name}`);
    for (const action of day.actions) lines.push(`- ${action}`);
  }
  lines.push('');
  lines.push('## Tezos Collectible');
  lines.push(`Suggested badge: ${program.tezos_collectible_system.candidate_badges[Number(week) % program.tezos_collectible_system.candidate_badges.length].name}`);
  lines.push(program.tezos_collectible_system.purpose);
  for (const warning of program.tezos_collectible_system.safety_language) lines.push(`- ${warning}`);
  lines.push('');
  lines.push('## Growth Practice');
  lines.push(`- Opening meditation: ${program.growth_practices.opening_meditation}`);
  lines.push(`- Gratitude: ${program.growth_practices.gratitude_prompt}`);
  lines.push(`- Contentment: ${program.growth_practices.contentment_prompt}`);
  lines.push(`- Quality of life: ${program.growth_practices.quality_of_life_prompt}`);
  lines.push('');
  lines.push('## Receipts To Leave');
  for (const receipt of program.receipts) lines.push(`- ${receipt}`);
  lines.push('');
  lines.push('## Friday Close');
  lines.push('Publish a field note, demo, reward claim, or collectible spec. End by naming what was enough this week.');
  return lines.join('\n');
}

function jsonPlan({ program, role, region, pathways, week }) {
  return JSON.stringify({
    week,
    program: program.title,
    lead: program.program_lead,
    role,
    region,
    pathways,
    conduct_expectations: program.conduct_expectations,
    nouns_interest_path: program.nouns_interest_path ?? null,
    participation_memory: program.participation_memory ?? null,
    weekly_operating_script: program.weekly_operating_script,
    tezos_collectible_system: program.tezos_collectible_system,
    growth_practices: program.growth_practices,
    receipts: program.receipts,
  }, null, 2);
}

const args = parseArgs(process.argv.slice(2));
const roles = readJson(rolesPath);
const program = readJson(programPath);
const role = findRole(roles.roles, args.role);
const region = findRegion(roles.regional_missions, args.region);
const pathways = choosePathways(program, role, args.pathway);

const plan = args.format === 'json'
  ? jsonPlan({ program, role, region, pathways, week: args.week })
  : markdownPlan({ program, role, region, pathways, week: args.week });

console.log(plan);
