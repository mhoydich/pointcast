import { loadToday } from './today.mjs';

const status = document.getElementById('status');

function itemElement(item) {
  const li = document.createElement('li');
  li.className = 'entry';
  const link = document.createElement('a');
  link.href = item.href;

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = item.title;
  link.append(title);

  if (item.detail) {
    const detail = document.createElement('span');
    detail.className = 'detail';
    detail.textContent = item.detail;
    link.append(detail);
  }
  const credit = document.createElement('span');
  credit.className = 'credit';
  credit.textContent = item.time + ' ET · ' + item.source + ' · ' + item.sender;
  link.append(credit);
  li.append(link);
  return li;
}

async function showToday() {
  status.textContent = 'Reading today’s posts…';
  const day = await loadToday();
  const date = document.getElementById('date');
  date.textContent = day.date + ' · ET';
  date.hidden = false;
  document.getElementById('changes').replaceChildren(...day.items.map(itemElement));
  document.getElementById('more').hidden = !day.more;

  if (day.unavailable.length === 2) {
    status.textContent = 'Today’s sources couldn’t load. Try again later.';
  } else if (day.unavailable.length || day.trimmed.length) {
    status.textContent = day.items.length ? 'Some source posts are unavailable.' : 'No posts found in the available history.';
  } else {
    status.textContent = day.items.length ? '' : 'No updates or release announcements found for today.';
  }
}

showToday();
