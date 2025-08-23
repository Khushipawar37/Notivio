const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript('dQw4w9WgXcQ');
    console.log('Success!', transcript.slice(0, 3));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();