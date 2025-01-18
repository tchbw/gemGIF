'use server';

export async function getGifs({
  youtubeUrl,
  description
}: {
  youtubeUrl: string;
  description: string;
}): Promise<{
  gifUrls: string[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return {
    gifUrls: [
      'https://i0.wp.com/images.onwardstate.com/uploads/2015/05/oie_14175751vZSQRLEn.gif?fit=650%2C408&ssl=1',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl9a6FS7eFfaUe5k_RExADV1kTi6UnymrReQ&s',
      'https://media2.giphy.com/media/gKHGnB1ml0moQdjhEJ/200.gif?cid=6c09b952azoprnq9wcnys90i0z2lqgeh0q3gt48utsxwwgd8&ep=v1_gifs_search&rid=200.gif&ct=g',
      'https://media2.giphy.com/media/Ig3nXeCHJa1H9SxhsI/200.gif?cid=6c09b952eq6nkzr9lkrh0l7l0dngz85tskxn1rq2reomw89g&ep=v1_gifs_search&rid=200.gif&ct=g'
    ]
  };
}
