'use server';

import axios from 'axios';

export async function getGifs({
  youtubeUrl,
  description
}: {
  youtubeUrl: string;
  description: string;
}): Promise<{
  gifUrls: string[];
}> {
  //   const response = await axios.post(`localhost:3001/gifs`, {
  //     youtubeUrl,
  //     description
  //   });
  //   return response.data;

  await new Promise((resolve) => setTimeout(resolve, 8000));
  return {
    gifUrls: ['/trump1.gif', '/trump2.gif', '/trump3.gif', '/trump4.gif']
  };
}
