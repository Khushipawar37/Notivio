// Test script for enhanced notes generation
// Run with: node test-enhanced-notes.js

const testTranscript = `
Welcome to this comprehensive tutorial on machine learning fundamentals. In this video, we'll cover the essential concepts that every data scientist should know.

Let's start with the basics. Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.

Supervised learning involves training a model on labeled data. For example, if you're building a spam classifier, you'd train it on emails that are already marked as spam or not spam. The model learns patterns from this labeled data and can then classify new, unseen emails.

Unsupervised learning, on the other hand, works with unlabeled data. The goal is to find hidden patterns or structures in the data. Clustering algorithms like K-means are a common example of unsupervised learning.

Reinforcement learning is different from both. It's about training an agent to make decisions by taking actions in an environment and receiving rewards or penalties. Think of it like teaching a dog new tricks - you reward good behavior and discourage bad behavior.

Now let's dive deeper into supervised learning. The most common algorithms include linear regression, logistic regression, decision trees, random forests, and support vector machines. Each has its strengths and weaknesses.

Linear regression is great for predicting continuous values, like house prices or stock prices. It assumes a linear relationship between the input features and the target variable. The model tries to find the best line that fits the data points.

Logistic regression, despite its name, is used for classification problems, not regression. It's excellent for binary classification tasks like predicting whether a customer will buy a product or not.

Decision trees are intuitive and easy to understand. They work by asking a series of yes/no questions to classify data. However, they can easily overfit to the training data, which is why ensemble methods like random forests are often preferred.

Random forests combine multiple decision trees and use voting to make predictions. This approach reduces overfitting and generally provides better performance than single decision trees.

Support vector machines are powerful for both classification and regression. They work by finding the best hyperplane that separates different classes in the data. SVMs are particularly effective in high-dimensional spaces.

Now let's talk about the machine learning workflow. The typical process involves several steps: data collection, data preprocessing, feature engineering, model selection, training, evaluation, and deployment.

Data collection is the first and often most challenging step. You need to gather relevant data that represents the problem you're trying to solve. The quality and quantity of your data directly impact your model's performance.

Data preprocessing involves cleaning and preparing your data. This includes handling missing values, removing outliers, and normalizing or standardizing features. Remember the saying: "Garbage in, garbage out" - your model is only as good as your data.

Feature engineering is where you create new features or transform existing ones to improve model performance. This might involve creating interaction terms, polynomial features, or domain-specific features.

Model selection involves choosing the right algorithm for your problem. Consider factors like the type of problem (classification vs. regression), the size of your dataset, and the interpretability requirements.

Training is the process of teaching your model on the training data. You'll need to split your data into training and validation sets to avoid overfitting.

Evaluation involves assessing your model's performance using metrics like accuracy, precision, recall, and F1-score for classification, or mean squared error and R-squared for regression.

Finally, deployment involves putting your model into production where it can make predictions on new data.

Let me share some practical tips for success in machine learning. First, always start simple. Don't jump straight to complex algorithms like neural networks. Begin with linear models and gradually increase complexity.

Second, focus on the data. Spend more time on data preprocessing and feature engineering than on trying different algorithms. Good data preparation often leads to better results than algorithm tuning.

Third, use cross-validation to get reliable performance estimates. This helps you understand how well your model will generalize to new data.

Fourth, be aware of the bias-variance trade-off. Simple models have high bias but low variance, while complex models have low bias but high variance. You need to find the right balance.

Fifth, keep track of your experiments. Use tools like MLflow or Weights & Biases to log your models, parameters, and results. This helps you reproduce results and learn from your experiments.

Now let's discuss some common pitfalls to avoid. Overfitting is when your model performs well on training data but poorly on new data. This usually happens when the model is too complex relative to the amount of training data.

Underfitting is the opposite - when your model is too simple to capture the underlying patterns in the data. You can detect underfitting if your model performs poorly on both training and validation data.

Data leakage occurs when information from the future is accidentally included in your training data. This can happen if you're not careful about how you split your data or if you include features that wouldn't be available at prediction time.

Another common mistake is not considering the business context. A model with 95% accuracy might not be useful if it's predicting something that doesn't matter to your business.

Let's also talk about the importance of interpretability. In many real-world applications, you need to understand why your model is making certain predictions. Linear models and decision trees are highly interpretable, while neural networks are often considered black boxes.

However, there are techniques like SHAP values and LIME that can help explain complex models. These tools are becoming increasingly important as machine learning is used in critical applications like healthcare and finance.

Now let's look at some real-world applications. Machine learning is used in recommendation systems, fraud detection, medical diagnosis, autonomous vehicles, and many other areas.

Recommendation systems, like those used by Netflix and Amazon, use machine learning to suggest products or content that users might like. These systems analyze user behavior and preferences to make personalized recommendations.

Fraud detection systems use machine learning to identify suspicious transactions. They learn patterns from historical data and can flag transactions that don't follow normal patterns.

In healthcare, machine learning is used for medical image analysis, drug discovery, and patient outcome prediction. These applications can save lives and improve healthcare quality.

Autonomous vehicles rely heavily on machine learning for perception, decision-making, and control. They need to recognize objects, predict the behavior of other vehicles, and make safe driving decisions.

Let me conclude with some thoughts on the future of machine learning. The field is evolving rapidly, with new techniques and applications emerging constantly.

Deep learning has revolutionized many areas, particularly computer vision and natural language processing. However, it's important to remember that deep learning isn't always the best solution. Simpler methods often work just as well and are easier to deploy and maintain.

AutoML, or automated machine learning, is making it easier for non-experts to build machine learning models. Tools like Google's AutoML and Microsoft's Azure AutoML can automatically handle many aspects of the machine learning pipeline.

Federated learning is enabling machine learning on distributed data without sharing the raw data. This is important for privacy-sensitive applications like healthcare.

Explainable AI is becoming increasingly important as machine learning is used in critical applications. We need to be able to understand and trust the decisions made by these systems.

In conclusion, machine learning is a powerful tool that can solve complex problems and create value in many domains. However, it's not a magic bullet. Success requires careful attention to data quality, thoughtful feature engineering, appropriate model selection, and thorough evaluation.

The key is to start simple, focus on the fundamentals, and gradually build up your expertise. Remember that machine learning is both an art and a science - it requires both technical skills and domain knowledge.

Thank you for watching this comprehensive overview of machine learning fundamentals. I hope you found it helpful and that it inspires you to explore this fascinating field further.

Don't forget to like and subscribe for more content on machine learning and data science. If you have questions or want to learn more about specific topics, leave a comment below.

Until next time, keep learning and exploring the world of machine learning!
`;

