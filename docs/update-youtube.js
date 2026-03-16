const fs = require('fs');

async function updateFeed() {
  try {
    const response = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCtU9oaLRlJDKtEJlHMPjckw');
    const xmlText = await response.text();
    
    // Rozsekáme XML podle tagů <entry> (videa)
    const entries = xmlText.split('<entry>').slice(1);
    const videos = entries.map(entry => {
      // Pomocí regulárních výrazů vytáhneme data
      const title = entry.match(/<title>(.*?)<\/title>/)[1];
      const link = entry.match(/<link rel="alternate" href="(.*?)"/)[1];
      const pubDate = entry.match(/<published>(.*?)<\/published>/)[1];
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1];
      
      return {
        title,
        link,
        pubDate,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      };
    }).slice(0, 5); // Vezmeme jen 5 nejnovějších

    // Uložíme to do lokálního souboru
    fs.writeFileSync('youtube-data.json', JSON.stringify(videos, null, 2));
    console.log('YouTube feed byl úspěšně aktualizován!');
  } catch (error) {
    console.error('Chyba při stahování feedu:', error);
  }
}

updateFeed();