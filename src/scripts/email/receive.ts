const Imap = require('imap');
const inspect = require('node:util').inspect;

import { config } from '@/utils/config';

const imap = new Imap({
  user: config.EMAIL_SERVER_USER,
  password: config.EMAIL_SERVER_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    // rejectUnauthorized: false,
    servername: 'imap.gmail.com',
  },
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', () => {
  openInbox((err, box) => {
    if (err) throw err;
    const f = imap.seq.fetch('1:3', {
      bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
      struct: true,
    });
    f.on('message', (msg, seqno) => {
      // console.log('Message #%d', seqno);
      const prefix = '(#' + seqno + ') ';
      msg.on('body', (stream, info) => {
        let buffer = '';
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', () => {
          // console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
        });
      });
      msg.once('attributes', (attrs) => {
        // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
      });
      msg.once('end', () => {
        // console.log(prefix + 'Finished');
      });
    });
    f.once('error', (err) => {
      // console.log('Fetch error: ' + err);
    });
    f.once('end', () => {
      // console.log('Done fetching all messages!');
      imap.end();
    });
  });
});

imap.once('error', (err) => {
  // console.log(err);
});

imap.once('end', () => {
  // console.log('Connection ended');
});

imap.connect();