async function testEnhancedNotes() {
  console.log('🧪 Testing Enhanced Notes Generation API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: testTranscript,
        title: 'Machine Learning Fundamentals: A Comprehensive Tutorial',
        duration: '45 minutes'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const notes = await response.json();
    
    console.log('✅ Notes generated successfully!\n');
    console.log('📊 Generated Content Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Title: ${notes.title}`);
    console.log(`🏷️  Content Type: ${notes.contentType || 'Not specified'}`);
    console.log(`📚 Difficulty: ${notes.difficulty || 'Not specified'}`);
    console.log(`⏱️  Study Time: ${notes.estimatedStudyTime || 'Not specified'}`);
    console.log(`📖 Sections: ${notes.sections?.length || 0}`);
    console.log(`🔑 Key Points: ${notes.keyPoints?.length || 0}`);
    console.log(`❓ Quiz Questions: ${notes.quiz?.questions?.length || 0}`);
    console.log(`🧠 Mnemonics: ${notes.mnemonics?.length || 0}`);
    console.log(`💡 Concepts: ${notes.concepts?.length || 0}`);
    console.log(`🔗 Applications: ${notes.practicalApplications?.length || 0}`);
    
    if (notes.prerequisites?.length > 0) {
      console.log(`\n📋 Prerequisites (${notes.prerequisites.length}):`);
      notes.prerequisites.forEach((prereq, i) => {
        console.log(`   ${i + 1}. ${prereq}`);
      });
    }
    
    if (notes.nextSteps?.length > 0) {
      console.log(`\n➡️  Next Steps (${notes.nextSteps.length}):`);
      notes.nextSteps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });
    }
    
    if (notes.quiz?.questions?.length > 0) {
      console.log(`\n🎯 Sample Quiz Question:`);
      const question = notes.quiz.questions[0];
      console.log(`   Q: ${question.question}`);
      question.options.forEach((option, i) => {
        console.log(`   ${i + 1}. ${option}`);
      });
      console.log(`   Answer: ${question.correctAnswer + 1} (${question.explanation})`);
    }
    
    console.log('\n🎉 Enhanced notes generation test completed successfully!');
    console.log('\n💡 To use this in your app:');
    console.log('   1. Set GROQ_API_KEY in your .env.local file');
    console.log('   2. Restart your development server');
    console.log('   3. Test with real YouTube videos');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your development server is running (npm run dev)');
    console.log('   2. Check if you have GROQ_API_KEY set in .env.local');
    console.log('   3. Verify the API endpoint is accessible');
  }
}

// Run the test
testEnhancedNotes();
