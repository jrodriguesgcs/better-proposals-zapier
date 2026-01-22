import { Redis } from '@upstash/redis';

let redis = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export function getApiKeys() {
  return process.env.BP_API_KEYS.split(',').map(key => key.trim()).filter(key => key && key !== 'your_api_key_here');
}

export function getSenderEmails() {
  return process.env.BP_SENDER_EMAILS.split(',').map(email => email.trim());
}

export function getSenderNames() {
  if (!process.env.BP_SENDER_NAMES) return [];
  return process.env.BP_SENDER_NAMES.split(',').map(name => name.trim());
}

export function verifyCronSecret(req) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return false;
  }
  return true;
}

export async function fetchProposals(apiKey, endpoint, accountIndex) {
  try {
    const response = await fetch(`https://api.betterproposals.io/proposal/${endpoint}?per_page=50`, {
      headers: { 'Bptoken': apiKey }
    });
    const data = await response.json();
    if (data.status === 'success') {
      const senderEmails = getSenderEmails();
      const senderNames = getSenderNames();
      return (data.data || []).map(proposal => ({
        ...proposal,
        _accountIndex: accountIndex + 1,
        _senderEmail: senderEmails[accountIndex] || '',
        _senderName: senderNames[accountIndex] || `Account ${accountIndex + 1}`
      }));
    }
    console.error(`Account ${accountIndex + 1} error:`, data.message);
    return [];
  } catch (error) {
    console.error(`Account ${accountIndex + 1} fetch error:`, error.message);
    return [];
  }
}

export async function isProcessed(redisKey, proposalId) {
  const r = getRedis();
  const exists = await r.sismember(redisKey, proposalId);
  return exists === 1;
}

export async function markAsProcessed(redisKey, proposalId) {
  const r = getRedis();
  await r.sadd(redisKey, proposalId);
}
