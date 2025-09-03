import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const { room_name, user_name } = JSON.parse(event.body || '{}');

  const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { room_name, user_name }
    })
  });

  return {
    statusCode: res.status,
    body: await res.text()
  };
};
