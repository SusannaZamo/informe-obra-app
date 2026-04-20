import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      to,
      cc,
      replyTo,
      obra,
      dataHora,
      pdfBase64,
      pdfFilename
    } = req.body || {};

    const toEmail = String(to || '').trim();
    const ccEmail = String(cc || '').trim();
    const replyToEmail = String(replyTo || '').trim();
    const obraText = String(obra || '').trim();
    const dataHoraText = String(dataHora || '').trim();
    const pdfContent = String(pdfBase64 || '').trim();
    const filename = String(pdfFilename || 'informe-obra.pdf').trim();

    if (!toEmail || !isValidEmail(toEmail)) {
      return res.status(400).json({ error: 'El correu de destinació no és vàlid.' });
    }

    if (ccEmail && !isValidEmail(ccEmail)) {
      return res.status(400).json({ error: 'El correu de còpia no és vàlid.' });
    }

    if (replyToEmail && !isValidEmail(replyToEmail)) {
      return res.status(400).json({ error: 'El correu de resposta no és vàlid.' });
    }

    if (!pdfContent) {
      return res.status(400).json({ error: 'No s’ha generat el PDF.' });
    }

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #222;">
        <h2 style="margin-bottom: 12px;">Informe d'obra</h2>
        <p><strong>Obra:</strong> ${obraText || '-'}</p>
        <p><strong>Data i hora:</strong> ${dataHoraText || '-'}</p>
        <p>S'adjunta el PDF corresponent a l'informe d'obra.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Informes Obra <onboarding@resend.dev>',
      to: [toEmail],
      cc: ccEmail ? [ccEmail] : undefined,
      replyTo: replyToEmail || undefined,
      subject: `Informe d'obra - ${obraText || 'Sense títol'}`,
      html,
      attachments: [
        {
          filename,
          content: pdfContent
        }
      ]
    });

    if (error) {
      return res.status(500).json({ error: error.message || 'Error enviant el correu.' });
    }

    return res.status(200).json({ ok: true, id: data?.id || null });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Error intern del servidor.'
    });
  }
}
