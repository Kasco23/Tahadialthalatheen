import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ privacy: 'private' })
  });

  return {
    statusCode: res.status,
    body: await res.text()
  };
};
