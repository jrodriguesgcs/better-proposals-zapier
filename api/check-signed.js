import { getApiKeys, verifyCronSecret, fetchProposals, isProcessed, markAsProcessed } from '../lib/utils.js';

const REDIS_KEY = 'processed_signed';

export default async function handler(req, res) {
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_SIGNED;
  if (!ZAPIER_WEBHOOK_URL) {
    return res.status(500).json({ error: 'ZAPIER_WEBHOOK_SIGNED not configured' });
  }
  try {
    const apiKeys = getApiKeys();
    let newCount = 0;
    let totalChecked = 0;
    let errors = [];
    for (let i = 0; i < apiKeys.length; i++) {
      const proposals = await fetchProposals(apiKeys[i], 'signed', i);
      totalChecked += proposals.length;
      for (const proposal of proposals) {
        try {
          const alreadyProcessed = await isProcessed(REDIS_KEY, proposal.ID);
          if (!alreadyProcessed) {
            const emails = proposal.Contacts?.map(c => c.Email).filter(Boolean) || [];
            const primaryContact = proposal.Contacts?.[0] || {};
            const payload = {
              event_type: 'proposal_signed',
              proposal_id: proposal.ID,
              account_number: proposal._accountIndex,
              sender_email: proposal._senderEmail,
              sender_name: proposal._senderName,
              company_name: proposal.CompanyName,
              subject_line: proposal.SubjectLine,
              date_sent: proposal.OriginalDateSent,
              date_created: proposal.DateCreated,
              date_signed: proposal.DateSigned,
              signed_email: proposal.SignedEmail || '',
              signed_first_name: proposal.SignedFirstName || '',
              signed_surname: proposal.SignedSurname || '',
              signed_signature: proposal.SignedSignature || '',
              primary_email: primaryContact.Email || '',
              primary_first_name: primaryContact.FirstName || '',
              primary_surname: primaryContact.Surname || '',
              all_contact_emails: emails,
              preview_url: proposal.Preview,
              proposal_view_url: proposal.ProposalView,
              currency_code: proposal.CurrencyCode,
              currency_symbol: proposal.CurrencySymbol,
              one_off_total: proposal.OneOffTotal,
              monthly_total: proposal.MonthlyTotal,
              quarterly_total: proposal.QuarterlyTotal,
              annual_total: proposal.AnnualTotal,
              tax_percentage: proposal.TaxPercentage,
              webhook_sent_at: new Date().toISOString()
            };
            await fetch(ZAPIER_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            await markAsProcessed(REDIS_KEY, proposal.ID);
            newCount++;
          }
        } catch (err) {
          errors.push(`Proposal ${proposal.ID}: ${err.message}`);
        }
      }
    }
    res.status(200).json({
      success: true,
      event_type: 'signed',
      accounts_checked: apiKeys.length,
      total_found: totalChecked,
      new_sent: newCount,
      errors: errors.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
