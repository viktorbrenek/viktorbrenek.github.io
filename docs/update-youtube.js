const fs = require('fs');

async function updateFeed() {
  try {
    // 1. Tváříme se jako běžný prohlížeč, aby nás YouTube nezablokoval
    const response = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCtU9oaLRlJDKtEJlHMPjckw', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const xmlText = await response.text();
    
    // 2. Záchranná brzda: Pokud nám YouTube nevrátí XML feed, skript se zastaví
    // a nepřepíše tvůj webový soubor prázdnými závorkami []
    if (!xmlText.includes('<entry>')) {
      console.error('Chyba: YouTube nevrátil validní feed. Vrátil toto:', xmlText.substring(0, 200));
      return; 
    }
    
    // Rozsekáme XML podle tagů <entry> (videa)
    const entries = xmlText.split('<entry>').slice(1);
    const videos = entries.map(entry => {
      const title = entry.match(/<title>(.*?)<\/title>/)[1];
      const link = entry.match(/<link rel="alternate" href="(.*?)"/)[1];
      const pubDate = entry.match(/<published>(.*?)<\/published>/)[1];
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1];
      
      return {
        title,
        link,
        pubDate,
        videoId,
        // náhled se stahuje k nám (docs/assets/yt), aby web nenačítal obrázky z Googlu (GDPR)
        thumbnail: `/assets/yt/${videoId}.jpg`
      };
    }).slice(0, 5);

    // 2b. Stažení náhledů do docs/assets/yt a úklid starých
    const dir = 'docs/assets/yt';
    fs.mkdirSync(dir, { recursive: true });
    for (const v of videos) {
      const file = `${dir}/${v.videoId}.jpg`;
      if (fs.existsSync(file)) continue;
      const img = await fetch(`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`);
      if (img.ok) fs.writeFileSync(file, Buffer.from(await img.arrayBuffer()));
      else v.thumbnail = '';
    }
    const keep = new Set(videos.map(v => `${v.videoId}.jpg`));
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.jpg') && !keep.has(f)) fs.unlinkSync(`${dir}/${f}`);

    // 3. DŮLEŽITÉ: Uložení souboru přímo do tvé složky docs!
    fs.writeFileSync('docs/youtube-data.json', JSON.stringify(videos, null, 2));
    console.log('YouTube feed byl úspěšně aktualizován a uložen do složky docs!');
  } catch (error) {
    console.error('Chyba při zpracování feedu:', error);
  }
}

updateFeed();