const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript('GdzrrWA8e7A', { lang: 'en' });
    console.log('Transcript sample:', transcript.slice(0, 5));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
