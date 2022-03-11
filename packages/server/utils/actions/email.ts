
import { EmailActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { badRequest } from '@hapi/boom';
import { extension } from 'mime-types';
import { SendMailOptions } from 'nodemailer';

import { AppMember, Asset } from '../../models/index.js';
import { getRemapperContext } from '../app.js';
import { iterTable } from '../database.js';
import { renderEmail } from '../email/renderEmail.js';
import { ServerActionParameters } from './index.js';

interface ContentAttachment {
  filename?: string;
  accept?: string;
  content: string;
}

interface TargetAttachment {
  filename?: string;
  accept?: string;
  target: string;
}

function isContentAttachment(attachment: unknown): attachment is ContentAttachment {
  if (typeof attachment !== 'object') {
    return false;
  }
  if (!attachment) {
    return false;
  }
  const { content } = attachment as ContentAttachment;
  return content && typeof content === 'string';
}

function isTargetAttachment(attachment: unknown): attachment is TargetAttachment {
  if (typeof attachment !== 'object') {
    return false;
  }
  if (!attachment) {
    return false;
  }
  const { target } = attachment as TargetAttachment;
  return target && typeof target === 'string';
}

export async function email({
  action,
  app,
  data,
  mailer,
  user,
}: ServerActionParameters<EmailActionDefinition>): Promise<any> {
  const appMember =
    user && (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    appMember && {
      sub: user.id,
      name: appMember.name,
      email: appMember.email,
      email_verified: appMember.emailVerified,
      zoneinfo: user.timezone,
    },
  );

  const to = remap(action.to, data, context) as string;
  const from = (remap(action.from, data, context) as string) || app.emailName || 'Appsemble';
  const cc = remap(action.cc, data, context) as string[] | string;
  const bcc = remap(action.bcc, data, context) as string[] | string;
  const body = remap(action.body, data, context) as string;
  const sub = remap(action.subject, data, context) as string;

  if (!to && !cc?.length && !bcc?.length) {
    // Continue as normal without doing anything
    return data;
  }

  if (!sub || !body) {
    throw badRequest('Fields “subject” and “body” must be a valid string');
  }

  const attachments: SendMailOptions['attachments'] = [];
  const assetSelectors: TargetAttachment[] = [];
  for (const remapped of [remap(action.attachments, data, context)].flat()) {
    const attachment = typeof remapped === 'string' ? { target: String(remapped) } : remapped;
    if (isTargetAttachment(attachment)) {
      if (attachment.target.startsWith('http')) {
        attachments.push({
          path: attachment.target,
          ...(attachment.filename && { filename: attachment.filename }),
          ...(attachment.accept && { httpHeaders: { accept: attachment.accept } }),
        });
      } else {
        assetSelectors.push(attachment);
      }
    } else if (isContentAttachment(attachment)) {
      attachments.push({
        content: attachment.content,
        filename: attachment.filename,
      });
    }
  }
  if (assetSelectors.length) {
    for await (const asset of iterTable(Asset, {
      where: { AppId: app.id, id: assetSelectors.map((selector) => selector.target) },
    })) {
      const attachment = assetSelectors.find((selector) => selector.target === asset.id);
      const ext = extension(attachment?.accept || asset.mime);
      const filename =
        attachment?.filename || asset.filename || (ext ? `${asset.id}.${ext}` : asset.id);
      attachments.push({ content: asset.data, filename });
    }
  }

  const { emailHost, emailName, emailPassword, emailPort, emailSecure, emailUser } = app;
  const { html, subject, text } = await renderEmail(body, {}, sub);
  await mailer.sendEmail({
    ...(to && { to }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    from,
    subject,
    html,
    text,
    attachments,
    app: { emailHost, emailName, emailPassword, emailPort, emailSecure, emailUser },
  });

  return data;
}