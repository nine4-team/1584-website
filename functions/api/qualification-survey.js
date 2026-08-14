const ALLOWED_ANSWERS = [
  'first_name', 'last_name', 'email', 'phone', 'ownership', 'scope',
  'priority_order', 'square_footage', 'investment_answer', 'involvement'
];

const FIELD_IDS = {
  second_home: {
    ownership: 'Y4fGp7NfMPk3jYfxPNtA',
    scope: 'oXIrgIDbhSjExxwbVC66',
    priorities: 'Cbll8HDn5CGYJ5QkozK3',
    squareFootage: 'Cb75pA1NIoDxoKslJrFS',
    qualification: 'B50zLkGyLwfakzd2N1UJ'
  },
  vacation_rental: {
    ownership: 'QVEt57eHnyXdjgLlbP2J',
    scope: '1IZMb7yDZ2phX4X2SYTL',
    priorities: 'Ruo6ZLQnaLg2jNF7laTv',
    squareFootage: 'KPC8An9diT5ovdr6eLRh',
    qualification: 'A4Za8JcKEBfQG9I0cJ0b'
  },
  investment: 'TqONZqTppT5pmveUYoua',
  involvement: 'ezwuewAXr3o8Cj9TSqkW'
};

const ANSWER_LABELS = {
  ownership: {
    second_home: {
      own: 'I already own a vacation home',
      purchasing: 'I am currently purchasing or building one',
      planning: 'I plan to purchase or build one within the next 12 months',
      none: 'None of these'
    },
    vacation_rental: {
      own: 'I already own a vacation rental',
      purchasing: 'I am currently purchasing, building, or developing one',
      planning: 'I plan to purchase, build, or develop one within the next 12 months',
      none: 'None of these'
    }
  },
  scope: {
    second_home: { entire: 'The entire home', most: 'Most of the home', several: 'Several rooms', one_two: 'One or two rooms', unsure: 'I am not sure yet' },
    vacation_rental: { entire: 'The entire property', most: 'Most of the property', several: 'Several rooms', one_two: 'One or two rooms', unsure: 'I am not sure yet' }
  },
  square_footage: {
    under_2500: 'Under 2,500 sq ft',
    '2500_3000': '2,500–3,000 sq ft',
    '3001_3500': '3,001–3,500 sq ft',
    '3501_4000': '3,501–4,000 sq ft',
    '4001_4500': '4,001–4,500 sq ft',
    '4501_5000': '4,501–5,000 sq ft',
    '5001_5500': '5,001–5,500 sq ft',
    '5501_plus': '5,501+ sq ft'
  },
  involvement: {
    fully_delegated: 'I want the design team to take care of everything. I’m happy to give them full creative freedom and let them do their thing.',
    designer_led: 'I have preferences and want to align on the overall direction, then I want the design team to take care of the rest.',
    collaborative: 'I want to approve the major pieces, but I’m comfortable giving the design team discretion over smaller items, accessories, and finishing details.',
    item_approval: 'I want to stay involved at the individual-item level, giving feedback and requesting changes as I see the space come together.'
  },
  priority: { budget: 'Budget', quality: 'Quality', speed: 'Speed' }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function clean(value, length = 500) {
  return String(value || '').trim().slice(0, length);
}

function noteBody(payload) {
  const answers = payload.answers || {};
  const label = payload.surveyType === 'vacation_rental' ? 'Vacation Rental' : 'Vacation Home';
  const lines = [
    `${label} Qualification Survey`,
    `Status: ${clean(payload.status, 60)}`,
    `Last completed step: ${clean(payload.lastCompletedStep, 60)}`,
    `Session: ${clean(payload.sessionId, 80)}`,
    '',
    ...ALLOWED_ANSWERS
      .filter(key => !['first_name', 'last_name', 'email', 'phone'].includes(key) && answers[key])
      .map(key => `${key.replaceAll('_', ' ')}: ${clean(answers[key])}`)
  ];
  return lines.join('\n');
}

function qualificationValue(status) {
  if (status === 'qualified') return 'Qualified';
  if (String(status).startsWith('disqualified')) return 'Disqualified';
  return 'In Progress';
}

function customFields(payload) {
  const answers = payload.answers || {};
  const surveyType = payload.surveyType === 'vacation_rental' ? 'vacation_rental' : 'second_home';
  const ids = FIELD_IDS[surveyType];
  const values = [];
  const add = (id, value) => { if (value) values.push({ id, field_value: value }); };
  add(ids.ownership, ANSWER_LABELS.ownership[surveyType][answers.ownership]);
  add(ids.scope, ANSWER_LABELS.scope[surveyType][answers.scope]);
  add(ids.priorities, clean(answers.priority_order).split(',').filter(Boolean).map(value => ANSWER_LABELS.priority[value] || value).join(' > '));
  add(ids.squareFootage, ANSWER_LABELS.square_footage[answers.square_footage]);
  add(FIELD_IDS.investment, clean(answers.investment_answer));
  add(FIELD_IDS.involvement, ANSWER_LABELS.involvement[answers.involvement]);
  add(ids.qualification, qualificationValue(payload.status));
  return values;
}

async function ghlRequest(env, path, options = {}) {
  const baseUrl = (env.GHL_BASE_URL || 'https://services.leadconnectorhq.com').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GHL_API_KEY}`,
      Version: env.GHL_API_VERSION || '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`HighLevel request failed: ${response.status}`);
  return response.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return json({ error: 'Submission service is not configured.' }, 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const answers = payload.answers || {};
  const surveyType = payload.surveyType === 'vacation_rental' ? 'vacation_rental' : 'second_home';
  const surveyLabel = surveyType === 'vacation_rental' ? 'Vacation Rental' : 'Vacation Home';
  const email = clean(answers.email, 254);
  const phone = clean(answers.phone, 40);
  if (!email || !phone || !email.includes('@')) return json({ error: 'Valid contact information is required.' }, 400);

  try {
    let contactId = clean(payload.contactId, 80);
    if (!contactId) {
      const upsert = await ghlRequest(env, '/contacts/upsert', {
        method: 'POST',
        body: JSON.stringify({
          locationId: env.GHL_LOCATION_ID,
          firstName: clean(answers.first_name, 100),
          lastName: clean(answers.last_name, 100),
          email,
          phone,
          source: `${surveyLabel} Qualification Survey`,
          tags: [surveyType === 'vacation_rental' ? 'vacation-rental-qualification' : 'vacation-home-qualification', 'qualification-started'],
          customFields: customFields(payload)
        })
      });
      contactId = upsert.contact?.id;
    }
    if (!contactId) throw new Error('No contact returned');

    await ghlRequest(env, `/contacts/${encodeURIComponent(contactId)}`, {
      method: 'PUT',
      body: JSON.stringify({ customFields: customFields(payload) })
    });

    const body = noteBody(payload);
    let noteId = clean(payload.noteId, 80);
    if (noteId) {
      await ghlRequest(env, `/contacts/${encodeURIComponent(contactId)}/notes/${encodeURIComponent(noteId)}`, {
        method: 'PUT', body: JSON.stringify({ body })
      });
    } else {
      const note = await ghlRequest(env, `/contacts/${encodeURIComponent(contactId)}/notes`, {
        method: 'POST', body: JSON.stringify({ body })
      });
      noteId = note.note?.id;
    }

    return json({ ok: true, contactId, noteId });
  } catch (error) {
    return json({ error: 'Unable to save survey progress.' }, 502);
  }
}
