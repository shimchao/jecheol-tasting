/**
 * 제철의 미학 - 버티컬 테이스팅 백엔드 (Google Apps Script)
 *
 * 배포: 새 GAS 프로젝트 생성 → 이 파일 붙여넣기 → 배포 → 웹 앱
 *       실행 사용자: 나, 액세스 권한: 모든 사용자(익명 포함)
 *
 * Sheets 스키마: docs/SHEETS_SCHEMA.md 참고
 */

const SHEET_ID = 'PUT_YOUR_GOOGLE_SHEET_ID_HERE';
const ADMIN_KEY = '제철2026';

const SHEETS = {
  events: 'events',
  items: 'items',
  participants: 'participants',
  ratings: 'ratings',
  votes: 'votes',
};

function doGet(e) {
  return handle(e, 'GET');
}

function doPost(e) {
  return handle(e, 'POST');
}

function handle(e, method) {
  try {
    const params = e.parameter || {};
    const action = params.action;
    let payload = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (_) {}
    }
    const body = { ...params, ...payload };

    const result = route(action, body);
    return json({ ok: true, data: result });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function route(action, body) {
  switch (action) {
    case 'getEvent':       return getEvent(body.event_id);
    case 'listEvents':     return listEvents();
    case 'createEvent':    return createEvent(body);
    case 'join':           return joinEvent(body);
    case 'submitRating':   return submitRating(body);
    case 'submitVote':     return submitVote(body);
    case 'hostStatus':     return hostStatus(body);
    case 'reveal':         return reveal(body);
    case 'results':        return results(body.event_id);
    default: throw new Error('Unknown action: ' + action);
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(name);
}

function rowsAsObjects(sh) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(name, obj) {
  const sh = sheet(name);
  const headers = sh.getDataRange().getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sh.appendRow(row);
}

function uuid() {
  return Utilities.getUuid().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

// ---- Actions ----

function getEvent(event_id) {
  if (!event_id) throw new Error('event_id required');
  const events = rowsAsObjects(sheet(SHEETS.events));
  const event = events.find(e => e.event_id === event_id);
  if (!event) throw new Error('Event not found');
  const items = rowsAsObjects(sheet(SHEETS.items))
    .filter(i => i.event_id === event_id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return {
    event: {
      event_id: event.event_id,
      month: event.month,
      theme: event.theme,
      host_name: event.host_name,
      vote_count: Number(event.vote_count) || 1,
      status: event.status,
      revealed: String(event.revealed) === 'true' || event.revealed === true,
    },
    items: items.map(i => ({
      item_id: i.item_id,
      name: i.name,
      image_url: i.image_url,
      description: i.description,
      display_order: i.display_order,
    })),
  };
}

function listEvents() {
  return rowsAsObjects(sheet(SHEETS.events))
    .map(e => ({
      event_id: e.event_id,
      month: e.month,
      theme: e.theme,
      status: e.status,
    }))
    .sort((a, b) => String(b.month).localeCompare(String(a.month)));
}

function createEvent(body) {
  if (body.admin_key !== ADMIN_KEY) throw new Error('Invalid admin key');
  const { event_id, month, theme, host_name, vote_count, items } = body;
  if (!event_id || !theme || !host_name) throw new Error('Missing fields');

  appendRow(SHEETS.events, {
    event_id,
    month,
    theme,
    host_name,
    host_password: ADMIN_KEY,
    vote_count: vote_count || 1,
    status: 'active',
    revealed: false,
    created_at: now(),
  });

  (items || []).forEach((item, i) => {
    appendRow(SHEETS.items, {
      item_id: event_id + '-' + (i + 1),
      event_id,
      name: item.name,
      image_url: item.image_url || '',
      description: item.description || '',
      display_order: i + 1,
    });
  });

  return { event_id };
}

function joinEvent(body) {
  const { event_id, nickname } = body;
  if (!event_id || !nickname) throw new Error('event_id and nickname required');
  const participant_id = 'p_' + uuid();
  appendRow(SHEETS.participants, {
    participant_id,
    event_id,
    nickname,
    joined_at: now(),
  });
  return { participant_id, nickname };
}

function submitRating(body) {
  const { event_id, participant_id, item_id, stars, comment } = body;
  if (!event_id || !participant_id || !item_id) throw new Error('Missing fields');
  const sh = sheet(SHEETS.ratings);
  const all = rowsAsObjects(sh);
  const existingIdx = all.findIndex(r =>
    r.event_id === event_id &&
    r.participant_id === participant_id &&
    r.item_id === item_id
  );
  if (existingIdx >= 0) {
    const rowNum = existingIdx + 2;
    const headers = sh.getDataRange().getValues()[0];
    const starsCol = headers.indexOf('stars') + 1;
    const commentCol = headers.indexOf('comment') + 1;
    const updatedCol = headers.indexOf('updated_at') + 1;
    sh.getRange(rowNum, starsCol).setValue(stars);
    sh.getRange(rowNum, commentCol).setValue(comment || '');
    sh.getRange(rowNum, updatedCol).setValue(now());
  } else {
    appendRow(SHEETS.ratings, {
      rating_id: 'r_' + uuid(),
      event_id,
      participant_id,
      item_id,
      stars,
      comment: comment || '',
      created_at: now(),
      updated_at: now(),
    });
  }
  return { ok: true };
}

function submitVote(body) {
  const { event_id, participant_id, item_ids } = body;
  if (!event_id || !participant_id || !Array.isArray(item_ids)) {
    throw new Error('Missing fields');
  }
  const events = rowsAsObjects(sheet(SHEETS.events));
  const event = events.find(e => e.event_id === event_id);
  const maxVotes = Number(event.vote_count) || 1;
  if (item_ids.length > maxVotes) {
    throw new Error('Too many votes (max ' + maxVotes + ')');
  }
  const sh = sheet(SHEETS.votes);
  const all = sh.getDataRange().getValues();
  const headers = all[0];
  const eventCol = headers.indexOf('event_id');
  const pCol = headers.indexOf('participant_id');
  for (let i = all.length - 1; i >= 1; i--) {
    if (all[i][eventCol] === event_id && all[i][pCol] === participant_id) {
      sh.deleteRow(i + 1);
    }
  }
  item_ids.forEach(item_id => {
    appendRow(SHEETS.votes, {
      vote_id: 'v_' + uuid(),
      event_id,
      participant_id,
      item_id,
      created_at: now(),
    });
  });
  return { ok: true };
}

function hostStatus(body) {
  const { event_id, admin_key } = body;
  if (admin_key !== ADMIN_KEY) throw new Error('Invalid admin key');
  const participants = rowsAsObjects(sheet(SHEETS.participants))
    .filter(p => p.event_id === event_id);
  const items = rowsAsObjects(sheet(SHEETS.items))
    .filter(i => i.event_id === event_id);
  const ratings = rowsAsObjects(sheet(SHEETS.ratings))
    .filter(r => r.event_id === event_id);
  const votes = rowsAsObjects(sheet(SHEETS.votes))
    .filter(v => v.event_id === event_id);

  const totalItems = items.length;
  const completion = participants.map(p => {
    const myRatings = ratings.filter(r => r.participant_id === p.participant_id).length;
    const myVotes = votes.filter(v => v.participant_id === p.participant_id).length;
    return {
      nickname: p.nickname,
      ratings_done: myRatings,
      ratings_total: totalItems,
      voted: myVotes > 0,
    };
  });

  const events = rowsAsObjects(sheet(SHEETS.events));
  const event = events.find(e => e.event_id === event_id);

  return {
    participant_count: participants.length,
    item_count: totalItems,
    completion,
    revealed: String(event.revealed) === 'true' || event.revealed === true,
  };
}

function reveal(body) {
  const { event_id, admin_key } = body;
  if (admin_key !== ADMIN_KEY) throw new Error('Invalid admin key');
  const sh = sheet(SHEETS.events);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('event_id');
  const revealedCol = headers.indexOf('revealed') + 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === event_id) {
      sh.getRange(i + 1, revealedCol).setValue(true);
      return { revealed: true };
    }
  }
  throw new Error('Event not found');
}

function results(event_id) {
  const events = rowsAsObjects(sheet(SHEETS.events));
  const event = events.find(e => e.event_id === event_id);
  if (!event) throw new Error('Event not found');
  const revealed = String(event.revealed) === 'true' || event.revealed === true;
  if (!revealed) return { revealed: false };

  const items = rowsAsObjects(sheet(SHEETS.items))
    .filter(i => i.event_id === event_id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const ratings = rowsAsObjects(sheet(SHEETS.ratings))
    .filter(r => r.event_id === event_id);
  const votes = rowsAsObjects(sheet(SHEETS.votes))
    .filter(v => v.event_id === event_id);
  const participants = rowsAsObjects(sheet(SHEETS.participants))
    .filter(p => p.event_id === event_id);
  const nickMap = {};
  participants.forEach(p => { nickMap[p.participant_id] = p.nickname; });

  const itemResults = items.map(item => {
    const itemRatings = ratings.filter(r => r.item_id === item.item_id);
    const stars = itemRatings.map(r => Number(r.stars)).filter(n => n > 0);
    const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
    const voteCount = votes.filter(v => v.item_id === item.item_id).length;
    const comments = itemRatings
      .filter(r => r.comment && String(r.comment).trim())
      .map(r => ({ nickname: nickMap[r.participant_id] || '?', comment: r.comment, stars: Number(r.stars) }));
    return {
      item_id: item.item_id,
      name: item.name,
      image_url: item.image_url,
      description: item.description,
      avg_stars: Math.round(avg * 10) / 10,
      rating_count: stars.length,
      vote_count: voteCount,
      comments,
    };
  });

  const winnerByVote = [...itemResults].sort((a, b) => b.vote_count - a.vote_count)[0];
  const winnerByStars = [...itemResults].sort((a, b) => b.avg_stars - a.avg_stars)[0];

  return {
    revealed: true,
    items: itemResults,
    winner_by_vote: winnerByVote,
    winner_by_stars: winnerByStars,
  };
}
