// Test script for the fixed Groq API integration
const testTranscript = `This is a test transcript about machine learning and artificial intelligence. 
Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models 
that enable computers to perform tasks without explicit instructions. It's used in various applications 
like recommendation systems, image recognition, and natural language processing. The key concepts include 
supervised learning, unsupervised learning, and reinforcement learning. Supervised learning involves 
training on labeled data, while unsupervised learning finds patterns in unlabeled data. 
Reinforcement learning uses rewards and penalties to guide learning. These techniques are fundamental 
to modern AI systems and have revolutionized many industries.`

async function testFixedAPI() {
  try {
    console.log('Testing fixed Groq API integration...')
    
    const response = await fetch('http://localhost:3000/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: testTranscript,
        title: 'Introduction to Machine Learning',
        duration: '15 minutes'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ API call successful!')
    console.log('Generated notes structure:')
    console.log('- Title:', result.title)
    console.log('- Content Type:', result.contentType)
    console.log('- Difficulty:', result.difficulty)
    console.log('- Sections count:', result.sections?.length || 0)
    console.log('- Quiz questions:', result.quiz?.questions?.length || 0)
    console.log('- Mnemonics:', result.mnemonics?.length || 0)
    console.log('- Concepts:', result.concepts?.length || 0)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.message.includes('fetch')) {
      console.log('Make sure your Next.js dev server is running on port 3000')
    }
  }
}

// Run the test
testFixedAPI()
